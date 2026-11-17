/**
 * Stage 6 — Post-Load Monochrome Intro & 'Explore' Entry Overlay (`museum_v2`)
 *
 * Once asset loading completes, presents the full completed Kashgar Id Kah Mosque (`step = 11.0`)
 * unobstructed in the 3D background with a calm, pure monochrome (`chroma = 0`)
 * museum title & 'Explore' button in the lower-left margin.
 */

const INTRO_STRINGS = Object.freeze({
  ug: {
    regionAria: 'كۆرگەزمە تونۇشتۇرۇلۇشى',
    eyebrow: '1442–ھازىر · قەشقەر بوستانلىقى',
    title: 'قەشقەر ھېيتگاھ مەسچىتى',
    subtitle:
      'قەشقەر تارىخىي مەركىزىدىكى 1442-يىلى قۇرۇلغان ھېيتگاھ مەسچىتى، زەپەران رەڭلىك دەرۋازا پېشتاقى، قوش مۇنار ۋە 140 تۈۋرۈكلۈك نامازگاھنىڭ ئۈچ ئۆلچەملىك بىناكارلىق كۆرگەزمىسى.',
    exploreLabel: 'كۆرۈشنى باشلاش',
    exploreAria: 'قەشقەر ھېيتگاھ مەسچىتى 3D بىناكارلىق كۆرگەزمىسىنى باشلاش',
  },
  en: {
    regionAria: 'Exhibition introduction',
    eyebrow: '1442–Present · Kashgar Oasis',
    title: 'Id Kah Mosque in Kashgar',
    subtitle:
      'Founded in 1442 at the heart of Kashgar’s Old City, reconstructed in three dimensions from its saffron-ochre gatehouse and twin minarets to the 140-pillar Namazgah prayer hall.',
    exploreLabel: 'Explore',
    exploreAria: 'Explore the Kashgar Id Kah Mosque 3D exhibition',
  },
});

function normalizeLang(raw) {
  return String(raw || '').trim().toLowerCase().startsWith('en') ? 'en' : 'ug';
}

