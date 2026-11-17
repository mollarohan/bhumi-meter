/* =========================================================
   BHUMI METER – script.js
   Vanilla JavaScript (ES6+) – no framework, no server
   ========================================================= */
'use strict';
document.documentElement.classList.add('js');

/* =========================================================
   1. CONSTANTS & UNIT DEFINITIONS
   ========================================================= */
const DEFAULT_SETTINGS = { sqftPerKatha: 720, kathaPerBigha: 20, sqftPerDecimal: 435.6 };
const SQFT_PER_ACRE = 43560;      // 1 Acre = 43,560 sq ft
const SQFT_PER_SQM = 10.7639;     // 1 sq m = 10.7639 sq ft
const CFT_TO_M3 = 0.0283168;      // 1 cubic foot in cubic metres
const STORAGE = { lang: 'bm_lang', settings: 'bm_settings', history: 'bm_history' };
const MAX_HISTORY = 50;

const UNITS = {
  sqft:    { bn: 'বর্গফুট',          en: 'Square Feet',      icon: '📐', digits: 2 },
  decimal: { bn: 'ডেসিমেল / শতক',   en: 'Decimal / Shotok', icon: '🌱', digits: 4 },
  katha:   { bn: 'কাঠা',            en: 'Katha',            icon: '🏡', digits: 4 },
  bigha:   { bn: 'বিঘা',            en: 'Bigha',            icon: '🌾', digits: 4 },
  acre:    { bn: 'একর',             en: 'Acre',             icon: '🚜', digits: 4 },
  point:   { bn: 'পয়েন্ট',          en: 'Point',            icon: '📍', digits: 4 },
  sqm:     { bn: 'বর্গমিটার',        en: 'Square Meter',     icon: '🗺️', digits: 2 }
};
const ALL_UNITS = ['sqft', 'decimal', 'katha', 'bigha', 'acre', 'point', 'sqm'];

const CONVERTERS = [
  { key: 'sqft',    out: ['decimal', 'katha', 'bigha', 'acre', 'point', 'sqm'] },
  { key: 'decimal', out: ['sqft', 'katha', 'bigha', 'acre', 'point', 'sqm'] },
  { key: 'katha',   out: ['sqft', 'decimal', 'bigha', 'acre', 'point'] },
  { key: 'bigha',   out: ['sqft', 'katha', 'decimal', 'acre', 'point'] }
];

/* =========================================================
   2. LANGUAGE DICTIONARY (Bengali default + English)
   ========================================================= */
