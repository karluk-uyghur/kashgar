/**
 * Chronological Story Walkthrough + Hero 3D Showcase Data (`walkthrough_data.js`)
 * Kashgar Id Kah Mosque (`قەشقەر ھېيتگاھ مەسچىتى`), 1442–Present.
 *
 * Key Guarantees:
 *   - 8 stops matching `WALKTHROUGH_MILESTONES = [1.2, 2.6, 4.0, 5.5, 7.2, 8.8, 10.0, 11.0]`
 *   - Bilingual Uyghur (`ug`, default) and English (`en`) copy
 *   - Zero colons (`:`) in any stop title/headline
 *   - Whole-meter dimensions only (zero decimal meter values)
 *   - Zero legacy Eiffel photo fetches (`primaryPhotoId: null`)
 */

export const WALKTHROUGH_STOPS = Object.freeze([
  {
    stopIndex: 1,
    stopId: 'stop_01_foundations_howz_1442',
    kind: 'architectural_stage',
    primaryPhotoId: null,
    calibratedStep: 1.2,
    flightDurationSec: 2.8,
    cameraPose: {
      position: [28.0, 12.0, 22.0],
      target: [0.0, 1.5, -16.0],
      fov: 44.0,
    },
    dateLabel: {
      ug: '1442-يىلى',
      en: '1442',
    },
    shortLabel: {
      ug: '1442-يىلى · ئاساس ۋە كۆلچەك',
      en: '1442 · Foundations and Howz Basin',
    },
    elevationSummary: {
      ug: 'تۈمەن دەرياسى قىرغىقى · پىششىق خىش ئاساس · كۆلچەك ۋە 140 تۈۋرۈك ئورنى',
      en: 'Tuman Canal Bank · Fired Brick Plinths · Howz Basin and 140 Column Pads',
    },
    headline: {
      ug: 'ساقىز مىرزا قۇرۇلۇشى ۋە كۆلچەك ئاساسى',
      en: 'Early Oasis Foundations and the Howz Basin',
    },
    narrative: {
      ug: '1442-يىلى قەشقەر ھۆكۈمرانى ساقىز مىرزا بۇ مۇبارەك زېمىندا تۇنجى نامازگاھنىڭ پىششىق خىش ئاساسىنى سالدۇرغان. سۇ يېتىپ كېلىدىغان ھويلىدىكى كۆلچەك ۋە تۇپراق تەكشىلىكى كېيىنكى چوڭ ھويلىنىڭ تۈزۈلۈشىگە ئۇل سالدى.',
      en: 'In 1442, Kashgar ruler Saqsiz Mirza laid the earliest fired-brick plinths beside the Tuman Canal terrace. Beneath the courtyard cistern (Howz) and sandy oasis loam, recessed stone pads mark the future grid of the grand prayer hall.',
    },
    placard: {
      normBboxXYWH: [0.03, 0.09, 0.27, 0.3],
      surfaceTheme: 'dark_plinth',
    },
  },
  {
    stopIndex: 2,
    stopId: 'stop_02_courtyard_riwaq_1538',
    kind: 'architectural_stage',
    primaryPhotoId: null,
    calibratedStep: 2.6,
    flightDurationSec: 3.0,
    cameraPose: {
      position: [34.0, 14.0, 10.0],
      target: [0.0, 2.5, -18.0],
      fov: 42.0,
    },
    dateLabel: {
      ug: '1538-يىلى',
      en: '1538',
    },
    shortLabel: {
      ug: '1538-يىلى · ھويلا ۋە راۋاق',
      en: '1538 · Courtyard and Riwaq Arcades',
    },
    elevationSummary: {
      ug: '5 مېتىرلىق ئىچكى ھويلا تاملىرى · شىمال-جەنۇب راۋاقلىرى · سايە باغلار',
      en: '5 m Enclosed Perimeter Walls · North-South Riwaq Arcades · Shaded Courtyard',
    },
    headline: {
      ug: 'خىش ھويلا ۋە ئىككى تەرەپ راۋاقلىرى',
      en: 'Brick Courtyard Paving and Riwaq Cloisters',
    },
    narrative: {
      ug: '1538-يىلى قەشقەر ۋالىيسى ئابدۇكەرىم خان تەرىپىدىن مەسچىت ھويلىسى كېڭەيتىلىپ، تەخمىنەن 140 مېتىرغا يېقىن ھويلا ئەتراپى پىششىق خىش بىلەن ياتقۇزۇلدى. شىمال ۋە جەنۇبتىكى كىچىك راۋاقلار جامائەتكە سايە بولدى.',
      en: 'Expanded in 1538, the mosque compound took shape as a tranquil walled garden courtyard paved in warm Kashgar brick. North and south timber riwaq arcades frame the central Howz basin and mulberry terraces.',
    },
    placard: {
      normBboxXYWH: [0.03, 0.09, 0.27, 0.3],
      surfaceTheme: 'dark_plinth',
    },
  },
  {
    stopIndex: 3,
    stopId: 'stop_03_western_expansion_1780',
    kind: 'architectural_stage',
    primaryPhotoId: null,
    calibratedStep: 4.0,
    flightDurationSec: 3.1,
    cameraPose: {
      position: [42.0, 16.0, -8.0],
      target: [-6.0, 3.5, -42.0],
      fov: 44.0,
    },
    dateLabel: {
      ug: '1780-يىلى',
      en: '1780',
    },
    shortLabel: {
      ug: '1780-يىلى · نامازگاھ كېڭىيىشى',
      en: '1780 · Western Namazgah Expansion',
    },
    elevationSummary: {
      ug: 'غەربىي قىبلە تەرىپى · 85 مېتىر كەڭلىكتىكى ياغاچ لىم قۇرۇلمىسى',
      en: 'Western Qibla Sanctuary · 85 m Span Timber Beam Grid · Covered Prayer Bays',
    },
    headline: {
      ug: 'غەربىي نامازگاھنىڭ كېڭەيتىلىشى',
      en: 'Expansion of the Covered Western Namazgah',
    },
    narrative: {
      ug: '18-ئەسىرنىڭ ئاخىرلىرىدا جامائەت سانىنىڭ كۆپىيىشىگە ئەگىشىپ، ھويلىنىڭ غەربىي قىسمىدىكى نامازگاھ كېڭەيتىلدى. قۇرۇق بوستانلىق كېلىماتىغا ماسلاشقان ياغاچ لىم ۋە خىش تاملار بىر پۈتۈن كەڭ زالنى شەكىللەندۈردى.',
      en: 'During the late 18th century, the western sanctuary expanded eastward across the compound axis. Multi-bay timber trusses and continuous brick enclosure walls prepare the monumental framework for the grand summer prayer hall.',
    },
    placard: {
      normBboxXYWH: [0.03, 0.09, 0.27, 0.3],
      surfaceTheme: 'dark_plinth',
    },
  },
  {
    stopIndex: 4,
    stopId: 'stop_04_derwaza_gatehouse_1872',
    kind: 'architectural_stage',
    primaryPhotoId: null,
    calibratedStep: 5.5,
    flightDurationSec: 3.0,
    cameraPose: {
      position: [24.0, 9.5, 56.0],
      target: [0.0, 7.5, 25.5],
      fov: 40.0,
    },
    dateLabel: {
      ug: '1872-يىلى',
      en: '1872',
    },
    shortLabel: {
      ug: '1872-يىلى · دەرۋازا پېشتاقى',
      en: '1872 · East Gatehouse Derwaza',
    },
    elevationSummary: {
      ug: '13 مېتىرلىق زەپەران رەڭ پېشتاق · تۆت قاتار گۈلخانا ۋە كەمان ئىشىك',
      en: '13 m Saffron-Ochre Pishtaq Portal · Pointed Central Iwan · Engaged Corners',
    },
    headline: {
      ug: 'زەپەران رەڭلىك دەرۋازا پېشتاقى',
      en: 'Monumental Saffron-Ochre East Gatehouse',
    },
    narrative: {
      ug: '1872-يىلدىكى ئومۇمىي قۇرۇلۇشتا قەشقەر مەركىزى مەيدانىغا قاراپ تۇرىدىغان ئېگىز دەرۋازا پېشتاقى قەد كۆتۈردى. سېرىق-زەپەران رەڭدىكى خىش يۈزى، ئىككى يان تەرەپتىكى نەقىشلىك ئەگمە تەكچىلەر ۋە چوڭقۇر ئىۋان ئاساسىي قىياپەتنى بەلگىلىدى.',
      en: 'Facing Id Kah Square, the monumental east gatehouse (Derwaza) was rebuilt in 1872 in signature Kashgar saffron-ochre plaster. Its pointed arched iwan bay and stepped mud-brick facade welcome worshippers into the serene courtyard.',
    },
    placard: {
      normBboxXYWH: [0.03, 0.09, 0.27, 0.3],
      surfaceTheme: 'light_vellum',
    },
  },
  {
    stopIndex: 5,
    stopId: 'stop_05_twin_minarets_1872',
    kind: 'architectural_stage',
    primaryPhotoId: null,
    calibratedStep: 7.2,
    flightDurationSec: 3.0,
    cameraPose: {
      position: [38.0, 16.0, 52.0],
      target: [2.0, 13.0, 25.4],
      fov: 40.0,
    },
    dateLabel: {
      ug: '1872-يىلى',
      en: '1872',
    },
    shortLabel: {
      ug: '1872-يىلى · قوش مۇنار',
      en: '1872 · Twin Tapering Minarets',
    },
    elevationSummary: {
      ug: '18 مېتىرلىق ئىككى مۇنار · سىرلىق كاشىن خىش نەقىشلىرى',
      en: '18 m Twin Cylindrical Brick Minarets · Glazed Blue-White Kashi Tile Rings',
    },
    headline: {
      ug: 'ئىككى قاناتتىكى ئېگىز مۇنار ۋە كاشىن نەقىشلەر',
      en: 'Twin Cylindrical Minarets and Kashi Tilework',
    },
    narrative: {
      ug: 'دەرۋازىنىڭ ئىككى يېنىغا جەنۇب ۋە شىمال تەرەپتىن ئىككى نەپىس مۇنار چىقىرىلدى. سىلىندىرسىمان قۇرۇلمىلىق بۇ مۇنارلارنىڭ ئۈستۈنكى بەلۋاغلىرىغا كۆك ۋە ئاق سىرلىق كاشىن كاھىشلار تىزىلىپ، ئاسمان بىلەن گىرەلەشتۈرۈلدى.',
      en: 'Flanking the gatehouse walls on the north and south corners rise twin tapering brick minarets. Banded with geometric turquoise and white glazed Kashi tile courses, each shaft anchors the mosque skyline across the oasis plaza.',
    },
    placard: {
      normBboxXYWH: [0.03, 0.09, 0.27, 0.3],
      surfaceTheme: 'light_vellum',
    },
  },
  {
    stopIndex: 6,
    stopId: 'stop_06_namazgah_pillars_1872',
    kind: 'architectural_stage',
    primaryPhotoId: null,
    calibratedStep: 8.8,
    flightDurationSec: 3.1,
    cameraPose: {
      position: [16.0, 4.5, -36.0],
      target: [-4.0, 3.6, -68.0],
      fov: 44.0,
    },
    dateLabel: {
      ug: '1872-يىلى',
      en: '1872',
    },
    shortLabel: {
      ug: '1872-يىلى · 140 يېشىل تۈۋرۈك',
      en: '1872 · 140 Pillars of the Namazgah',
    },
    elevationSummary: {
      ug: '85 مېتىر كەڭلىك × 34 مېتىر چوڭقۇرلۇق · 140 دانە قارىغاي ياغاچ تۈۋرۈك',
      en: '85 m Wide × 34 m Deep Prayer Hall · 140 Emerald-Green Carved Timber Columns',
    },
    headline: {
      ug: 'ئۇلۇغ نامازگاھتىكى 140 ياغاچ تۈۋرۈك',
      en: '140 Carved Pillars of the Grand Namazgah',
    },
    narrative: {
      ug: 'غەربىي نامازگاھنىڭ كەڭ زالى 7 قاتار 20 رەت بولۇپ تىزىلغان 140 دانە يېشىل سىرلىق قارىغاي ياغاچ تۈۋرۈك بىلەن تىرەلگەن. ئۈستى قىسمى نەقىشلىك ياغاچ تاج بىلەن بېزەلگەن بولۇپ، كەڭرى سايە مەيدان ھاسىل قىلىدۇ.',
      en: 'Stretching across the western end of the compound, the Great Namazgah opens in a rhythmic forest of 140 emerald-painted timber columns arranged in 18 transverse bays. Carved wooden capitals carry the coffered ceiling grid above.',
    },
    placard: {
      normBboxXYWH: [0.03, 0.09, 0.27, 0.3],
      surfaceTheme: 'dark_plinth',
    },
  },
  {
    stopIndex: 7,
    stopId: 'stop_07_sherefe_mihrab_1900',
    kind: 'architectural_stage',
    primaryPhotoId: null,
    calibratedStep: 10.0,
    flightDurationSec: 3.1,
    cameraPose: {
      position: [46.0, 20.0, 62.0],
      target: [0.0, 8.0, -10.0],
      fov: 42.0,
    },
    dateLabel: {
      ug: '1900-يىللار',
      en: '1900',
    },
    shortLabel: {
      ug: '1900-يىللار · شەرەپە ۋە مەسچىت قۇببىسى',
      en: '1900 · Sherefe Crowns and Completion',
    },
    elevationSummary: {
      ug: 'قوش مۇنار شەرەپە بالكونلىرى · چوڭ ئەزان گۈمبىزى · قىبلە مىھرابى',
      en: 'Upper Sherefe Azan Balconies · Onion Tin Finial · Recessed Qibla Mihrab',
    },
    headline: {
      ug: 'مۇنار شەرەپىلىرى ۋە گۈمبەزنىڭ پۈتۈشى',
      en: 'Sherefe Azan Balconies and Sanctuary Completion',
    },
    narrative: {
      ug: 'ياغاچ قۇرۇلۇش شوتىلىرى ئېلىۋېتىلگەندىن كېيىن، ئىككى مۇنار ئۈستىدىكى شەرەپە بالكونلىرى، گۈمبەز ئۈستى قۇببىسى ۋە غەربىي نامازگاھنىڭ مېھراب بېزەكلىرى تولۇق مۇكەممەللەشتى.',
      en: 'With construction scaffolds dismantled, timber-framed sherefe azan galleries crown both minarets and the central gatehouse crest rises above Id Kah Square, completing the 19th-century ensemble beside the central sanctuary mihrab.',
    },
    placard: {
      normBboxXYWH: [0.03, 0.09, 0.27, 0.3],
      surfaceTheme: 'light_vellum',
    },
  },
  {
    stopIndex: 8,
    stopId: '1889_hero_3d_showcase_finale',
    kind: 'hero_3d_model_finale',
    primaryPhotoId: null,
    calibratedStep: 11.0,
    flightDurationSec: 2.8,
    cameraPose: {
      position: [58.0, 22.0, 92.0],
      target: [0.0, 7.0, 10.0],
      fov: 42.0,
    },
    dateLabel: {
      ug: 'بۈگۈنكى 3D كۆرۈنۈش',
      en: 'Today in 3D',
    },
    shortLabel: {
      ug: 'ھازىر · قەشقەر ھېيتگاھ مەسچىتى 3D',
      en: 'Present · Complete Id Kah Mosque in 3D',
    },
    elevationSummary: {
      ug: '140 مېتىر ھويلا مۇھىتى · 18 مېتىر قوش مۇنار · 140 تۈۋرۈكلۈك نامازگاھ',
      en: '140 m Compound · 18 m Twin Minarets · 140-Pillar Namazgah Hall',
    },
    headline: {
      ug: 'قەشقەر ھېيتگاھ مەسچىتىنىڭ 3D تولۇق مودېلى',
      en: 'Complete Kashgar Id Kah Mosque in 3D',
    },
    narrative: {
      ug: 'قەشقەر ھېيتگاھ مەسچىتىنىڭ تولۇق ئۈچ ئۆلچەملىك بىناكارلىق مودېلىنى ئەركىن ئايلاندۇرۇپ كۆرۈڭ. تۆۋەندىكى تۈرلەرنى تاللاپ دەرۋازا پېشتاقى، قوش مۇنار، سۇ كۆلچىكى ۋە 140 تۈۋرۈكلۈك نامازگاھنى يېقىندىن كۆزىتەلەيسىز.',
      en: 'Inspect the reconstructed Kashgar Id Kah Mosque complex in three dimensions. Drag freely around the square, or choose a focal vantage below to examine the East Gatehouse, Twin Minarets, shaded Howz courtyard, and 140-pillar Namazgah.',
    },
    placard: {
      normBboxXYWH: [0.03, 0.09, 0.27, 0.3],
      surfaceTheme: 'light_vellum',
    },
  },
]);