function isTruthyParam(val) {
  const s = String(val || '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

function isFalsyParam(val) {
  const s = String(val || '').trim().toLowerCase();
  return s === '0' || s === 'false' || s === 'no';
}

export function shouldStartInLandingMode(searchString = undefined) {
  const raw =
    searchString !== undefined
      ? String(searchString || '')
      : typeof window !== 'undefined' && window.location
      ? window.location.search
      : '';
  if (!raw) return true;

  try {
    const params = new URLSearchParams(raw);
    if (params.has('intro') && isFalsyParam(params.get('intro'))) return false;
    if (params.has('skipIntro') && isTruthyParam(params.get('skipIntro'))) return false;
    if (params.has('stop') && String(params.get('stop') || '').trim() !== '') return false;
    if (params.has('photo') && String(params.get('photo') || '').trim() !== '') return false;
    if (params.has('chapter') && String(params.get('chapter') || '').trim() !== '') return false;
    if (isTruthyParam(params.get('autoplay'))) return false;
    if (isTruthyParam(params.get('record'))) return false;
    if (isTruthyParam(params.get('deterministic'))) return false;
    if (isTruthyParam(params.get('debug'))) return false;
  } catch {
    return true;
  }
  return true;
}

export class LandingIntro {
  constructor({
    container = null,
    parent = null,
    lang = 'ug',
    active = true,
    onExplore = null,
  } = {}) {
    this._lang = normalizeLang(lang);
    this._active = Boolean(active);
    this.onExplore = typeof onExplore === 'function' ? onExplore : null;

    this.el = null;
    this._eyebrowEl = null;
    this._titleEl = null;
    this._subtitleEl = null;
    this._exploreBtn = null;
    this._exploreLabelEl = null;

    this._mount(container, parent);
    this._syncDom();
  }

  _mount(container, parent) {
    if (typeof document === 'undefined') return;

    let root = null;
    if (typeof container === 'string') {
      root = document.querySelector(container);
    } else if (container instanceof HTMLElement) {
      root = container;
    }
    if (!root) {
      root = document.getElementById('museum-landing-intro');
    }
    if (!root) {
      root = document.createElement('section');
      root.id = 'museum-landing-intro';
      const host =
        (parent instanceof HTMLElement && parent) ||
        document.getElementById('museum-ui-root') ||
        document.getElementById('monograph-ui') ||
        document.body;
      host.appendChild(root);
    }

    root.className = 'm2-landing-intro';
    root.setAttribute('role', 'region');
    root.replaceChildren();

    const eyebrow = document.createElement('div');
    eyebrow.id = 'landing-intro-eyebrow';
    eyebrow.className = 'm2-landing-eyebrow';

    const title = document.createElement('h1');
    title.id = 'landing-intro-title';
    title.className = 'm2-landing-title';

    const subtitle = document.createElement('p');
    subtitle.id = 'landing-intro-subtitle';
    subtitle.className = 'm2-landing-subtitle';

    const exploreBtn = document.createElement('button');
    exploreBtn.type = 'button';
    exploreBtn.id = 'btn-landing-explore';
    exploreBtn.className = 'm2-landing-explore-btn';

    const exploreLabel = document.createElement('span');
    exploreLabel.className = 'm2-landing-explore-label';

    const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowSvg.setAttribute('viewBox', '0 0 24 24');
    arrowSvg.setAttribute('aria-hidden', 'true');
    arrowSvg.classList.add('m2-landing-explore-icon');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '5');
    line.setAttribute('y1', '12');
    line.setAttribute('x2', '19');
    line.setAttribute('y2', '12');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '13 6 19 12 13 18');
    arrowSvg.append(line, poly);

    exploreBtn.append(exploreLabel, arrowSvg);
    exploreBtn.addEventListener('click', () => {
      if (!this._active) return;
      if (typeof this.onExplore === 'function') {
        this.onExplore();
      }
    });

    root.append(eyebrow, title, subtitle, exploreBtn);

    this.el = root;
    this._eyebrowEl = eyebrow;
    this._titleEl = title;
    this._subtitleEl = subtitle;
    this._exploreBtn = exploreBtn;
    this._exploreLabelEl = exploreLabel;
  }

  _syncDom() {
    if (!this.el) return;
    const copy = INTRO_STRINGS[this._lang] || INTRO_STRINGS.ug;
    const textDir = this._lang === 'ug' ? 'rtl' : 'ltr';

    this.el.setAttribute('aria-label', copy.regionAria);

    this._eyebrowEl.dir = textDir;
    this._eyebrowEl.lang = this._lang;
    this._eyebrowEl.textContent = copy.eyebrow;

    this._titleEl.dir = textDir;
    this._titleEl.lang = this._lang;
    this._titleEl.textContent = copy.title;

    this._subtitleEl.dir = textDir;
    this._subtitleEl.lang = this._lang;
    this._subtitleEl.textContent = copy.subtitle;

    this._exploreLabelEl.dir = textDir;
    this._exploreLabelEl.lang = this._lang;
    this._exploreLabelEl.textContent = copy.exploreLabel;

    this._exploreBtn.setAttribute('aria-label', copy.exploreAria);

    this.el.hidden = !this._active;
    this.el.setAttribute('aria-hidden', this._active ? 'false' : 'true');
    this.el.classList.toggle('is-active', this._active);

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('landing-intro-active', this._active);
    }
  }

  isActive() {
    return this._active;
  }

  setActive(active) {
    const next = Boolean(active);
    this._active = next;
    this._syncDom();
    return this._active;
  }

  setLanguage(lang) {
    this._lang = normalizeLang(lang);
    this._syncDom();
    return this._lang;
  }

  getLanguage() {
    return this._lang;
  }

  dispose() {
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('landing-intro-active');
    }
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}

export function createLandingIntro(options = {}) {
  return new LandingIntro(options);
}