const I18N = {
  bn: {
    page_title: 'BHUMI METER – জমির সঠিক হিসাব',
    skip_link: 'মূল কন্টেন্টে যান',
    aria_lang: 'ভাষা পরিবর্তন করুন', aria_menu: 'মেনু খুলুন/বন্ধ করুন',
    lang_btn: 'English',
    nav_home: 'হোম', nav_calc: 'জমির হিসাব', nav_conv: 'ইউনিট কনভার্টার', nav_build: 'নির্মাণ হিসাব', nav_learn: 'জমির মাপ শেখা', nav_contact: 'যোগাযোগ',
    tagline: 'আপনার জমির সঠিক হিসাব, এখন হাতের মুঠোয়।',
    hero_badge: '✅ ফ্রি • লগইন ছাড়াই • সহজ হিসাব',
    hero_desc: 'জমির দৈর্ঘ্য ও প্রস্থ লিখুন এবং কয়েক সেকেন্ডেই জেনে নিন আপনার জমির সম্পূর্ণ পরিমাপ।',
    hero_btn1: 'জমির মাপ শুরু করুন', hero_btn2: 'হিসাব কীভাবে করবেন?',
    hero_chip1: '🔓 লগইন লাগবে না', hero_chip2: '📱 ডেটা আপনার ডিভাইসেই থাকে', hero_chip3: '🌐 বাংলা ও English',

    calc_eyebrow: 'প্রধান ক্যালকুলেটর', calc_title: 'জমির হিসাব ক্যালকুলেটর',
    calc_sub: 'শুধু দৈর্ঘ্য ও প্রস্থ ফুটে লিখুন — বাকি হিসাব আমরা করে দেব।',
    lbl_length: 'জমির দৈর্ঘ্য (ফুটে)', lbl_width: 'জমির প্রস্থ (ফুটে)',
    ph_length: 'যেমন: 60', ph_width: 'যেমন: 40', suffix_ft: 'ফুট',
    btn_calc: 'জমির হিসাব করুন', btn_reset: 'রিসেট',
    res_title: 'আপনার জমির পরিমাপ',
    btn_copy: 'কপি করুন', btn_print: 'প্রিন্ট করুন', btn_download: 'TXT ডাউনলোড', btn_save: 'হিসাব সেভ করুন',
    note_title: 'গুরুত্বপূর্ণ নোট:',
    note_text: 'জমির কনভার্সন স্ট্যান্ডার্ড এলাকা ও অঞ্চলভেদে আলাদা হতে পারে। এখানে পশ্চিমবঙ্গের সাধারণ মান (১ কাঠা = ৭২০ বর্গফুট, ১ ডেসিমেল = ৪৩৫.৬ বর্গফুট) ডিফল্ট ধরা হয়েছে। সরকারি দলিল বা জমির রেকর্ডের জন্য স্থানীয় অফিসের মাপই চূড়ান্ত।',
    area_eq: 'মোট আয়তন',

    err_required: 'এই ঘরটি পূরণ করুন।', err_invalid: 'সঠিক সংখ্যা লিখুন।',
    err_positive: '০-এর চেয়ে বড় সংখ্যা লিখুন।', err_negative: 'ঋণাত্মক সংখ্যা চলবে না।',
    err_large: 'সংখ্যাটি অনেক বড়।', err_fix: 'অনুগ্রহ করে লাল চিহ্নিত ঘরগুলো ঠিক করুন।',
    err_openings: 'ফাঁকের মাপ দেওয়ালের মোট ক্ষেত্রফলের চেয়ে কম হতে হবে।',
    err_min_one: 'কমপক্ষে একটি প্লট থাকতে হবে।',

    hist_title: '📜 হিসাবের ইতিহাস', hist_sub: 'আপনার সেভ করা হিসাব শুধু এই ডিভাইসেই থাকে।',
    hist_empty: 'এখনও কোনো হিসাব সেভ করা হয়নি।', btn_clear_history: 'সব ইতিহাস মুছুন',
    hist_confirm: 'সব ইতিহাস মুছে ফেলবেন?', hist_delete: 'মুছুন',
    h_length: 'দৈর্ঘ্য', h_width: 'প্রস্থ', h_ft: 'ফুট',

    conv_eyebrow: 'ইউনিট কনভার্টার', conv_title: 'উন্নত জমির ইউনিট কনভার্টার',
    conv_sub: 'যে ইউনিটে মাপ জানেন, সেটা লিখুন — বাকি সব ইউনিটে সঙ্গে সঙ্গে দেখুন।',
    conv_title_sqft: 'বর্গফুট থেকে অন্যান্য ইউনিট', conv_title_decimal: 'ডেসিমেল কনভার্টার',
    conv_title_katha: 'কাঠা কনভার্টার', conv_title_bigha: 'বিঘা কনভার্টার',
    conv_in_sqft: 'বর্গফুট লিখুন', conv_in_decimal: 'ডেসিমেল লিখুন', conv_in_katha: 'কাঠা লিখুন', conv_in_bigha: 'বিঘা লিখুন',
    btn_convert: 'কনভার্ট করুন', quick_multi: '➕ একাধিক প্লট', quick_settings: '⚙️ কনভার্সন সেটিংস',

    multi_eyebrow: 'একাধিক প্লট', multi_title: 'একাধিক জমির মোট হিসাব',
    multi_sub: 'একাধিক আয়তাকার প্লট যোগ করুন এবং সবকিছু মিলিয়ে মোট আয়তন জানুন।',
    plot_word: 'প্লট', plot_name: 'প্লটের নাম', ph_plot_name: 'যেমন: ধানী জমি',
    plot_length: 'দৈর্ঘ্য (ফুটে)', plot_width: 'প্রস্থ (ফুটে)',
    btn_add_plot: '➕ আরও একটি প্লট যোগ করুন', btn_remove_plot: 'প্লট বাদ দিন',
    btn_calc_total: 'মোট আয়তন হিসাব করুন', btn_reset_all: 'সব রিসেট',
    multi_total_title: 'সব প্লট মিলিয়ে মোট',
    th_plot: 'প্লট', th_length: 'দৈর্ঘ্য (ফুট)', th_width: 'প্রস্থ (ফুট)', th_area: 'আয়তন (বর্গফুট)',

    set_eyebrow: 'সেটিংস', set_title: 'কাস্টম কনভার্সন সেটিংস',
    set_sub: 'আপনার এলাকার মাপ আলাদা হলে এখানে বদলে নিন। সব ক্যালকুলেটর নতুন মান ব্যবহার করবে।',
    set_katha: 'প্রতি কাঠায় বর্গফুট', set_kb: 'প্রতি বিঘায় কাঠা', set_decimal: 'প্রতি ডেসিমেলে বর্গফুট',
    btn_save_settings: 'সেটিংস সংরক্ষণ করুন', btn_restore: 'ডিফল্ট সেটিংস ফিরিয়ে আনুন',
    set_warn: 'এগুলো শুধুমাত্র হিসাবের সুবিধার জন্য ক্যালকুলেশন সেটিংস — সরকারি ভূমি রেকর্ডের অফিসিয়াল স্ট্যান্ডার্ড নয়।',
    set_active: 'বর্তমানে চালু:',
    toast_set_saved: 'সেটিংস সংরক্ষিত হয়েছে।', toast_set_restored: 'ডিফল্ট সেটিংস ফিরে এসেছে।',

    build_eyebrow: 'নির্মাণ হিসাব', build_title: 'ইটের দেওয়ালের নির্মাণ সামগ্রীর আনুমানিক হিসাব',
    build_sub: 'ঘরের মাপ ও ইটের মাপ দিন — আনুমানিক ইট, সিমেন্ট ও বালির পরিমাণ জানুন।',
    b_len: 'ঘরের দৈর্ঘ্য (ফুট)', b_wid: 'ঘরের প্রস্থ (ফুট)', b_hei: 'দেওয়ালের উচ্চতা (ফুট)',
    b_thick: 'দেওয়ালের পুরুত্ব', opt_45: '৪.৫ ইঞ্চি দেওয়াল', opt_9: '৯ ইঞ্চি দেওয়াল',
    b_brl: 'ইটের দৈর্ঘ্য (ইঞ্চি)', b_brw: 'ইটের প্রস্থ (ইঞ্চি)', b_brh: 'ইটের উচ্চতা (ইঞ্চি)',
    b_joint: 'মশলার জোড়ের পুরুত্ব (ইঞ্চি)', b_ratio: 'মশলার অনুপাত (সিমেন্ট : বালি)',
    b_bag: 'সিমেন্ট ব্যাগের ওজন (কেজি)', b_open: 'দরজা-জানালার মোট ফাঁক (বর্গফুট)', b_waste: 'অপচয় (%)',
    btn_estimate: 'আনুমানিক হিসাব করুন', br_title: 'আনুমানিক নির্মাণ সামগ্রী',
    r_wall: 'মোট দেওয়ালের আয়তন', r_bricks: 'ইটের সংখ্যা', r_mortar_wet: 'মশলার আয়তন (ভেজা)',
    r_mortar_dry: 'মশলার শুকনো আয়তন', r_cement: 'সিমেন্ট', r_sand: 'বালি',
    u_cft: 'ঘনফুট', u_m3: 'ঘনমিটার', u_pcs: 'টি', u_bags: 'ব্যাগ', u_kg: 'কেজি', r_incl_waste: 'অপচয় সহ',
    assume_title: 'হিসাবের পদ্ধতি ও ধরে নেওয়া শর্ত',
    assume_1: 'দেওয়ালের আয়তন = ঘরের পরিসীমা × উচ্চতা × পুরুত্ব − (দরজা-জানালার ফাঁক × পুরুত্ব)।',
    assume_2: 'ইটের সংখ্যা = দেওয়ালের আয়তন ÷ (মশলার জোড়সহ একটি ইটের আয়তন), তারপর অপচয় যোগ।',
    assume_3: 'ভেজা মশলা = দেওয়ালের আয়তন − ইটের নিট আয়তন; তারপর অপচয় যোগ।',
    assume_4: 'শুকনো আয়তন = ভেজা মশলা × 1.27 (ভেজা থেকে শুকনো রূপান্তর ফ্যাক্টর)।',
    assume_5: 'সিমেন্ট = শুকনো আয়তন ÷ (1 + বালির অংশ); বালি = শুকনো আয়তন × বালির অংশ ÷ (1 + বালির অংশ)।',
    assume_6: 'সিমেন্টের ঘনত্ব 1440 কেজি/ঘনমিটার ধরা হয়েছে; ব্যাগের সংখ্যা পরবর্তী পূর্ণসংখ্যায় দেখানো হয়েছে।',
    assume_7: 'ঘরের চারদিকে পূর্ণ দেওয়াল ধরা হয়েছে। ভিত, কলাম, ছাদ, প্লাস্টার ও কোণার ওভারল্যাপ ধরা হয়নি।',
    build_disclaimer: 'এটি শুধুমাত্র প্রাথমিক আনুমানিক হিসাব, নিশ্চিত পরিমাণ নয়। প্রকৃত পরিমাণ কাঠামোগত নকশা, ইটের মাপ, ফাঁক, কারিগরের দক্ষতা ও স্থানীয় নির্মাণ পদ্ধতির উপর নির্ভর করে। এটি কোনো ইঞ্জিনিয়ার বা পেশাদার ঠিকাদারের বিকল্প নয়।',

    edu_eyebrow: 'জমির মাপ শেখা', edu_title: 'জমির মাপ সহজ ভাষায় শিখুন',
    edu_sub: 'বর্গফুট, ডেসিমেল, কাঠা, বিঘা, একর ও পয়েন্ট — সবকিছু উদাহরণসহ।', edu_example: 'উদাহরণ:',
    how_title: '📏 জমির আয়তন কীভাবে হিসাব করবেন?', how_formula: 'দৈর্ঘ্য × প্রস্থ = মোট জমির আয়তন।',
    how_s1: 'ফিতা দিয়ে জমির দৈর্ঘ্য ফুটে মাপুন।', how_s2: 'একইভাবে প্রস্থ ফুটে মাপুন।', how_s3: 'দুটি সংখ্যা গুণ করুন — এটাই বর্গফুটে মোট আয়তন।',
    how_ex: 'উদাহরণ: 60 ফুট × 40 ফুট = 2400 বর্গফুট',
    how_irregular: 'জমি আয়তাকার না হলে ছোট ছোট আয়তক্ষেত্রে ভাগ করে “একাধিক প্লট” ক্যালকুলেটরে যোগ করুন।',
    std_title: '📌 ডিফল্ট কনভার্সন তালিকা (পশ্চিমবঙ্গ)',
    std_1: '1 ডেসিমেল = 435.6 বর্গফুট', std_2: '1 কাঠা = 720 বর্গফুট', std_3: '1 বিঘা = 20 কাঠা = 14,400 বর্গফুট',
    std_4: '1 একর = 43,560 বর্গফুট = 100 ডেসিমেল', std_5: '1 ডেসিমেল = 100 পয়েন্ট', std_6: '1 পয়েন্ট = 4.356 বর্গফুট', std_7: '1 বর্গমিটার = 10.7639 বর্গফুট',

    foot_desc: 'আপনার জমির হিসাব ও প্রয়োজনীয় ডিজিটাল পরিষেবায় আমরা আছি আপনার পাশে।',
    foot_biz: 'ব্যবসার তথ্য', foot_contact: 'যোগাযোগের তথ্য',
    btn_email: 'ইমেইল করুন', link_google: 'Google-এ খুঁজুন', link_map: 'Google Maps-এ রুট দেখুন',
    privacy_note: 'কোনো লগইন, পাসওয়ার্ড বা OTP নেই। আপনার হিসাব কোনো সার্ভারে পাঠানো হয় না।',
    foot_dev: 'Website Developed By:',

    toast_copied: 'কপি হয়েছে!', toast_copy_fail: 'কপি করা যায়নি।', toast_saved: 'হিসাব সেভ হয়েছে।',
    toast_deleted: 'মুছে ফেলা হয়েছে।', toast_cleared: 'ইতিহাস মুছে ফেলা হয়েছে।',
    toast_calc_first: 'আগে হিসাব করুন।', toast_downloaded: 'ডাউনলোড শুরু হয়েছে।',

    rep_title: 'জমির পরিমাপ রিপোর্ট', rep_multi: 'একাধিক প্লটের মোট হিসাব', rep_date: 'তারিখ',
    rep_std: 'ব্যবহৃত কনভার্সন মান', rep_total: 'মোট আয়তন'
  },

  en: {
    page_title: 'BHUMI METER – Accurate Land Calculator',
    skip_link: 'Skip to main content',
    aria_lang: 'Switch language', aria_menu: 'Open/close menu',
    lang_btn: 'বাংলা',
    nav_home: 'Home', nav_calc: 'Land Calculator', nav_conv: 'Unit Converter', nav_build: 'Construction', nav_learn: 'Learn Land Units', nav_contact: 'Contact',
    tagline: 'Your accurate land calculation, now in your hands.',
    hero_badge: '✅ Free • No login • Easy calculation',
    hero_desc: 'Enter the length and width of your land and know the complete measurement in seconds.',
    hero_btn1: 'Start Measuring', hero_btn2: 'How to calculate?',
    hero_chip1: '🔓 No login needed', hero_chip2: '📱 Data stays on your device', hero_chip3: '🌐 Bengali & English',

    calc_eyebrow: 'Main Calculator', calc_title: 'Land Area Calculator',
    calc_sub: 'Just enter length and width in feet — we do the rest.',
    lbl_length: 'Land Length (in Feet)', lbl_width: 'Land Width (in Feet)',
    ph_length: 'e.g. 60', ph_width: 'e.g. 40', suffix_ft: 'ft',
    btn_calc: 'Calculate Land Area', btn_reset: 'Reset',
    res_title: 'Your Land Measurement',
    btn_copy: 'Copy Results', btn_print: 'Print Results', btn_download: 'Download TXT', btn_save: 'Save Calculation',
    note_title: 'Important note:',
    note_text: 'Land conversion standards may differ between regions. The common West Bengal values (1 Katha = 720 sq ft, 1 Decimal = 435.6 sq ft) are used by default. For legal documents and land records, the local office measurement is final.',
    area_eq: 'Total area',

    err_required: 'Please fill in this field.', err_invalid: 'Enter a valid number.',
    err_positive: 'Enter a number greater than 0.', err_negative: 'Negative numbers are not allowed.',
    err_large: 'This number is too large.', err_fix: 'Please correct the highlighted fields.',
    err_openings: 'Openings must be smaller than the total wall area.',
    err_min_one: 'At least one plot is required.',

    hist_title: '📜 Calculation History', hist_sub: 'Saved calculations stay only on this device.',
    hist_empty: 'No calculations saved yet.', btn_clear_history: 'Clear History',
    hist_confirm: 'Delete the entire history?', hist_delete: 'Delete',
    h_length: 'Length', h_width: 'Width', h_ft: 'ft',

    conv_eyebrow: 'Unit Converter', conv_title: 'Advanced Land Unit Converter',
    conv_sub: 'Enter the unit you know — see every other unit instantly.',
    conv_title_sqft: 'Square Feet to Other Units', conv_title_decimal: 'Decimal Converter',
    conv_title_katha: 'Katha Converter', conv_title_bigha: 'Bigha Converter',
    conv_in_sqft: 'Enter Square Feet', conv_in_decimal: 'Enter Decimal', conv_in_katha: 'Enter Katha', conv_in_bigha: 'Enter Bigha',
    btn_convert: 'Convert', quick_multi: '➕ Multiple Plots', quick_settings: '⚙️ Conversion Settings',

    multi_eyebrow: 'Multiple Plots', multi_title: 'Multiple Land Area Calculator',
    multi_sub: 'Add several rectangular plots and get the combined total area.',
    plot_word: 'Plot', plot_name: 'Plot Name', ph_plot_name: 'e.g. Paddy field',
    plot_length: 'Length (ft)', plot_width: 'Width (ft)',
    btn_add_plot: '➕ Add Another Plot', btn_remove_plot: 'Remove Plot',
    btn_calc_total: 'Calculate Total Area', btn_reset_all: 'Reset All',
    multi_total_title: 'Combined total of all plots',
    th_plot: 'Plot', th_length: 'Length (ft)', th_width: 'Width (ft)', th_area: 'Area (sq ft)',

    set_eyebrow: 'Settings', set_title: 'Custom Conversion Settings',
    set_sub: 'If your area uses different values, change them here. Every calculator will use the new values.',
    set_katha: 'Square Feet per Katha', set_kb: 'Katha per Bigha', set_decimal: 'Square Feet per Decimal',
    btn_save_settings: 'Save Settings', btn_restore: 'Restore Default Settings',
    set_warn: 'These are calculation settings for convenience only — not official land-record standards.',
    set_active: 'Currently active:',
    toast_set_saved: 'Settings saved.', toast_set_restored: 'Default settings restored.',

    build_eyebrow: 'Construction', build_title: 'Brick Wall Material Estimator',
    build_sub: 'Enter room and brick dimensions to estimate bricks, cement and sand.',
    b_len: 'Room Length (ft)', b_wid: 'Room Width (ft)', b_hei: 'Wall Height (ft)',
    b_thick: 'Wall Thickness', opt_45: '4.5 inch wall', opt_9: '9 inch wall',
    b_brl: 'Brick Length (inch)', b_brw: 'Brick Width (inch)', b_brh: 'Brick Height (inch)',
    b_joint: 'Mortar Joint Thickness (inch)', b_ratio: 'Mortar Ratio (Cement : Sand)',
    b_bag: 'Cement Bag Weight (kg)', b_open: 'Total Door/Window Openings (sq ft)', b_waste: 'Wastage (%)',
    btn_estimate: 'Estimate Materials', br_title: 'Approximate Materials',
    r_wall: 'Total Wall Volume', r_bricks: 'Number of Bricks', r_mortar_wet: 'Mortar Volume (Wet)',
    r_mortar_dry: 'Mortar Dry Volume', r_cement: 'Cement', r_sand: 'Sand',
    u_cft: 'cu ft', u_m3: 'm³', u_pcs: 'pcs', u_bags: 'bags', u_kg: 'kg', r_incl_waste: 'incl. wastage',
    assume_title: 'Formulas & assumptions used',
    assume_1: 'Wall volume = room perimeter × height × thickness − (openings area × thickness).',
    assume_2: 'Bricks = wall volume ÷ (volume of one brick including mortar joint), then wastage added.',
    assume_3: 'Wet mortar = wall volume − net brick volume; wastage then added.',
    assume_4: 'Dry volume = wet mortar × 1.27 (wet-to-dry conversion factor).',
    assume_5: 'Cement = dry volume ÷ (1 + sand part); Sand = dry volume × sand part ÷ (1 + sand part).',
    assume_6: 'Cement density taken as 1440 kg/m³; bag count is rounded up to the next whole bag.',
    assume_7: 'Full walls on all four sides assumed. Foundation, columns, roof, plaster and corner overlaps are not included.',
    build_disclaimer: 'These are preliminary estimates only, not guaranteed quantities. Actual quantities depend on structural design, brick dimensions, openings, workmanship and local construction practices. This tool does not replace an engineer or professional contractor.',

    edu_eyebrow: 'Learn Land Units', edu_title: 'Learn Land Measurement in Simple Words',
    edu_sub: 'Square feet, decimal, katha, bigha, acre and point — all with easy examples.', edu_example: 'Example:',
    how_title: '📏 How to calculate land area?', how_formula: 'Length × Width = Total Land Area.',
    how_s1: 'Measure the length of the land in feet using a tape.', how_s2: 'Measure the width in feet the same way.', how_s3: 'Multiply the two numbers — that is the total area in square feet.',
    how_ex: 'Example: 60 ft × 40 ft = 2400 sq ft',
    how_irregular: 'If the land is not rectangular, split it into smaller rectangles and add them in the “Multiple Plots” calculator.',
    std_title: '📌 Default conversion list (West Bengal)',
    std_1: '1 Decimal = 435.6 sq ft', std_2: '1 Katha = 720 sq ft', std_3: '1 Bigha = 20 Katha = 14,400 sq ft',
    std_4: '1 Acre = 43,560 sq ft = 100 Decimal', std_5: '1 Decimal = 100 Points', std_6: '1 Point = 4.356 sq ft', std_7: '1 Square Meter = 10.7639 sq ft',

    foot_desc: 'We are by your side for your land calculations and essential digital services.',
    foot_biz: 'Business Information', foot_contact: 'Contact Information',
    btn_email: 'Email Us', link_google: 'Search on Google', link_map: 'Directions on Google Maps',
    privacy_note: 'No login, password or OTP. Your calculations are never sent to any server.',
    foot_dev: 'Website Developed By:',

    toast_copied: 'Copied!', toast_copy_fail: 'Could not copy.', toast_saved: 'Calculation saved.',
    toast_deleted: 'Deleted.', toast_cleared: 'History cleared.',
    toast_calc_first: 'Please calculate first.', toast_downloaded: 'Download started.',

    rep_title: 'Land Measurement Report', rep_multi: 'Multiple Plots – Combined Total', rep_date: 'Date',
    rep_std: 'Conversion values used', rep_total: 'Total area'
  }
};

