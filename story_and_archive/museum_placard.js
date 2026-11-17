/**
 * Stage 5 — Negative-Space Museum Exhibition Placard & Hero 3D Showcase Component
 *
 * Bilingual Uyghur (`ug`, RTL isolated inside text containers) + English (`en`, LTR).
 * Zero left borders, pure black/white/grey palette (`chroma = 0`), zero step fraction counters,
 * zero colons (`:`) in headlines.
 */

import {
  WALKTHROUGH_STOPS,
  HERO_FINALE_PRESETS,
  getWalkthroughStop,
  getStopForPhotoId,
} from './walkthrough_data.js';

const UI_COPY = Object.freeze({
  ug: {
    collapseLabel: 'چۈشەندۈرۈشنى يىغىش',
    expandLabel: 'چۈشەندۈرۈشنى كۆرسىتىش',
    collapseShort: 'يىغىش',
    expandShort: 'ئېچىش',
    heroPresetsHeading: 'بىناكارلىق نۇقتىلىرى 3D',
  },
  en: {
    collapseLabel: 'Hide placard text',
    expandLabel: 'Expand placard text',
    collapseShort: 'Hide',
    expandShort: 'Expand',
    heroPresetsHeading: '3D Architectural Vantages',
  },
});

function normalizePlacardLang(lang) {
  if (typeof lang === 'string' && lang.trim().toLowerCase().startsWith('en')) {
    return 'en';
  }
  return 'ug';
}

export function sanitizeStopTitle(rawTitle) {
  const str = String(rawTitle || '').trim();
  if (!str.includes(':')) return str;
  const parts = str
    .split(':')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1) return str.replace(/:/g, '').trim();
  const chosen = parts[parts.length - 1];
  return chosen.charAt(0).toUpperCase() + chosen.slice(1);
}

function createCollapseButtonNodes(isCollapsed, shortLabel, lang) {
  const text = document.createElement('span');
  text.className = 'm2-placard-toggle-text';
  text.textContent = shortLabel;
  text.dir = lang === 'ug' ? 'rtl' : 'ltr';
  text.lang = lang;

  const glyph = document.createElement('span');
  glyph.className = 'm2-placard-toggle-glyph';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = isCollapsed ? '+' : '−';

  return [text, glyph];
}

function normalizeExternalStop(raw, fallback) {
  if (!raw || typeof raw !== 'object') return fallback;
  const base = fallback || WALKTHROUGH_STOPS[0];
  const dateUg = raw.dateLabel?.ug || raw.dateShortUg || base.dateLabel.ug;
  const dateEn = raw.dateLabel?.en || raw.dateShortEn || base.dateLabel.en;
  const headUg = sanitizeStopTitle(
    raw.headline?.ug || raw.headlineUg || raw.shortTitleUg || base.headline.ug
  );
  const headEn = sanitizeStopTitle(
    raw.headline?.en || raw.headlineEn || raw.shortTitleEn || base.headline.en
  );
  const narrUg = raw.narrative?.ug || raw.narrativeUg || base.narrative.ug;
  const narrEn = raw.narrative?.en || raw.narrativeEn || base.narrative.en;
  const elevUg = raw.elevationSummary?.ug || raw.elevationSummaryUg || base.elevationSummary.ug;
  const elevEn = raw.elevationSummary?.en || raw.elevationSummaryEn || base.elevationSummary.en;
  const surfaceTheme =
    raw.placard?.surfaceTheme ||
    (raw.placardSurface === 'dark' ? 'dark_plinth' : raw.placardSurface === 'light' ? 'light_vellum' : null) ||
    base.placard.surfaceTheme;
  const normBboxXYWH =
    (Array.isArray(raw.placard?.normBboxXYWH) && raw.placard.normBboxXYWH.length >= 3
      ? raw.placard.normBboxXYWH
      : Array.isArray(raw.placardBbox) && raw.placardBbox.length >= 3
      ? raw.placardBbox
      : base.placard.normBboxXYWH);

  return {
    ...base,
    ...raw,
    stopIndex: Number.isFinite(Number(raw.stopIndex))
      ? Number(raw.stopIndex)
      : Number.isFinite(Number(raw.stopNumber))
      ? Number(raw.stopNumber)
      : base.stopIndex,
    kind: raw.kind || base.kind,
    primaryPhotoId:
      raw.primaryPhotoId !== undefined
        ? raw.primaryPhotoId
        : raw.photoId !== undefined
        ? raw.photoId
        : base.primaryPhotoId,
    dateLabel: { ug: dateUg, en: dateEn },
    headline: { ug: headUg, en: headEn },
    narrative: { ug: narrUg, en: narrEn },
    elevationSummary: { ug: elevUg, en: elevEn },
    placard: {
      ...base.placard,
      ...(raw.placard || {}),
      surfaceTheme,
      normBboxXYWH,
    },
  };
}

