/**
 * Story Walkthrough Barrel Entry (`story_and_archive/index.js`)
 *
 * Exposes the 8-stop chronological Kashgar Id Kah Mosque walkthrough data and `MuseumPlacard`.
 */

export {
  WALKTHROUGH_STOPS,
  HERO_FINALE_PRESETS,
  LEGACY_CHAPTER_TO_STOP_MAP,
  getWalkthroughStop,
  getStopForPhotoId,
} from './walkthrough_data.js';

export { MuseumPlacard, createMuseumPlacard, sanitizeStopTitle } from './museum_placard.js';