export const HERO_FINALE_PRESETS = Object.freeze([
  {
    presetId: 'overview',
    numeral: '0',
    label: {
      ug: 'ئومۇمىي مەنزىرە',
      en: 'Square & Full Mosque',
    },
    caption: {
      ug: 'ھېيتگاھ مەيدانى تەرىپىدىن مەسچىتنىڭ پۈتۈن شەرقىي قىياپىتى ۋە قوش مۇنار كۆرۈنۈشى.',
      en: 'Full three-quarter elevation across Id Kah Square showing the East Gatehouse, twin minarets, and courtyard walls.',
    },
    position: [58.0, 22.0, 92.0],
    target: [0.0, 7.0, 10.0],
    fovYDeg: 42.0,
    enableTurntable: true,
  },
  {
    presetId: 'gate_iwan',
    numeral: 'I',
    label: {
      ug: 'دەرۋازا ۋە ئىۋان',
      en: 'Saffron Gatehouse & Iwan',
    },
    caption: {
      ug: 'زەپەران رەڭلىك پېشتاق، تۆت قاتار گۈلخانا تەكچىسى ۋە كىرىش كەمانى.',
      en: 'Saffron-ochre mud plaster pishtaq, central pointed iwan arch, and carved entrance doors.',
    },
    position: [24.0, 9.5, 56.0],
    target: [-1.5, 8.5, 25.5],
    fovYDeg: 38.0,
    enableTurntable: false,
  },
  {
    presetId: 'twin_minarets',
    numeral: 'II',
    label: {
      ug: 'قوش مۇنار ۋە كاشىن',
      en: 'Twin Minarets & Sherefe',
    },
    caption: {
      ug: '18 مېتىرلىق ئىككى سىلىندىر خىش مۇنار، كۆك-ئاق كاشىن نەقىشلىرى ۋە شەرەپە بالكونى.',
      en: '18 m tapering cylindrical brick minarets banded in glazed blue-white Kashi tiles and sherefe crowns.',
    },
    position: [38.0, 16.0, 52.0],
    target: [4.0, 14.0, 25.4],
    fovYDeg: 38.0,
    enableTurntable: false,
  },
  {
    presetId: 'courtyard_howz',
    numeral: 'III',
    label: {
      ug: 'ھويلا ۋە كۆلچەك',
      en: 'Courtyard & Howz Basin',
    },
    caption: {
      ug: 'تېرەك ۋە ئۈجمە دەرىخى سايىسىدىكى كۆلچەك، خىش يول ۋە راۋاق ئايۋانلىرى.',
      en: 'Central Howz water basin shaded by oasis poplars and bordered by brick walkways and riwaq arcades.',
    },
    position: [28.0, 12.0, 8.0],
    target: [-4.0, 2.5, -18.0],
    fovYDeg: 40.0,
    enableTurntable: false,
  },
  {
    presetId: 'namazgah_pillars',
    numeral: 'IV',
    label: {
      ug: '140 تۈۋرۈكلۈك نامازگاھ',
      en: '140-Pillar Grand Namazgah',
    },
    caption: {
      ug: 'يېشىل رەڭدە سىرلانغان 140 ياغاچ تۈۋرۈك، نەقىشلىك تورۇس ۋە غەربىي مېھراب.',
      en: 'Interior perspective through 140 emerald-painted timber columns supporting the coffered prayer hall ceiling.',
    },
    position: [14.0, 4.2, -38.0],
    target: [-6.0, 3.6, -68.0],
    fovYDeg: 42.0,
    enableTurntable: false,
  },
]);