/* =========================================================
   3. EDUCATION CONTENT (both languages)
   ========================================================= */
const EDU = [
  { icon: '📐',
    bn: { h: 'বর্গফুট (Square Feet) কী?', p: 'জমির আয়তন মাপার সবচেয়ে ছোট ও সহজ একক। 1 ফুট লম্বা ও 1 ফুট চওড়া জায়গার ক্ষেত্রফল 1 বর্গফুট।', ex: '60 ফুট × 40 ফুট = 2400 বর্গফুট।' },
    en: { h: 'What is Square Feet?', p: 'The smallest and simplest unit for land area. A space 1 foot long and 1 foot wide has an area of 1 square foot.', ex: '60 ft × 40 ft = 2400 sq ft.' } },
  { icon: '🌱',
    bn: { h: 'ডেসিমেল / শতক কী?', p: '1 ডেসিমেল (শতক) = 435.6 বর্গফুট। বর্গফুটকে 435.6 দিয়ে ভাগ করলেই ডেসিমেল পাওয়া যায়। 100 ডেসিমেলে 1 একর হয়।', ex: '2400 ÷ 435.6 = প্রায় 5.51 ডেসিমেল।' },
    en: { h: 'What is Decimal / Shotok?', p: '1 Decimal (Shotok) = 435.6 sq ft. Divide square feet by 435.6 to get decimals. 100 decimals make 1 acre.', ex: '2400 ÷ 435.6 = about 5.51 Decimal.' } },
  { icon: '🏡',
    bn: { h: 'কাঠা (Katha) কী?', p: 'বাড়ির জমি মাপার জনপ্রিয় একক। এই ক্যালকুলেটরে 1 কাঠা = 720 বর্গফুট ধরা হয়েছে। অঞ্চলভেদে এই মান আলাদা হতে পারে।', ex: '2400 ÷ 720 = 3.33 কাঠা।' },
    en: { h: 'What is Katha?', p: 'A popular unit for house-plot land. This calculator uses 1 Katha = 720 sq ft by default. The value can differ between regions.', ex: '2400 ÷ 720 = 3.33 Katha.' } },
  { icon: '🌾',
    bn: { h: 'বিঘা (Bigha) কী?', p: 'কৃষিজমি মাপার বড় একক। এখানে 1 বিঘা = 20 কাঠা = 14,400 বর্গফুট ধরা হয়েছে।', ex: '2400 ÷ 14400 = 0.1667 বিঘা।' },
    en: { h: 'What is Bigha?', p: 'A larger unit used for agricultural land. Here 1 Bigha = 20 Katha = 14,400 sq ft.', ex: '2400 ÷ 14400 = 0.1667 Bigha.' } },
  { icon: '🚜',
    bn: { h: 'একর (Acre) কী?', p: 'বড় জমি মাপার আন্তর্জাতিক একক। 1 একর = 43,560 বর্গফুট = 100 ডেসিমেল।', ex: '2400 ÷ 43560 = 0.0551 একর।' },
    en: { h: 'What is Acre?', p: 'An international unit for large land. 1 Acre = 43,560 sq ft = 100 Decimal.', ex: '2400 ÷ 43560 = 0.0551 Acre.' } },
  { icon: '📍',
    bn: { h: 'পয়েন্ট (Point) কী?', p: '1 ডেসিমেল = 100 পয়েন্ট, অর্থাৎ 1 পয়েন্ট = 4.356 বর্গফুট। ছোট জমির সূক্ষ্ম মাপে কাজে লাগে।', ex: '5.5096 ডেসিমেল × 100 = 550.96 পয়েন্ট।' },
    en: { h: 'What is Point?', p: '1 Decimal = 100 Points, so 1 Point = 4.356 sq ft. Useful for fine measurement of small land.', ex: '5.5096 Decimal × 100 = 550.96 Points.' } }
];