export class MuseumPlacard {
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('MuseumPlacard requires a valid DOM container element.');
    }
    this.container = container;
    this.lang = normalizePlacardLang(options.lang || 'ug');
    this.topSafePx = Number.isFinite(options.topSafePx) ? options.topSafePx : 68;
    this.bottomSafePx = Number.isFinite(options.bottomSafePx) ? options.bottomSafePx : 92;
    this.onSelectHeroPreset = options.onSelectHeroPreset || null;
    this.onCollapsedChange =
      typeof options.onCollapsedChange === 'function' ? options.onCollapsedChange : null;
    this._customStops = Array.isArray(options.stops) && options.stops.length > 0 ? options.stops : null;

    this._stop = this._resolveStop(options.initialStopIndex || 1);
    this._plateRect = null;
    this._is3DRevealed = false;
    this._activeHeroPresetId = 'overview';
    this._userToggledCollapse = typeof options.collapsed === 'boolean';
    this._collapsed =
      typeof options.collapsed === 'boolean' ? options.collapsed : this._isMobileViewport();
    this._visible = true;
    this._pointerDownPos = null;

    this._root = document.createElement('aside');
    this._root.className = 'm2-placard';
    this._root.classList.toggle('is-collapsed', this._collapsed);
    this._root.setAttribute('data-collapsed', this._collapsed ? 'true' : 'false');
    this._root.setAttribute('aria-live', 'polite');

    this._buildSkeleton();
    this.container.appendChild(this._root);

    this._onWindowResize = () => {
      if (!this._userToggledCollapse) {
        const shouldCollapse = this._isMobileViewport();
        if (this._collapsed !== shouldCollapse) {
          this.setCollapsed(shouldCollapse, { user: false });
          return;
        }
      }
      this._applyPosition();
    };
    window.addEventListener('resize', this._onWindowResize, { passive: true });

    this._renderContent();
    this._applyPosition();
  }

  _isMobileViewport() {
    return typeof window !== 'undefined' && (window.innerWidth || 1440) <= 860;
  }

  _resolveStop(stopIndexOrId, explicitStop = null) {
    const canonical = getWalkthroughStop(stopIndexOrId);
    if (explicitStop && typeof explicitStop === 'object') {
      const hasCustomNarrative = Boolean(
        explicitStop.narrative?.ug || explicitStop.narrativeUg ||
        explicitStop.narrative?.en || explicitStop.narrativeEn
      );
      if (hasCustomNarrative) {
        return normalizeExternalStop(explicitStop, canonical);
      }
      const photoQuery = explicitStop.photoId || explicitStop.primaryPhotoId;
      const matchedCanonical = photoQuery
        ? getStopForPhotoId(photoQuery) || getWalkthroughStop(explicitStop.stopId || stopIndexOrId)
        : getWalkthroughStop(explicitStop.stopId || stopIndexOrId);
      return normalizeExternalStop(explicitStop, matchedCanonical);
    }
    if (this._customStops) {
      const idx =
        typeof stopIndexOrId === 'number' && Number.isFinite(stopIndexOrId)
          ? Math.max(1, Math.min(this._customStops.length, Math.round(stopIndexOrId))) - 1
          : this._customStops.findIndex((s) => s.stopId === stopIndexOrId);
      if (idx >= 0 && this._customStops[idx]) {
        return normalizeExternalStop(this._customStops[idx], canonical);
      }
    }
    return canonical;
  }

  get element() {
    return this._root;
  }

  getCurrentStop() {
    return this._stop;
  }

  getActiveHeroPreset() {
    return (
      HERO_FINALE_PRESETS.find((p) => p.presetId === this._activeHeroPresetId) ||
      HERO_FINALE_PRESETS[0]
    );
  }

  setStops(customStops) {
    this._customStops = Array.isArray(customStops) && customStops.length > 0 ? customStops : null;
    this._stop = this._resolveStop(this._stop.stopIndex);
    this._renderContent();
    this._applyPosition();
  }

  setStop(stopIndexOrId, state = {}) {
    const nextStop = this._resolveStop(stopIndexOrId, state.stop || null);
    const stopChanged = nextStop.stopIndex !== this._stop.stopIndex;
    this._stop = nextStop;

    if (state.plateRect !== undefined) {
      this._plateRect = state.plateRect;
    }
    if (state.is3DRevealed !== undefined) {
      this._is3DRevealed = Boolean(state.is3DRevealed);
    }
    if (state.activeHeroPresetId !== undefined) {
      this._activeHeroPresetId = state.activeHeroPresetId;
    } else if (stopChanged && nextStop.kind === 'hero_3d_model_finale') {
      this._activeHeroPresetId = 'overview';
    }

    this._renderContent();
    this._applyPosition();
  }

  updatePlateRect(plateRect) {
    this._plateRect = plateRect || null;
    this._applyPosition();
  }

  set3DRevealState(isRevealed) {
    const next = Boolean(isRevealed);
    if (this._is3DRevealed === next) return;
    this._is3DRevealed = next;
    this._renderContent();
    this._applyPosition();
  }

  setActiveHeroPreset(presetId) {
    if (!presetId || this._activeHeroPresetId === presetId) return;
    this._activeHeroPresetId = presetId;
    if (this._stop.kind === 'hero_3d_model_finale') {
      this._renderContent();
      this._applyPosition();
    }
  }

  setLanguage(lang) {
    const normalized = normalizePlacardLang(lang);
    if (this.lang === normalized) return;
    this.lang = normalized;
    this._renderContent();
    this._applyPosition();
  }

  isCollapsed() {
    return this._collapsed;
  }

  setCollapsed(collapsed, { user = true } = {}) {
    if (user) {
      this._userToggledCollapse = true;
    }
    const next = Boolean(collapsed);
    const changed = this._collapsed !== next;
    this._collapsed = next;
    this._root.classList.toggle('is-collapsed', this._collapsed);
    this._root.setAttribute('data-collapsed', this._collapsed ? 'true' : 'false');
    this._syncCollapseButton();
    this._applyPosition();
    if (changed) {
      this._root.scrollTop = 0;
      if (typeof this.onCollapsedChange === 'function') {
        this.onCollapsedChange(this._collapsed);
      }
    }
  }

  setVisible(visible) {
    this._visible = Boolean(visible);
    this._root.hidden = !this._visible;
  }

  destroy() {
    window.removeEventListener('resize', this._onWindowResize);
    if (this._root && this._root.parentNode) {
      this._root.parentNode.removeChild(this._root);
    }
  }

  _buildSkeleton() {
    this._eyebrowRow = document.createElement('div');
    this._eyebrowRow.className = 'm2-placard-eyebrow-row';

    this._metaEl = document.createElement('div');
    this._metaEl.className = 'm2-placard-meta';

    this._collapseBtn = document.createElement('button');
    this._collapseBtn.type = 'button';
    this._collapseBtn.className = 'm2-placard-collapse-btn';
    this._collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setCollapsed(!this._collapsed);
    });

    this._root.addEventListener('pointerdown', (e) => {
      this._pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    this._root.addEventListener('click', (e) => {
      if (this._pointerDownPos) {
        const dx = e.clientX - this._pointerDownPos.x;
        const dy = e.clientY - this._pointerDownPos.y;
        this._pointerDownPos = null;
        if (Math.hypot(dx, dy) > 8) return;
      }
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (target.closest('button, a, input, select, textarea, [role="button"], .m2-hero-preset-grid')) {
        return;
      }
      const sel = typeof window !== 'undefined' ? window.getSelection?.() : null;
      if (sel && !sel.isCollapsed && this._root.contains(sel.anchorNode)) {
        return;
      }
      this.setCollapsed(!this._collapsed);
    });

    this._eyebrowRow.appendChild(this._metaEl);
    this._eyebrowRow.appendChild(this._collapseBtn);

    this._headlineEl = document.createElement('h2');
    this._headlineEl.className = 'm2-placard-headline';

    this._bodyEl = document.createElement('div');
    this._bodyEl.className = 'm2-placard-body';

    this._narrativeEl = document.createElement('p');
    this._narrativeEl.className = 'm2-placard-narrative';

    this._elevationEl = document.createElement('div');
    this._elevationEl.className = 'm2-placard-elevation';

    this._heroWrapEl = document.createElement('div');
    this._heroWrapEl.className = 'm2-hero-presets';

    this._bodyEl.appendChild(this._narrativeEl);
    this._bodyEl.appendChild(this._elevationEl);
    this._bodyEl.appendChild(this._heroWrapEl);

    this._root.appendChild(this._eyebrowRow);
    this._root.appendChild(this._headlineEl);
    this._root.appendChild(this._bodyEl);
  }

  _syncCollapseButton() {
    const copy = UI_COPY[this.lang] || UI_COPY.ug;
    const label = this._collapsed ? copy.expandLabel : copy.collapseLabel;
    const shortLabel = this._collapsed ? copy.expandShort : copy.collapseShort;
    this._collapseBtn.setAttribute('aria-label', label);
    this._collapseBtn.setAttribute('title', label);
    this._collapseBtn.setAttribute('aria-expanded', String(!this._collapsed));
    this._collapseBtn.replaceChildren(
      ...createCollapseButtonNodes(this._collapsed, shortLabel, this.lang)
    );
  }

  _renderContent() {
    const stop = this._stop;
    const lang = this.lang;
    const textDir = lang === 'ug' ? 'rtl' : 'ltr';
    const copy = UI_COPY[lang] || UI_COPY.ug;

    const theme =
      this._is3DRevealed && stop.kind !== 'hero_3d_model_finale'
        ? 'dark_plinth'
        : stop.placard.surfaceTheme;
    this._root.setAttribute('data-theme', theme);
    this._root.setAttribute('data-stop-index', String(stop.stopIndex));

    const dateSpan = document.createElement('span');
    dateSpan.textContent = stop.dateLabel?.[lang] || stop.dateLabel?.en || '';
    this._metaEl.dir = textDir;
    this._metaEl.lang = lang;
    this._metaEl.replaceChildren(dateSpan);

    this._syncCollapseButton();
    this._headlineEl.dir = textDir;
    this._headlineEl.lang = lang;
    this._headlineEl.textContent = sanitizeStopTitle(
      stop.headline?.[lang] || stop.headline?.en || ''
    );

    this._narrativeEl.dir = textDir;
    this._narrativeEl.lang = lang;
    this._narrativeEl.textContent = stop.narrative?.[lang] || stop.narrative?.en || '';

    const elevText = stop.elevationSummary?.[lang] || stop.elevationSummary?.en || '';
    this._elevationEl.dir = textDir;
    this._elevationEl.lang = lang;
    this._elevationEl.textContent = elevText;
    this._elevationEl.hidden = !elevText;

    this._heroWrapEl.replaceChildren();
    if (stop.kind === 'hero_3d_model_finale') {
      const heading = document.createElement('div');
      heading.className = 'm2-placard-section-label';
      heading.dir = textDir;
      heading.lang = lang;
      heading.textContent = copy.heroPresetsHeading;

      const grid = document.createElement('div');
      grid.className = 'm2-hero-preset-grid';

      const activePreset = this.getActiveHeroPreset();
      for (const preset of HERO_FINALE_PRESETS) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'm2-hero-preset-btn';
        if (preset.presetId === activePreset.presetId) {
          btn.classList.add('is-active');
        }
        const leftWrap = document.createElement('span');
        leftWrap.dir = textDir;
        leftWrap.lang = lang;
        leftWrap.textContent = preset.label?.[lang] || preset.label?.en || '';

        const numEl = document.createElement('span');
        numEl.className = 'm2-hero-preset-num';
        numEl.textContent = preset.numeral === '0' ? '3D' : preset.numeral;

        btn.append(leftWrap, numEl);
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._activeHeroPresetId = preset.presetId;
          this._renderContent();
          this._applyPosition();
          if (typeof this.onSelectHeroPreset === 'function') {
            this.onSelectHeroPreset(preset, stop);
          }
        });
        grid.appendChild(btn);
      }

      const cap = document.createElement('p');
      cap.className = 'm2-hero-preset-caption';
      cap.dir = textDir;
      cap.lang = lang;
      cap.textContent = activePreset.caption?.[lang] || activePreset.caption?.en || '';

      this._heroWrapEl.append(heading, grid, cap);
      this._heroWrapEl.hidden = false;
    } else {
      this._heroWrapEl.hidden = true;
    }
  }

  _applyPosition() {
    if (typeof window === 'undefined' || !this._visible) return;
    const vw = window.innerWidth || 1440;
    const vh = window.innerHeight || 900;

    if (vw <= 860) {
      this._root.style.left = '';
      this._root.style.top = '';
      return;
    }

    const cardRect = this._root.getBoundingClientRect();
    const cardW = cardRect.width > 40 ? cardRect.width : 352;
    const cardH = cardRect.height > 40 ? cardRect.height : 220;

    const [bx, by] = this._stop.placard.normBboxXYWH;

    const targetX = Math.max(24, Math.round(vw * bx));
    const targetY = Math.max(this.topSafePx, Math.round(vh * by));

    const maxX = Math.max(20, vw - cardW - 22);
    const maxY = Math.max(this.topSafePx, vh - this.bottomSafePx - cardH);

    const clampedX = Math.max(20, Math.min(maxX, targetX));
    const clampedY = Math.max(this.topSafePx, Math.min(maxY, targetY));

    this._root.style.left = `${clampedX}px`;
    this._root.style.top = `${clampedY}px`;
  }
}

export function createMuseumPlacard(container, options = {}) {
  return new MuseumPlacard(container, options);
}
