/**
 * Early-Boot Parallel Asset & PBR Worker Orchestrator (`startup_orchestrator.js`)
 *
 * Launches the 3 parallel background Web Workers for procedural PBR banks at page start
 * with immediate empty portal catalog resolution (no legacy Eiffel photo fetches).
 */

export const STOP01_PLATE_REL_URL = '';
export const STOP02_PLATE_REL_URL = '';

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

function runSinglePbrWorker(task, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('Web Worker API unavailable'));
      return;
    }

    let worker = null;
    let settled = false;
    let timer = null;

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (worker) {
        try {
          worker.terminate();
        } catch {
          // Ignore worker termination errors
        }
        worker = null;
      }
    };

    try {
      worker = new Worker(new URL('./pbr_worker.js', import.meta.url), {
        type: 'module',
        name: `s4_pbr_${task}`,
      });
    } catch (err) {
      cleanup();
      reject(err);
      return;
    }

    timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`PBR worker timed out on task: ${task}`));
    }, timeoutMs);

    worker.onmessage = (ev) => {
      if (settled) return;
      settled = true;
      const payload = ev?.data || {};
      cleanup();
      if (payload.ok && payload.result) {
        resolve({
          result: payload.result,
          workerDurationMs: payload.durationMs ?? null,
        });
      } else {
        reject(new Error(payload.error || `PBR worker failed on task: ${task}`));
      }
    };

    worker.onerror = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(err?.message || `PBR worker error on task: ${task}`));
    };

    worker.postMessage({ id: 1, task });
  });
}

async function synthesizePbrFallbackOnMainThread(task) {
  if (task === 'floor') {
    const { synthesizeFloorTextureRawBank } = await import('./model/floor_textures.js');
    return { floor: synthesizeFloorTextureRawBank() };
  }
  if (task === 'tower_and_world') {
    const [{ synthesizeTowerPbrRawBank }, { synthesizeSketchWorldRawMaps }] = await Promise.all([
      import('./model/materials.js'),
      import('./world/sketch_materials.js'),
    ]);
    return {
      tower: synthesizeTowerPbrRawBank(),
      world: synthesizeSketchWorldRawMaps(),
    };
  }
  const [
    { synthesizeFloorTextureRawBank },
    { synthesizeTowerPbrRawBank },
    { synthesizeSketchWorldRawMaps },
  ] = await Promise.all([
    import('./model/floor_textures.js'),
    import('./model/materials.js'),
    import('./world/sketch_materials.js'),
  ]);
  return {
    floor: synthesizeFloorTextureRawBank(),
    tower: synthesizeTowerPbrRawBank(),
    world: synthesizeSketchWorldRawMaps(),
  };
}

export function startEarlyBootPipeline() {
  const tStart = nowMs();
  const timings = {
    pipelineStartMs: Number(tStart.toFixed(2)),
    catalogsReadyMs: 0,
    pbrFloorWorkerMs: null,
    pbrTowerWorldWorkerMs: null,
    pbrRawReadyMs: null,
    pbrUsedWorkers: true,
    stop01DecodeReadyMs: 0,
    stop02DecodeReadyMs: 0,
  };

  const catalogsPromise = Promise.resolve({ photoCameras: { cameras: [] } });

  const floorAPromise = runSinglePbrWorker('floor_a').catch(() => null);
  const floorBPromise = runSinglePbrWorker('floor_b').catch(() => null);

  const floorPromise = Promise.all([floorAPromise, floorBPromise]).then(async ([resA, resB]) => {
    if (resA?.result?.floorPart && resB?.result?.floorPart) {
      timings.pbrFloorWorkerMs = Number(
        Math.max(resA.workerDurationMs || 0, resB.workerDurationMs || 0).toFixed(2)
      );
      return { ...resA.result.floorPart, ...resB.result.floorPart };
    }
    timings.pbrUsedWorkers = false;
    const fb = await synthesizePbrFallbackOnMainThread('floor');
    return fb.floor;
  });

  const towerWorldPromise = runSinglePbrWorker('tower_and_world')
    .then(({ result, workerDurationMs }) => {
      timings.pbrTowerWorldWorkerMs = workerDurationMs;
      return result;
    })
    .catch(async () => {
      timings.pbrUsedWorkers = false;
      return synthesizePbrFallbackOnMainThread('tower_and_world');
    });

  const pbrRawPromise = Promise.all([floorPromise, towerWorldPromise]).then(
    ([floor, towerAndWorld]) => {
      timings.pbrRawReadyMs = Number((nowMs() - tStart).toFixed(2));
      return {
        floor,
        tower: towerAndWorld.tower,
        world: towerAndWorld.world,
      };
    }
  );

  const stop01ImagePromise = Promise.resolve(null);
  const stop02ImagePromise = Promise.resolve(null);

  return {
    catalogsPromise,
    pbrRawPromise,
    stop01ImagePromise,
    stop02ImagePromise,
    timings,
  };
}

export const bootPipeline =
  typeof window !== 'undefined'
    ? startEarlyBootPipeline()
    : null;