/* =========================================================
   4. HELPERS (storage, DOM, formatting)
   ========================================================= */
const el = id => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* storage unavailable */ } }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmt(n, d = 2) {
  if (!isFinite(n)) return '0';
  return Number(n.toFixed(d)).toLocaleString('en-IN', { maximumFractionDigits: d });
}

let lang = safeGet(STORAGE.lang) === 'en' ? 'en' : 'bn';
const t = key => (I18N[lang][key] ?? I18N.bn[key] ?? key);

/* =========================================================
   5. SETTINGS & CONVERSION ENGINE
   ========================================================= */
function loadSettings() {
  try {
    const s = JSON.parse(safeGet(STORAGE.settings));
    if (s && [s.sqftPerKatha, s.kathaPerBigha, s.sqftPerDecimal].every(v => typeof v === 'number' && isFinite(v) && v > 0)) {
      return { sqftPerKatha: s.sqftPerKatha, kathaPerBigha: s.kathaPerBigha, sqftPerDecimal: s.sqftPerDecimal };
    }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}
let settings = loadSettings();

const sqftPerBigha = () => settings.sqftPerKatha * settings.kathaPerBigha;

/** Convert any unit value → square feet */
function toSqft(unit, v) {
  switch (unit) {
    case 'sqft':    return v;
    case 'decimal': return v * settings.sqftPerDecimal;
    case 'katha':   return v * settings.sqftPerKatha;
    case 'bigha':   return v * sqftPerBigha();
    case 'acre':    return v * SQFT_PER_ACRE;
    case 'point':   return v * settings.sqftPerDecimal / 100;
    case 'sqm':     return v * SQFT_PER_SQM;
    default:        return v;
  }
}

/** Square feet → all units */
function fromSqft(sqft) {
  const decimal = sqft / settings.sqftPerDecimal;
  return {
    sqft,
    decimal,
    katha: sqft / settings.sqftPerKatha,
    bigha: sqft / sqftPerBigha(),
    acre: sqft / SQFT_PER_ACRE,
    point: decimal * 100,
    sqm: sqft / SQFT_PER_SQM
  };
}

/* =========================================================
   6. TRANSLATION ENGINE
   ========================================================= */
function applyI18n() {
  document.documentElement.lang = lang;
  document.title = t('page_title');
  $$('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
  $$('[data-i18n-ph]').forEach(n => { n.placeholder = t(n.dataset.i18nPh); });
  $$('[data-i18n-aria]').forEach(n => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
  $$('.field-error').forEach(n => { n.textContent = n.dataset.key ? t(n.dataset.key) : ''; });
}

function setLang(l) {
  lang = l;
  safeSet(STORAGE.lang, l);
  applyI18n();
  refreshAll();
}

/* =========================================================
   7. TOAST
   ========================================================= */
let toastTimer;
function toast(key) {
  const box = el('toast');
  box.textContent = t(key);
  box.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('show'), 2600);
}

/* =========================================================
   8. VALIDATION
   ========================================================= */
function setError(input, key) {
  const box = input.closest('.field');
  const err = box ? box.querySelector('.field-error') : null;
  if (err) { err.dataset.key = key || ''; err.textContent = key ? t(key) : ''; }
  input.classList.toggle('invalid', !!key);
  input.setAttribute('aria-invalid', key ? 'true' : 'false');
}

/** Returns the number if valid, otherwise null (and shows an error) */
function validateInput(input) {
  const raw = input.value.trim();
  const allowZero = input.dataset.allowZero === 'true';
  const max = input.dataset.max ? Number(input.dataset.max) : 1e9;
  let key = null, value = null;

  if (raw === '') {
    key = input.validity && input.validity.badInput ? 'err_invalid' : 'err_required';
  } else {
    value = Number(raw);
    if (!isFinite(value)) key = 'err_invalid';
    else if (value < 0) key = 'err_negative';
    else if (value === 0 && !allowZero) key = 'err_positive';
    else if (value > max) key = 'err_large';
  }
  setError(input, key);
  return key ? null : value;
}

/* =========================================================
   9. RENDER RESULT CARDS
   ========================================================= */
function renderCards(container, values, keys) {
  container.innerHTML = keys.map(k => `
    <div class="result-card">
      <div class="rc-icon" aria-hidden="true">${UNITS[k].icon}</div>
      <div class="rc-body">
        <div class="rc-name">${UNITS[k].bn}<span>${UNITS[k].en}</span></div>
        <div class="rc-value">${fmt(values[k], UNITS[k].digits)}</div>
      </div>
    </div>`).join('');
}

/* =========================================================
   10. TEXT REPORTS, COPY, DOWNLOAD, PRINT
   ========================================================= */
function nowText() {
  return new Date().toLocaleString(lang === 'bn' ? 'bn-IN-u-nu-latn' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function settingsLines() {
  return [
    `${t('rep_std')}:`,
    `  1 ${UNITS.decimal[lang]} = ${fmt(settings.sqftPerDecimal, 4)} ${UNITS.sqft[lang]}`,
    `  1 ${UNITS.katha[lang]} = ${fmt(settings.sqftPerKatha, 4)} ${UNITS.sqft[lang]}`,
    `  1 ${UNITS.bigha[lang]} = ${fmt(settings.kathaPerBigha, 4)} ${UNITS.katha[lang]} = ${fmt(sqftPerBigha(), 4)} ${UNITS.sqft[lang]}`,
    `  1 ${UNITS.acre[lang]} = ${fmt(SQFT_PER_ACRE, 0)} ${UNITS.sqft[lang]}`,
    `  1 ${UNITS.sqm[lang]} = ${SQFT_PER_SQM} ${UNITS.sqft[lang]}`
  ];
}

function reportHeader(title) {
  return ['BHUMI METER', t('tagline'), '='.repeat(44), title, `${t('rep_date')}: ${nowText()}`, ''];
}
function reportFooter() {
  return ['', ...settingsLines(), '', t('note_text'), '', 'ROHAN ONLINE SERVICE CENTRE – mollaakriul158@gmail.com'];
}
function unitLines(values) {
  return ALL_UNITS.map(k => `${UNITS[k].bn} (${UNITS[k].en}): ${fmt(values[k], UNITS[k].digits)}`);
}

function buildMainReport() {
  const sqft = lastMain.length * lastMain.width;
  return [
    ...reportHeader(t('rep_title')),
    `${t('lbl_length')}: ${fmt(lastMain.length, 4)}`,
    `${t('lbl_width')}: ${fmt(lastMain.width, 4)}`,
    '',
    ...unitLines(fromSqft(sqft)),
    ...reportFooter()
  ].join('\n');
}

function buildMultiReport() {
  const lines = [...reportHeader(t('rep_multi'))];
  lastMulti.plots.forEach((p, i) => {
    const name = p.name || `${t('plot_word')} ${i + 1}`;
    lines.push(`${i + 1}. ${name}: ${fmt(p.length, 4)} × ${fmt(p.width, 4)} = ${fmt(p.area, 4)} ${UNITS.sqft[lang]}`);
  });
  lines.push('', `${t('rep_total')}:`, ...unitLines(fromSqft(lastMulti.total)), ...reportFooter());
  return lines.join('\n');
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error('fallback');
    }
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    if (!ok) { toast('toast_copy_fail'); return; }
  }
  toast('toast_copied');
}

function downloadText(filename, text) {
  const blob = new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('toast_downloaded');
}

function printSection(node) {
  document.body.classList.add('print-mode');
  node.classList.add('print-target');
  const cleanup = () => {
    document.body.classList.remove('print-mode');
    node.classList.remove('print-target');
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}

/* =========================================================
   11. MAIN LAND CALCULATOR
   ========================================================= */
let lastMain = null;

function calculateMain() {
  const L = validateInput(el('length'));
  const W = validateInput(el('width'));
  if (L === null || W === null) {
    (L === null ? el('length') : el('width')).focus();
    return;
  }
  lastMain = { length: L, width: W };
  showMain();
}

function showMain() {
  if (!lastMain) return;
  const sqft = lastMain.length * lastMain.width;
  el('mainSummary').textContent =
    `${fmt(lastMain.length, 4)} ${t('h_ft')} × ${fmt(lastMain.width, 4)} ${t('h_ft')} = ${fmt(sqft, 2)} ${UNITS.sqft[lang]}`;
  renderCards(el('mainCards'), fromSqft(sqft), ALL_UNITS);
  el('mainResult').hidden = false;
}

function resetMain() {
  el('length').value = ''; el('width').value = '';
  setError(el('length'), null); setError(el('width'), null);
  lastMain = null;
  el('mainResult').hidden = true;
  el('length').focus();
}

/* ---------- History ---------- */
function loadHistory() {
  try {
    const h = JSON.parse(safeGet(STORAGE.history));
    return Array.isArray(h) ? h : [];
  } catch (e) { return []; }
}
function storeHistory(list) { safeSet(STORAGE.history, JSON.stringify(list)); }

function saveMainToHistory() {
  if (!lastMain) { toast('toast_calc_first'); return; }
  const sqft = lastMain.length * lastMain.width;
  const v = fromSqft(sqft);
  const list = loadHistory();
  list.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ts: new Date().toISOString(),
    length: lastMain.length, width: lastMain.width,
    sqft, decimal: v.decimal, katha: v.katha, bigha: v.bigha
  });
  storeHistory(list.slice(0, MAX_HISTORY));
  renderHistory();
  toast('toast_saved');
}

function renderHistory() {
  const list = loadHistory();
  const box = el('historyList');
  if (!list.length) {
    box.innerHTML = `<div class="history-empty">${t('hist_empty')}</div>`;
    return;
  }
  const locale = lang === 'bn' ? 'bn-IN-u-nu-latn' : 'en-IN';
  box.innerHTML = list.map(h => {
    const date = new Date(h.ts).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
    return `
    <article class="history-item">
      <div class="hi-main">
        <div class="hi-date">🕒 ${escapeHtml(date)}</div>
        <div class="hi-dims">${t('h_length')} ${fmt(h.length, 4)} × ${t('h_width')} ${fmt(h.width, 4)} ${t('h_ft')}</div>
        <div class="hi-chips">
          <span>${UNITS.sqft.bn}: ${fmt(h.sqft, 2)}</span>
          <span>${UNITS.decimal.bn}: ${fmt(h.decimal, 4)}</span>
          <span>${UNITS.katha.bn}: ${fmt(h.katha, 4)}</span>
          <span>${UNITS.bigha.bn}: ${fmt(h.bigha, 4)}</span>
        </div>
      </div>
      <button type="button" class="btn btn-danger btn-sm" data-action="del-history" data-id="${escapeHtml(h.id)}">🗑 ${t('hist_delete')}</button>
    </article>`;
  }).join('');
}

function deleteHistory(id) {
  storeHistory(loadHistory().filter(h => h.id !== id));
  renderHistory();
  toast('toast_deleted');
}
function clearHistory() {
  if (!loadHistory().length) return;
  if (!window.confirm(t('hist_confirm'))) return;
  storeHistory([]);
  renderHistory();
  toast('toast_cleared');
}

/* =========================================================
   12. ADVANCED CONVERTER
   ========================================================= */
function buildConverters() {
  el('converterGrid').innerHTML = CONVERTERS.map(c => `
    <article class="card conv-card" data-conv="${c.key}">
      <h3 data-i18n="conv_title_${c.key}"></h3>
      <div class="field">
        <label for="conv_${c.key}" data-i18n="conv_in_${c.key}"></label>
        <input id="conv_${c.key}" class="num-input conv-input" type="number" step="any" min="0" inputmode="decimal" data-allow-zero="true" autocomplete="off">
        <p class="field-error" role="alert"></p>
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-primary btn-sm" data-action="convert" data-conv="${c.key}" data-i18n="btn_convert"></button>
        <button type="button" class="btn btn-ghost btn-sm" data-action="conv-reset" data-conv="${c.key}" data-i18n="btn_reset"></button>
      </div>
      <div class="mini-results" id="convOut_${c.key}" aria-live="polite"></div>
    </article>`).join('');
}

function updateConverter(key) {
  const input = el('conv_' + key);
  const out = el('convOut_' + key);
  const v = validateInput(input);
  if (v === null) { out.innerHTML = ''; return; }
  const values = fromSqft(toSqft(key, v));
  const conf = CONVERTERS.find(c => c.key === key);
  out.innerHTML = conf.out.map(k => `
    <div class="mini-row">
      <span class="mr-name">${UNITS[k].icon} ${UNITS[k].bn} <span>${UNITS[k].en}</span></span>
      <span class="mr-val">${fmt(values[k], UNITS[k].digits)}</span>
    </div>`).join('');
}

function resetConverter(key) {
  const input = el('conv_' + key);
  input.value = '';
  setError(input, null);
  el('convOut_' + key).innerHTML = '';
  input.focus();
}

/* =========================================================
   13. MULTIPLE PLOT CALCULATOR
   ========================================================= */
let plotCounter = 0;
let lastMulti = null;

function addPlot() {
  plotCounter++;
  const n = plotCounter;
  const row = document.createElement('div');
  row.className = 'plot-row';
  row.innerHTML = `
    <div class="plot-head">
      <span class="plot-badge"></span>
      <button type="button" class="btn btn-danger btn-sm" data-action="remove-plot" data-i18n="btn_remove_plot"></button>
    </div>
    <div class="plot-fields">
      <div class="field">
        <label for="pn${n}" data-i18n="plot_name"></label>
        <input id="pn${n}" class="plot-name" type="text" maxlength="40" autocomplete="off" data-i18n-ph="ph_plot_name">
        <p class="field-error"></p>
      </div>
      <div class="field">
        <label for="pl${n}" data-i18n="plot_length"></label>
        <input id="pl${n}" class="num-input plot-length" type="number" step="any" min="0" inputmode="decimal">
        <p class="field-error" role="alert"></p>
      </div>
      <div class="field">
        <label for="pw${n}" data-i18n="plot_width"></label>
        <input id="pw${n}" class="num-input plot-width" type="number" step="any" min="0" inputmode="decimal">
        <p class="field-error" role="alert"></p>
      </div>
    </div>`;
  el('plotList').appendChild(row);
  applyI18n();
  renumberPlots();
}

function renumberPlots() {
  $$('.plot-row').forEach((row, i) => {
    row.querySelector('.plot-badge').textContent = `${t('plot_word')} ${i + 1}`;
  });
}

function removePlot(row) {
  if ($$('.plot-row').length <= 1) { toast('err_min_one'); return; }
  row.remove();
  renumberPlots();
  lastMulti = null;
  el('multiResult').hidden = true;
}

function calculateMulti() {
  let ok = true;
  const plots = [];
  $$('.plot-row').forEach(row => {
    const L = validateInput(row.querySelector('.plot-length'));
    const W = validateInput(row.querySelector('.plot-width'));
    if (L === null || W === null) { ok = false; return; }
    plots.push({ name: row.querySelector('.plot-name').value.trim(), length: L, width: W, area: L * W });
  });
  if (!ok) { toast('err_fix'); return; }
  lastMulti = { plots, total: plots.reduce((s, p) => s + p.area, 0) };
  showMulti();
}

function showMulti() {
  if (!lastMulti) return;
  const rows = lastMulti.plots.map((p, i) => `
    <tr>
      <td>${escapeHtml(p.name || `${t('plot_word')} ${i + 1}`)}</td>
      <td>${fmt(p.length, 4)}</td>
      <td>${fmt(p.width, 4)}</td>
      <td>${fmt(p.area, 4)}</td>
    </tr>`).join('');
  el('multiTable').innerHTML = `
    <thead><tr><th>${t('th_plot')}</th><th>${t('th_length')}</th><th>${t('th_width')}</th><th>${t('th_area')}</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><th colspan="3">${t('multi_total_title')}</th><th>${fmt(lastMulti.total, 4)}</th></tr></tfoot>`;
  renderCards(el('multiCards'), fromSqft(lastMulti.total), ALL_UNITS);
  el('multiResult').hidden = false;
}

function resetMulti() {
  el('plotList').innerHTML = '';
  plotCounter = 0;
  lastMulti = null;
  el('multiResult').hidden = true;
  addPlot(); addPlot();
}

/* =========================================================
   14. CUSTOM CONVERSION SETTINGS
   ========================================================= */
function fillSettingsInputs() {
  el('setKatha').value = settings.sqftPerKatha;
  el('setKB').value = settings.kathaPerBigha;
  el('setDecimal').value = settings.sqftPerDecimal;
  ['setKatha', 'setKB', 'setDecimal'].forEach(id => setError(el(id), null));
}

function updateSettingsPreview() {
  el('settingsPreview').textContent =
    `${t('set_active')} 1 ${UNITS.katha[lang]} = ${fmt(settings.sqftPerKatha, 4)} ${UNITS.sqft[lang]} • ` +
    `1 ${UNITS.bigha[lang]} = ${fmt(settings.kathaPerBigha, 4)} ${UNITS.katha[lang]} (${fmt(sqftPerBigha(), 2)} ${UNITS.sqft[lang]}) • ` +
    `1 ${UNITS.decimal[lang]} = ${fmt(settings.sqftPerDecimal, 4)} ${UNITS.sqft[lang]}`;
}

function saveSettings() {
  const k = validateInput(el('setKatha'));
  const b = validateInput(el('setKB'));
  const d = validateInput(el('setDecimal'));
  if (k === null || b === null || d === null) { toast('err_fix'); return; }
  settings = { sqftPerKatha: k, kathaPerBigha: b, sqftPerDecimal: d };
  safeSet(STORAGE.settings, JSON.stringify(settings));
  refreshAll();
  toast('toast_set_saved');
}

function restoreSettings() {
  settings = { ...DEFAULT_SETTINGS };
  safeSet(STORAGE.settings, JSON.stringify(settings));
  fillSettingsInputs();
  refreshAll();
  toast('toast_set_restored');
}

/* =========================================================
   15. CONSTRUCTION MATERIAL ESTIMATOR
   ========================================================= */
let lastBuild = null;

function calculateBuild() {
  const ids = { L: 'bLen', W: 'bWid', H: 'bHei', brL: 'brL', brW: 'brW', brH: 'brH', bag: 'bBag', joint: 'bJoint', open: 'bOpen', waste: 'bWaste' };
  const v = {};
  let bad = false;
  Object.keys(ids).forEach(k => {
    v[k] = validateInput(el(ids[k]));
    if (v[k] === null) bad = true;
  });
  if (bad) { toast('err_fix'); return; }

  const thickIn = Number(el('bThick').value);   // 4.5 or 9 inch
  const sandPart = Number(el('bRatio').value);  // 1 : sandPart
  const perimeter = 2 * (v.L + v.W);            // ft
  const wallArea = perimeter * v.H;             // sq ft (gross)

  if (v.open >= wallArea) { setError(el('bOpen'), 'err_openings'); toast('err_fix'); return; }

  const thickFt = thickIn / 12;
  const wallVol = (wallArea - v.open) * thickFt;              // cu ft (net of openings)
  const wallIn3 = wallVol * 1728;                             // cubic inches
  const wasteF = 1 + v.waste / 100;

  // Bricks: one brick + its mortar joint on each direction
  const brickWithMortar = (v.brL + v.joint) * (v.brW + v.joint) * (v.brH + v.joint);
  const bricksNet = wallIn3 / brickWithMortar;
  const bricks = Math.ceil(bricksNet * wasteF);

  // Mortar
  const brickVolCft = bricksNet * v.brL * v.brW * v.brH / 1728;
  const mortarWet = Math.max(wallVol - brickVolCft, 0) * wasteF;   // cu ft
  const mortarDry = mortarWet * 1.27;                               // cu ft
  const dryM3 = mortarDry * CFT_TO_M3;

  // Cement & sand (ratio 1 : sandPart)
  const cementM3 = dryM3 / (1 + sandPart);
  const sandM3 = dryM3 * sandPart / (1 + sandPart);
  const bagM3 = v.bag / 1440;                // cement density 1440 kg/m³
  const bagsExact = cementM3 / bagM3;

  lastBuild = {
    wallVol, bricks, waste: v.waste, mortarWet, mortarDry,
    bagsExact, bags: Math.ceil(bagsExact), cementKg: bagsExact * v.bag,
    sandM3, sandCft: sandM3 / CFT_TO_M3
  };
  showBuild();
}

function buildCardHtml(icon, label, value, unit, sub) {
  return `
    <div class="result-card">
      <div class="rc-icon" aria-hidden="true">${icon}</div>
      <div class="rc-body">
        <div class="rc-name">${label}</div>
        <div class="rc-value">${value} <small>${unit}</small></div>
        ${sub ? `<div class="rc-sub">${sub}</div>` : ''}
      </div>
    </div>`;
}

function showBuild() {
  if (!lastBuild) return;
  const b = lastBuild;
  el('buildCards').innerHTML = [
    buildCardHtml('🧱', t('r_wall'), fmt(b.wallVol, 2), t('u_cft'), `${fmt(b.wallVol * CFT_TO_M3, 3)} ${t('u_m3')}`),
    buildCardHtml('🧱', t('r_bricks'), fmt(b.bricks, 0), t('u_pcs'), `${t('r_incl_waste')} ${fmt(b.waste, 1)}%`),
    buildCardHtml('🪣', t('r_mortar_wet'), fmt(b.mortarWet, 2), t('u_cft'), `${fmt(b.mortarWet * CFT_TO_M3, 3)} ${t('u_m3')}`),
    buildCardHtml('🪣', t('r_mortar_dry'), fmt(b.mortarDry, 2), t('u_cft'), `${fmt(b.mortarDry * CFT_TO_M3, 3)} ${t('u_m3')}`),
    buildCardHtml('🏗️', t('r_cement'), fmt(b.bags, 0), t('u_bags'), `≈ ${fmt(b.bagsExact, 2)} • ${fmt(b.cementKg, 0)} ${t('u_kg')}`),
    buildCardHtml('⛱️', t('r_sand'), fmt(b.sandM3, 2), t('u_m3'), `${fmt(b.sandCft, 1)} ${t('u_cft')}`)
  ].join('');
  el('buildResult').hidden = false;
}

function resetBuild() {
  const defaults = { bLen: 12, bWid: 10, bHei: 10, brL: 9, brW: 4.5, brH: 3, bJoint: 0.375, bBag: 50, bOpen: 0, bWaste: 5 };
  Object.keys(defaults).forEach(id => { el(id).value = defaults[id]; setError(el(id), null); });
  el('bThick').value = '9';
  el('bRatio').value = '5';
  lastBuild = null;
  el('buildResult').hidden = true;
}

/* =========================================================
   16. EDUCATION RENDER
   ========================================================= */
function renderEducation() {
  el('eduGrid').innerHTML = EDU.map(c => `
    <article class="edu-card">
      <div class="edu-icon" aria-hidden="true">${c.icon}</div>
      <h3>${c[lang].h}</h3>
      <p>${c[lang].p}</p>
      <p class="edu-ex"><strong>${t('edu_example')}</strong> ${c[lang].ex}</p>
    </article>`).join('');
}

/* =========================================================
   17. REFRESH EVERYTHING (after language / settings change)
   ========================================================= */
function refreshAll() {
  renderEducation();
  renumberPlots();
  showMain();
  showMulti();
  showBuild();
  renderHistory();
  updateSettingsPreview();
  CONVERTERS.forEach(c => {
    const input = el('conv_' + c.key);
    if (input.value.trim() !== '') updateConverter(c.key);
  });
}

/* =========================================================
   18. NAVIGATION: mobile menu, scroll-spy, reveal animation
   ========================================================= */
function closeMenu() {
  el('mainNav').classList.remove('open');
  el('menuBtn').setAttribute('aria-expanded', 'false');
}

function initNavigation() {
  const menuBtn = el('menuBtn');
  menuBtn.addEventListener('click', () => {
    const open = el('mainNav').classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#mainNav a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const header = el('siteHeader');
  const sections = $$('main section[id], footer[id]');
  const links = $$('#mainNav a');

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 10);
    const y = window.scrollY + 140;
    let current = 'home';
    sections.forEach(s => { if (s.offsetTop <= y) current = s.dataset.nav || s.id; });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = 'contact';
    links.forEach(a => {
      const active = a.dataset.target === current;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
}

function initReveal() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('visible')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
  }, { threshold: 0.08 });
  items.forEach(i => io.observe(i));
}

/* =========================================================
   19. EVENT WIRING
   ========================================================= */
function wireEvents() {
  // Forms (Enter key support)
  el('mainForm').addEventListener('submit', e => { e.preventDefault(); calculateMain(); });
  el('buildForm').addEventListener('submit', e => { e.preventDefault(); calculateBuild(); });
  el('settingsForm').addEventListener('submit', e => { e.preventDefault(); saveSettings(); });

  // Live validation + live converters
  document.addEventListener('input', e => {
    const inp = e.target;
    if (!inp.matches || !inp.matches('.num-input')) return;
    if (inp.classList.contains('conv-input')) {
      const key = inp.closest('[data-conv]').dataset.conv;
      if (inp.value.trim() === '' && !inp.validity.badInput) {
        setError(inp, null);
        el('convOut_' + key).innerHTML = '';
      } else {
        updateConverter(key);
      }
    } else {
      validateInput(inp);
    }
  });

  // All buttons via data-action
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case 'toggle-lang':     setLang(lang === 'bn' ? 'en' : 'bn'); break;

      case 'reset-main':      resetMain(); break;
      case 'copy-main':       if (lastMain) copyText(buildMainReport()); else toast('toast_calc_first'); break;
      case 'print-main':      if (lastMain) printSection(el('mainResult')); else toast('toast_calc_first'); break;
      case 'download-main':   if (lastMain) downloadText('bhumi-meter-result.txt', buildMainReport()); else toast('toast_calc_first'); break;
      case 'save-main':       saveMainToHistory(); break;
      case 'del-history':     deleteHistory(btn.dataset.id); break;
      case 'clear-history':   clearHistory(); break;

      case 'convert':         updateConverter(btn.dataset.conv); break;
      case 'conv-reset':      resetConverter(btn.dataset.conv); break;

      case 'add-plot':        addPlot(); break;
      case 'remove-plot':     removePlot(btn.closest('.plot-row')); break;
      case 'calc-multi':      calculateMulti(); break;
      case 'reset-multi':     resetMulti(); break;
      case 'copy-multi':      if (lastMulti) copyText(buildMultiReport()); else toast('toast_calc_first'); break;
      case 'print-multi':     if (lastMulti) printSection(el('multiResult')); else toast('toast_calc_first'); break;
      case 'download-multi':  if (lastMulti) downloadText('bhumi-meter-multi-plot.txt', buildMultiReport()); else toast('toast_calc_first'); break;

      case 'restore-settings': restoreSettings(); break;
      case 'reset-build':     resetBuild(); break;
      default: break;
    }
  });
}

/* =========================================================
   20. INIT
   ========================================================= */
function init() {
  buildConverters();
  addPlot();
  addPlot();
  fillSettingsInputs();
  applyI18n();
  refreshAll();
  wireEvents();
  initNavigation();
  initReveal();
}

init();