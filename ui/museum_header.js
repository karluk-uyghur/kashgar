/**
 * Quiet Top-Right Museum Header (`museum_v2`)
 *
 * Neutral black/white/grey gallery header containing:
 *   1. `UG · EN` bilingual toggle (Uyghur default / English)
 *   2. Optional discreet Pure View toggle
 */

const HEADER_STRINGS = {
  ug: {
    navAria: 'كۆرگەزمە تىلى ۋە كۆرۈنۈش كونتروللىرى',
    langAria: 'كۆرگەزمە تىلىنى ئالماشتۇرۇش (ئۇيغۇرچە / English)',
    pureViewTitle: 'ساپ 3D كۆرۈنۈش',
    restoreTitle: 'كۆرگەزمە رامكىسىنى ئەسلىگە كەلتۈرۈش',
  },
  en: {
    navAria: 'Exhibition language and view controls',
    langAria: 'Switch exhibition language (Uyghur / English)',
    pureViewTitle: 'Unobstructed exhibition view',
    restoreTitle: 'Restore exhibition interface',
  },
};

function normalizeLang(raw) {
  return String(raw || '').trim().toLowerCase().startsWith('en') ? 'en' : 'ug';
}

export class MuseumHeader {
  constructor({
    container = null,
    parent = null,
    lang = 'ug',
    enablePureViewButton = true,
    onLanguageChange = null,
    onPureViewChange = null,
  } = {}) {
    this._lang = normalizeLang(lang);
    this._enablePureView = Boolean(enablePureViewButton);
    this._pureViewActive = false;

    this.onLanguageChange = typeof onLanguageChange === 'function' ? onLanguageChange : null;
    this.onPureViewChange = typeof onPureViewChange === 'function' ? onPureViewChange : null;

    this.el = null;
    this._zenExitBtn = null;
    this._dom = {};

    this._mount(container, parent);
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
      root = document.getElementById('museum-header');
    }

    if (!root) {
      root = document.createElement('nav');
      root.id = 'museum-header';
      const host =
        (parent instanceof HTMLElement && parent) ||
        document.getElementById('museum-ui-root') ||
        document.getElementById('monograph-ui') ||
        document.body;
      host.appendChild(root);
    }

    root.className = 'museum-header';
    root.innerHTML = '';

    // 1. UG · EN Language Toggle
    const langBtn = document.createElement('button');
    langBtn.type = 'button';
    langBtn.id = 'btn-lang-toggle';
    langBtn.className = 'museum-header-btn';

    const ugSpan = document.createElement('span');
    ugSpan.className = 'museum-lang-opt';
    ugSpan.dataset.langOpt = 'ug';
    ugSpan.textContent = 'UG';

    const sepSpan = document.createElement('span');
    sepSpan.className = 'museum-lang-sep';
    sepSpan.setAttribute('aria-hidden', 'true');
    sepSpan.textContent = '·';

    const enSpan = document.createElement('span');
    enSpan.className = 'museum-lang-opt';
    enSpan.dataset.langOpt = 'en';
    enSpan.textContent = 'EN';

    langBtn.append(ugSpan, sepSpan, enSpan);
    langBtn.addEventListener('click', () => {
      const next = this._lang === 'ug' ? 'en' : 'ug';
      this.setLanguage(next, { emit: true });
    });

    root.append(langBtn);

    // 2. Optional Pure View Button
    let zenBtn = null;
    if (this._enablePureView) {
      const div2 = document.createElement('span');
      div2.className = 'museum-header-divider';
      div2.setAttribute('role', 'separator');
      div2.setAttribute('aria-hidden', 'true');

      zenBtn = document.createElement('button');
      zenBtn.type = 'button';
      zenBtn.id = 'btn-zen-enter';
      zenBtn.className = 'museum-header-btn museum-header-btn--icon';
      zenBtn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      `;
      zenBtn.addEventListener('click', () => {
        this.setPureView(true, { emit: true });
      });
      root.append(div2, zenBtn);

      let exitBtn = document.getElementById('btn-zen-exit');
      if (!exitBtn) {
        exitBtn = document.createElement('button');
        exitBtn.type = 'button';
        exitBtn.id = 'btn-zen-exit';
        exitBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        `;
        document.body.appendChild(exitBtn);
      }
      exitBtn.addEventListener('click', () => {
        this.setPureView(false, { emit: true });
      });
      this._zenExitBtn = exitBtn;
    }

    this.el = root;
    this._dom = {
      langBtn,
      ugSpan,
      enSpan,
      zenBtn,
    };

    this._syncStrings();
  }

  _syncStrings() {
    if (!this.el) return;
    const t = HEADER_STRINGS[this._lang] || HEADER_STRINGS.ug;
    this.el.setAttribute('aria-label', t.navAria);
    this._dom.langBtn.setAttribute('aria-label', t.langAria);
    this._dom.langBtn.title = t.langAria;
    this._dom.ugSpan.classList.toggle('is-active', this._lang === 'ug');
    this._dom.enSpan.classList.toggle('is-active', this._lang === 'en');

    if (this._dom.zenBtn) {
      this._dom.zenBtn.setAttribute('aria-label', t.pureViewTitle);
      this._dom.zenBtn.title = t.pureViewTitle;
    }
    if (this._zenExitBtn) {
      this._zenExitBtn.setAttribute('aria-label', t.restoreTitle);
      this._zenExitBtn.title = t.restoreTitle;
    }
  }

  setLanguage(lang, { emit = false } = {}) {
    const next = normalizeLang(lang);
    this._lang = next;
    this._syncStrings();
    if (emit && this.onLanguageChange) {
      this.onLanguageChange(next);
    }
    return this._lang;
  }

  getLanguage() {
    return this._lang;
  }

  setArchiveCount(_count) {}

  setPureView(active, { emit = false } = {}) {
    this._pureViewActive = Boolean(active);
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('zen-mode', this._pureViewActive);
    }
    if (emit && this.onPureViewChange) {
      this.onPureViewChange(this._pureViewActive);
    }
    return this._pureViewActive;
  }

  getPureView() {
    return this._pureViewActive;
  }

  dispose() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}

export function createMuseumHeader(options = {}) {
  return new MuseumHeader(options);
}
