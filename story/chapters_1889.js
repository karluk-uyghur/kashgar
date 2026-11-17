/**
 * Bilingual Curation Registry for Kashgar Id Kah Mosque (`story/chapters_1889.js`)
 *
 * Default language: Uyghur (`ug`, Arabic script), paired with English (`en`).
 */

import { CURATION_ENTRIES_EN } from './chapters_1889_en.js';

export const DEFAULT_LANGUAGE = 'ug';

export function normalizeLanguage(lang) {
  if (typeof lang === 'string' && lang.trim().toLowerCase().startsWith('en')) {
    return 'en';
  }
  return 'ug';
}

export const PHOTO_CHRONOLOGICAL_IDS = Object.freeze([]);
export const CHAMP_DE_MARS_TIMELAPSE_IDS = [];

const CURATION_ENTRIES_UG = Object.freeze([]);

function normalizeCurationPhotoId(raw) {
  if (raw === null || raw === undefined) return '';
  const s = String(raw).trim().replace(/^#/, '');
  if (!s) return '';
  return /^\d$/.test(s) ? s.padStart(2, '0') : s;
}

const _curationMapEn = new Map(CURATION_ENTRIES_EN.map((entry) => [entry.photoId, entry]));
const _curationMapUg = new Map(CURATION_ENTRIES_UG.map((entry) => [entry.photoId, entry]));

export function getPhotoCuration(photoId, lang = DEFAULT_LANGUAGE) {
  const pid = normalizeCurationPhotoId(photoId);
  if (!pid) return null;
  const map = normalizeLanguage(lang) === 'en' ? _curationMapEn : _curationMapUg;
  return map.get(pid) || null;
}

export const PHOTO_CURATION_1889 = {};
for (const entry of CURATION_ENTRIES_UG) {
  PHOTO_CURATION_1889[entry.photoId] = entry;
}

Object.defineProperties(PHOTO_CURATION_1889, {
  get: {
    value: (id, lang = DEFAULT_LANGUAGE) => getPhotoCuration(id, lang),
    enumerable: false,
  },
  has: {
    value: (id) => _curationMapUg.has(normalizeCurationPhotoId(id)),
    enumerable: false,
  },
});