export const LEGACY_CHAPTER_TO_STOP_MAP = Object.freeze({
  stop_01_foundations_howz_1442: 1,
  stop_02_courtyard_riwaq_1538: 2,
  stop_03_western_expansion_1780: 3,
  stop_04_derwaza_gatehouse_1872: 4,
  stop_05_twin_minarets_1872: 5,
  stop_06_namazgah_pillars_1872: 6,
  stop_07_sherefe_mihrab_1900: 7,
  '1889_hero_3d_showcase_finale': 8,
  hero_3d_finale: 8,
  ch1_vision: 1,
  ch1_foundations: 1,
  ch2_foundations: 2,
  ch2_piers: 3,
  ch3_first_platform: 4,
  ch4_second_stage: 5,
  ch5_upper_shaft: 6,
  ch6_exposition: 7,
  ch7_legacy: 8,
  ch7_hero_finale: 8,
});

export function getWalkthroughStop(query) {
  if (query === null || query === undefined) return WALKTHROUGH_STOPS[0];
  if (typeof query === 'number' && Number.isFinite(query)) {
    const clamped = Math.max(1, Math.min(WALKTHROUGH_STOPS.length, Math.round(query)));
    return WALKTHROUGH_STOPS[clamped - 1];
  }
  const key = String(query).trim();
  if (/^\d+$/.test(key)) {
    const idx = Number(key);
    if (idx >= 1 && idx <= WALKTHROUGH_STOPS.length) {
      return WALKTHROUGH_STOPS[idx - 1];
    }
  }
  if (LEGACY_CHAPTER_TO_STOP_MAP[key]) {
    return WALKTHROUGH_STOPS[LEGACY_CHAPTER_TO_STOP_MAP[key] - 1];
  }
  const byStopId = WALKTHROUGH_STOPS.find((s) => s.stopId === key);
  if (byStopId) return byStopId;

  return WALKTHROUGH_STOPS[0];
}

export function getStopForPhotoId(photoId) {
  if (!photoId) return null;
  const clean = String(photoId || '').trim().replace(/^photo_|^#/i, '').padStart(2, '0');
  return WALKTHROUGH_STOPS.find((s) => s.primaryPhotoId === clean) || null;
}
