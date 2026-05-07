(() => {
  "use strict";

  const COUNTRY_FIELDS = [
    "name",
    "flags",
    "capital",
    "capitalInfo",
    "region",
    "continents",
    "population",
    "latlng",
    "cca2",
    "cca3",
  ];

  const REST_COUNTRIES_URL = `https://restcountries.com/v3.1/all?fields=${COUNTRY_FIELDS.join(",")}`;
  const REST_COUNTRIES_FALLBACK = "https://restcountries.com/v3.1/all?fields=name,flags,capital,region,continents,population,latlng,cca2,cca3";
  const countryDetailUrl = (code) => `https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}`;
  const STORE = "atlasPrime:";
  const PAGE_SIZE = 24;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    countries: [],
    filtered: [],
    countryByCode: new Map(),
    favorites: new Set(),
    visited: new Set(),
    visibleCount: PAGE_SIZE,
    search: "",
    continent: "All",
    language: "en",
    theme: "dark",
    currentUser: null,
    authMode: "login",
    currentCountry: null,
    map: null,
    charts: {},
    indicators: {},
    compareToken: 0,
    quiz: {
      mode: "flag",
      current: null,
      answered: false,
      score: 0,
      total: 0,
    },
    globe: null,
  };

  const els = {};

  const i18n = {
    en: {
      loading: "Loading world data...",
      navCountries: "Countries",
      navCompare: "Compare",
      navQuiz: "Quiz",
      navFavorites: "Favorites",
      login: "Login",
      register: "Register",
      logout: "Logout",
      eyebrow: "Global country intelligence",
      heroTitle: "Atlas Prime",
      heroText: "Explore countries, compare economies, save favorites, play quizzes, and inspect live maps from a fast modern dashboard.",
      startExploring: "Start exploring",
      playQuiz: "Play quiz",
      countriesMetric: "Countries",
      featuresMetric: "Live modules",
      languagesMetric: "Languages",
      searchPlaceholder: "Search countries, capitals, languages...",
      filterAll: "All",
      syncing: "Syncing REST Countries API",
      liveData: "Live REST Countries data",
      demoData: "Demo data loaded. Connect to the internet for the full country list.",
      saved: "Saved",
      favoriteCountries: "Favorite countries",
      clearFavorites: "Clear favorites",
      noFavorites: "No favorites yet. Save countries from the cards.",
      loadMore: "Load more",
      analysis: "Analysis",
      compareTitle: "Country comparison",
      countryOne: "Country one",
      countryTwo: "Country two",
      challenge: "Challenge",
      quizTitle: "Country quiz game",
      score: "Score",
      guessFlag: "Guess the flag",
      guessCapital: "Guess the capital",
      nextQuestion: "Next question",
      resetScore: "Reset score",
      history: "History",
      visitedCountries: "Visited countries",
      noVisited: "Open a country to start tracking visits.",
      footerText: "Built for fast country discovery with REST Countries, Leaflet, Chart.js, and Three.js.",
      favorite: "Favorite",
      details: "Details",
      overview: "Overview",
      map: "Map",
      charts: "Charts",
      news: "News",
      weather: "Weather",
      facts: "Interesting facts",
      account: "Account",
      name: "Name",
      password: "Password",
      continue: "Continue",
      apiSettings: "API settings",
      saveKeys: "Save keys",
      keysStored: "Keys stay in this browser only.",
      countries: "countries",
      country: "country",
      capital: "Capital",
      continent: "Continent",
      population: "Population",
      currency: "Currency",
      languages: "Languages",
      timezones: "Timezones",
      area: "Area",
      callingCode: "Calling code",
      domain: "Internet domain",
      borders: "Borders",
      nativeName: "Native name",
      unavailable: "Unavailable",
      noBorders: "No land borders",
      noResults: "No countries match your search.",
      noApiKeyWeather: "Add an OpenWeather key to show live capital weather.",
      noApiKeyNews: "Add a NewsAPI key to show latest country news.",
      addKey: "Add API key",
      quizCorrect: "Correct",
      quizWrong: "Wrong answer",
      chooseAnswer: "Choose an answer",
      accountReady: "You are signed in.",
      invalidLogin: "Email or password is incorrect.",
      registered: "Account created and signed in.",
      accountExists: "An account with this email already exists.",
      keysSaved: "API keys saved.",
      apiError: "Live service unavailable right now.",
    },
    hi: {
      loading: "विश्व डेटा लोड हो रहा है...",
      navCountries: "देश",
      navCompare: "तुलना",
      navQuiz: "क्विज",
      navFavorites: "पसंदीदा",
      login: "लॉगिन",
      register: "रजिस्टर",
      logout: "लॉगआउट",
      eyebrow: "वैश्विक देश इंटेलिजेंस",
      heroTitle: "Atlas Prime",
      heroText: "देश खोजें, अर्थव्यवस्थाओं की तुलना करें, पसंदीदा सेव करें, क्विज खेलें और लाइव मानचित्र देखें।",
      startExploring: "खोज शुरू करें",
      playQuiz: "क्विज खेलें",
      countriesMetric: "देश",
      featuresMetric: "लाइव मॉड्यूल",
      languagesMetric: "भाषाएं",
      searchPlaceholder: "देश, राजधानी, भाषा खोजें...",
      filterAll: "सभी",
      syncing: "REST Countries API सिंक हो रही है",
      liveData: "लाइव REST Countries डेटा",
      demoData: "डेमो डेटा लोड हुआ। पूरी सूची के लिए इंटरनेट कनेक्ट करें।",
      saved: "सेव",
      favoriteCountries: "पसंदीदा देश",
      clearFavorites: "पसंदीदा हटाएं",
      noFavorites: "अभी कोई पसंदीदा नहीं है। कार्ड से देश सेव करें।",
      loadMore: "और लोड करें",
      analysis: "विश्लेषण",
      compareTitle: "देश तुलना",
      countryOne: "पहला देश",
      countryTwo: "दूसरा देश",
      challenge: "चैलेंज",
      quizTitle: "देश क्विज गेम",
      score: "स्कोर",
      guessFlag: "झंडा पहचानें",
      guessCapital: "राजधानी पहचानें",
      nextQuestion: "अगला प्रश्न",
      resetScore: "स्कोर रीसेट",
      history: "इतिहास",
      visitedCountries: "देखे गए देश",
      noVisited: "विजिट ट्रैक करने के लिए कोई देश खोलें।",
      footerText: "REST Countries, Leaflet, Chart.js और Three.js से बना तेज देश डैशबोर्ड।",
      favorite: "पसंदीदा",
      details: "विवरण",
      overview: "ओवरव्यू",
      map: "मानचित्र",
      charts: "चार्ट",
      news: "समाचार",
      weather: "मौसम",
      facts: "रोचक तथ्य",
      account: "अकाउंट",
      name: "नाम",
      password: "पासवर्ड",
      continue: "जारी रखें",
      apiSettings: "API सेटिंग्स",
      saveKeys: "की सेव करें",
      keysStored: "की सिर्फ इस ब्राउजर में रहती हैं।",
      countries: "देश",
      country: "देश",
      capital: "राजधानी",
      continent: "महाद्वीप",
      population: "जनसंख्या",
      currency: "मुद्रा",
      languages: "भाषाएं",
      timezones: "समय क्षेत्र",
      area: "क्षेत्रफल",
      callingCode: "कॉलिंग कोड",
      domain: "इंटरनेट डोमेन",
      borders: "सीमाएं",
      nativeName: "स्थानीय नाम",
      unavailable: "उपलब्ध नहीं",
      noBorders: "स्थलीय सीमा नहीं",
      noResults: "आपकी खोज से कोई देश नहीं मिला।",
      noApiKeyWeather: "राजधानी का लाइव मौसम देखने के लिए OpenWeather की जोड़ें।",
      noApiKeyNews: "ताजा समाचार देखने के लिए NewsAPI की जोड़ें।",
      addKey: "API की जोड़ें",
      quizCorrect: "सही",
      quizWrong: "गलत जवाब",
      chooseAnswer: "एक जवाब चुनें",
      accountReady: "आप साइन इन हैं।",
      invalidLogin: "ईमेल या पासवर्ड गलत है।",
      registered: "अकाउंट बना और साइन इन हो गया।",
      accountExists: "इस ईमेल से अकाउंट पहले से मौजूद है।",
      keysSaved: "API की सेव हो गईं।",
      apiError: "लाइव सेवा अभी उपलब्ध नहीं है।",
    },
    ar: {
      loading: "جار تحميل بيانات العالم...",
      navCountries: "الدول",
      navCompare: "مقارنة",
      navQuiz: "اختبار",
      navFavorites: "المفضلة",
      login: "دخول",
      register: "تسجيل",
      logout: "خروج",
      eyebrow: "ذكاء دول العالم",
      heroTitle: "Atlas Prime",
      heroText: "استكشف الدول، قارن الاقتصادات، احفظ المفضلة، العب الاختبارات، وشاهد الخرائط المباشرة.",
      startExploring: "ابدأ الاستكشاف",
      playQuiz: "ابدأ الاختبار",
      countriesMetric: "دول",
      featuresMetric: "وحدات مباشرة",
      languagesMetric: "لغات",
      searchPlaceholder: "ابحث عن دولة أو عاصمة أو لغة...",
      filterAll: "الكل",
      syncing: "مزامنة REST Countries API",
      liveData: "بيانات REST Countries مباشرة",
      demoData: "تم تحميل بيانات تجريبية. اتصل بالإنترنت للقائمة الكاملة.",
      saved: "محفوظ",
      favoriteCountries: "الدول المفضلة",
      clearFavorites: "مسح المفضلة",
      noFavorites: "لا توجد مفضلة بعد. احفظ الدول من البطاقات.",
      loadMore: "تحميل المزيد",
      analysis: "تحليل",
      compareTitle: "مقارنة الدول",
      countryOne: "الدولة الأولى",
      countryTwo: "الدولة الثانية",
      challenge: "تحدي",
      quizTitle: "لعبة اختبار الدول",
      score: "النتيجة",
      guessFlag: "خمن العلم",
      guessCapital: "خمن العاصمة",
      nextQuestion: "السؤال التالي",
      resetScore: "إعادة النتيجة",
      history: "السجل",
      visitedCountries: "الدول التي تمت زيارتها",
      noVisited: "افتح دولة لبدء تتبع الزيارات.",
      footerText: "تطبيق سريع لاكتشاف الدول باستخدام REST Countries وLeaflet وChart.js وThree.js.",
      favorite: "مفضلة",
      details: "تفاصيل",
      overview: "نظرة عامة",
      map: "الخريطة",
      charts: "الرسوم",
      news: "الأخبار",
      weather: "الطقس",
      facts: "حقائق مثيرة",
      account: "الحساب",
      name: "الاسم",
      password: "كلمة المرور",
      continue: "متابعة",
      apiSettings: "إعدادات API",
      saveKeys: "حفظ المفاتيح",
      keysStored: "تبقى المفاتيح في هذا المتصفح فقط.",
      countries: "دول",
      country: "دولة",
      capital: "العاصمة",
      continent: "القارة",
      population: "السكان",
      currency: "العملة",
      languages: "اللغات",
      timezones: "المناطق الزمنية",
      area: "المساحة",
      callingCode: "رمز الاتصال",
      domain: "نطاق الإنترنت",
      borders: "الحدود",
      nativeName: "الاسم المحلي",
      unavailable: "غير متاح",
      noBorders: "لا حدود برية",
      noResults: "لا توجد دول تطابق البحث.",
      noApiKeyWeather: "أضف مفتاح OpenWeather لعرض طقس العاصمة.",
      noApiKeyNews: "أضف مفتاح NewsAPI لعرض آخر الأخبار.",
      addKey: "أضف مفتاح API",
      quizCorrect: "صحيح",
      quizWrong: "إجابة خاطئة",
      chooseAnswer: "اختر إجابة",
      accountReady: "تم تسجيل الدخول.",
      invalidLogin: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      registered: "تم إنشاء الحساب وتسجيل الدخول.",
      accountExists: "يوجد حساب بهذا البريد الإلكتروني.",
      keysSaved: "تم حفظ مفاتيح API.",
      apiError: "الخدمة المباشرة غير متاحة الآن.",
    },
    ja: {
      loading: "世界データを読み込み中...",
      navCountries: "国",
      navCompare: "比較",
      navQuiz: "クイズ",
      navFavorites: "お気に入り",
      login: "ログイン",
      register: "登録",
      logout: "ログアウト",
      eyebrow: "世界の国インテリジェンス",
      heroTitle: "Atlas Prime",
      heroText: "国を探索し、経済を比較し、お気に入りを保存し、クイズを遊び、ライブ地図を確認できます。",
      startExploring: "探索を始める",
      playQuiz: "クイズを遊ぶ",
      countriesMetric: "国",
      featuresMetric: "ライブ機能",
      languagesMetric: "言語",
      searchPlaceholder: "国、首都、言語を検索...",
      filterAll: "すべて",
      syncing: "REST Countries API と同期中",
      liveData: "REST Countries ライブデータ",
      demoData: "デモデータを読み込みました。完全な一覧にはインターネット接続が必要です。",
      saved: "保存済み",
      favoriteCountries: "お気に入りの国",
      clearFavorites: "お気に入りを削除",
      noFavorites: "まだお気に入りはありません。カードから保存できます。",
      loadMore: "もっと見る",
      analysis: "分析",
      compareTitle: "国の比較",
      countryOne: "国 1",
      countryTwo: "国 2",
      challenge: "チャレンジ",
      quizTitle: "国クイズゲーム",
      score: "スコア",
      guessFlag: "国旗を当てる",
      guessCapital: "首都を当てる",
      nextQuestion: "次の問題",
      resetScore: "スコアをリセット",
      history: "履歴",
      visitedCountries: "訪問した国",
      noVisited: "国を開くと履歴に追加されます。",
      footerText: "REST Countries、Leaflet、Chart.js、Three.js で作られた高速な国情報アプリです。",
      favorite: "お気に入り",
      details: "詳細",
      overview: "概要",
      map: "地図",
      charts: "チャート",
      news: "ニュース",
      weather: "天気",
      facts: "豆知識",
      account: "アカウント",
      name: "名前",
      password: "パスワード",
      continue: "続ける",
      apiSettings: "API設定",
      saveKeys: "キーを保存",
      keysStored: "キーはこのブラウザだけに保存されます。",
      countries: "国",
      country: "国",
      capital: "首都",
      continent: "大陸",
      population: "人口",
      currency: "通貨",
      languages: "言語",
      timezones: "タイムゾーン",
      area: "面積",
      callingCode: "国際電話番号",
      domain: "インターネットドメイン",
      borders: "国境",
      nativeName: "現地名",
      unavailable: "利用不可",
      noBorders: "陸上国境なし",
      noResults: "検索に一致する国がありません。",
      noApiKeyWeather: "首都のライブ天気には OpenWeather キーを追加してください。",
      noApiKeyNews: "最新ニュースには NewsAPI キーを追加してください。",
      addKey: "APIキーを追加",
      quizCorrect: "正解",
      quizWrong: "不正解",
      chooseAnswer: "答えを選択",
      accountReady: "サインインしました。",
      invalidLogin: "メールまたはパスワードが違います。",
      registered: "アカウントを作成してサインインしました。",
      accountExists: "このメールのアカウントは既にあります。",
      keysSaved: "APIキーを保存しました。",
      apiError: "ライブサービスは現在利用できません。",
    },
  };

  const continentLabels = {
    en: {
      Asia: "Asia",
      Europe: "Europe",
      Africa: "Africa",
      "North America": "North America",
      "South America": "South America",
      Oceania: "Oceania",
    },
    hi: {
      Asia: "एशिया",
      Europe: "यूरोप",
      Africa: "अफ्रीका",
      "North America": "उत्तरी अमेरिका",
      "South America": "दक्षिण अमेरिका",
      Oceania: "ओशिनिया",
    },
    ar: {
      Asia: "آسيا",
      Europe: "أوروبا",
      Africa: "أفريقيا",
      "North America": "أمريكا الشمالية",
      "South America": "أمريكا الجنوبية",
      Oceania: "أوقيانوسيا",
    },
    ja: {
      Asia: "アジア",
      Europe: "ヨーロッパ",
      Africa: "アフリカ",
      "North America": "北アメリカ",
      "South America": "南アメリカ",
      Oceania: "オセアニア",
    },
  };

  const sampleCountries = [
    makeSampleCountry("IND", "IN", "India", "Republic of India", "New Delhi", "Asia", 1428627663, "INR", "Indian rupee", "₹", ["Hindi", "English"], 3287590, ["UTC+05:30"], [20.5937, 78.9629], [28.6139, 77.209], [".in"], "+91", ["BGD", "BTN", "MMR", "CHN", "NPL", "PAK"]),
    makeSampleCountry("JPN", "JP", "Japan", "Japan", "Tokyo", "Asia", 124516650, "JPY", "Japanese yen", "¥", ["Japanese"], 377930, ["UTC+09:00"], [36.2048, 138.2529], [35.6895, 139.6917], [".jp"], "+81", []),
    makeSampleCountry("DEU", "DE", "Germany", "Federal Republic of Germany", "Berlin", "Europe", 83240525, "EUR", "Euro", "€", ["German"], 357114, ["UTC+01:00"], [51.1657, 10.4515], [52.52, 13.405], [".de"], "+49", ["AUT", "BEL", "CZE", "DNK", "FRA", "LUX", "NLD", "POL", "CHE"]),
    makeSampleCountry("BRA", "BR", "Brazil", "Federative Republic of Brazil", "Brasilia", "South America", 203062512, "BRL", "Brazilian real", "R$", ["Portuguese"], 8515767, ["UTC-05:00", "UTC-04:00", "UTC-03:00", "UTC-02:00"], [-14.235, -51.9253], [-15.7939, -47.8828], [".br"], "+55", ["ARG", "BOL", "COL", "GUF", "GUY", "PRY", "PER", "SUR", "URY", "VEN"]),
    makeSampleCountry("CAN", "CA", "Canada", "Canada", "Ottawa", "North America", 38929902, "CAD", "Canadian dollar", "$", ["English", "French"], 9984670, ["UTC-08:00", "UTC-07:00", "UTC-06:00", "UTC-05:00"], [56.1304, -106.3468], [45.4215, -75.6972], [".ca"], "+1", ["USA"]),
    makeSampleCountry("AUS", "AU", "Australia", "Commonwealth of Australia", "Canberra", "Oceania", 26439111, "AUD", "Australian dollar", "$", ["English"], 7692024, ["UTC+05:00", "UTC+08:00", "UTC+09:30", "UTC+10:00"], [-25.2744, 133.7751], [-35.2809, 149.13], [".au"], "+61", []),
    makeSampleCountry("ZAF", "ZA", "South Africa", "Republic of South Africa", "Pretoria", "Africa", 60414495, "ZAR", "South African rand", "R", ["Afrikaans", "English", "Zulu", "Xhosa"], 1221037, ["UTC+02:00"], [-30.5595, 22.9375], [-25.7479, 28.2293], [".za"], "+27", ["BWA", "LSO", "MOZ", "NAM", "SWZ", "ZWE"]),
    makeSampleCountry("EGY", "EG", "Egypt", "Arab Republic of Egypt", "Cairo", "Africa", 109546720, "EGP", "Egyptian pound", "E£", ["Arabic"], 1002450, ["UTC+02:00"], [26.8206, 30.8025], [30.0444, 31.2357], [".eg"], "+20", ["ISR", "LBY", "SDN"]),
    makeSampleCountry("USA", "US", "United States", "United States of America", "Washington, D.C.", "North America", 334914895, "USD", "United States dollar", "$", ["English"], 9372610, ["UTC-12:00", "UTC-10:00", "UTC-09:00", "UTC-08:00", "UTC-05:00"], [37.0902, -95.7129], [38.9072, -77.0369], [".us"], "+1", ["CAN", "MEX"]),
    makeSampleCountry("FRA", "FR", "France", "French Republic", "Paris", "Europe", 68170228, "EUR", "Euro", "€", ["French"], 551695, ["UTC-10:00", "UTC-05:00", "UTC+01:00", "UTC+03:00"], [46.2276, 2.2137], [48.8566, 2.3522], [".fr"], "+33", ["AND", "BEL", "DEU", "ITA", "LUX", "MCO", "ESP", "CHE"]),
    makeSampleCountry("ARE", "AE", "United Arab Emirates", "United Arab Emirates", "Abu Dhabi", "Asia", 9441129, "AED", "United Arab Emirates dirham", "د.إ", ["Arabic"], 83600, ["UTC+04:00"], [23.4241, 53.8478], [24.4539, 54.3773], [".ae"], "+971", ["OMN", "SAU"]),
    makeSampleCountry("ARG", "AR", "Argentina", "Argentine Republic", "Buenos Aires", "South America", 45773884, "ARS", "Argentine peso", "$", ["Spanish"], 2780400, ["UTC-03:00"], [-38.4161, -63.6167], [-34.6037, -58.3816], [".ar"], "+54", ["BOL", "BRA", "CHL", "PRY", "URY"]),
  ];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    loadPreferences();
    bindEvents();
    applyTheme();
    applyLanguage();
    updateAuthUi();
    showSkeletons();
    setupInfiniteLoading();
    setupGlobe();
    fetchCountries();
    refreshIcons();
  }

  function cacheElements() {
    Object.assign(els, {
      loadingScreen: $("#loadingScreen"),
      mobileMenuBtn: $("#mobileMenuBtn"),
      navPanel: $("#navPanel"),
      themeToggle: $("#themeToggle"),
      languageSelect: $("#languageSelect"),
      authBtn: $("#authBtn"),
      apiSettingsBtn: $("#apiSettingsBtn"),
      searchInput: $("#searchInput"),
      suggestions: $("#suggestions"),
      continentFilters: $("#continentFilters"),
      resultCount: $("#resultCount"),
      dataStatus: $("#dataStatus"),
      metricCountryCount: $("#metricCountryCount"),
      countryGrid: $("#countryGrid"),
      favoriteStrip: $("#favoriteStrip"),
      clearFavoritesBtn: $("#clearFavoritesBtn"),
      loadMoreBtn: $("#loadMoreBtn"),
      loadSentinel: $("#loadSentinel"),
      compareA: $("#compareA"),
      compareB: $("#compareB"),
      swapCompareBtn: $("#swapCompareBtn"),
      compareGrid: $("#compareGrid"),
      compareChart: $("#compareChart"),
      quizScore: $("#quizScore"),
      quizStage: $("#quizStage"),
      quizOptions: $("#quizOptions"),
      nextQuestionBtn: $("#nextQuestionBtn"),
      resetQuizBtn: $("#resetQuizBtn"),
      visitedList: $("#visitedList"),
      backToTop: $("#backToTop"),
      countryModal: $("#countryModal"),
      detailFlag: $("#detailFlag"),
      detailContinent: $("#detailContinent"),
      detailTitle: $("#detailTitle"),
      detailSubtitle: $("#detailSubtitle"),
      detailFavoriteBtn: $("#detailFavoriteBtn"),
      detailGrid: $("#detailGrid"),
      weatherPanel: $("#weatherPanel"),
      factsList: $("#factsList"),
      countryMap: $("#countryMap"),
      newsPanel: $("#newsPanel"),
      authModal: $("#authModal"),
      authForm: $("#authForm"),
      authName: $("#authName"),
      authEmail: $("#authEmail"),
      authPassword: $("#authPassword"),
      authSubmit: $("#authSubmit"),
      authNote: $("#authNote"),
      apiModal: $("#apiModal"),
      apiForm: $("#apiForm"),
      weatherKeyInput: $("#weatherKeyInput"),
      newsKeyInput: $("#newsKeyInput"),
      apiNote: $("#apiNote"),
    });
  }

  function loadPreferences() {
    state.theme = localStorage.getItem(`${STORE}theme`) || "dark";
    state.language = localStorage.getItem(`${STORE}language`) || "en";
    state.currentUser = readJson(`${STORE}currentUser`, null);
    loadQuizState();
    loadCollections();
  }

  function bindEvents() {
    els.mobileMenuBtn.addEventListener("click", () => els.navPanel.classList.toggle("open"));
    $$("#navPanel a").forEach((link) => link.addEventListener("click", () => els.navPanel.classList.remove("open")));

    els.themeToggle.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem(`${STORE}theme`, state.theme);
      applyTheme();
      rerenderCharts();
    });

    els.languageSelect.addEventListener("change", () => {
      state.language = els.languageSelect.value;
      localStorage.setItem(`${STORE}language`, state.language);
      applyLanguage();
      renderAll();
    });

    els.searchInput.addEventListener("input", () => {
      state.search = els.searchInput.value.trim();
      applyFilters();
      renderSuggestions();
    });
    els.searchInput.addEventListener("focus", renderSuggestions);
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".search-shell")) {
        els.suggestions.classList.remove("open");
      }
    });
    els.suggestions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-code]");
      if (!button) return;
      const country = getCountry(button.dataset.code);
      if (!country) return;
      els.searchInput.value = getName(country);
      state.search = getName(country);
      els.suggestions.classList.remove("open");
      applyFilters();
      openCountry(country.cca3);
    });

    $("#voiceBtn").addEventListener("click", startVoiceSearch);

    els.continentFilters.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-continent]");
      if (!chip) return;
      state.continent = chip.dataset.continent;
      $$(".filter-chip", els.continentFilters).forEach((item) => item.classList.toggle("active", item === chip));
      applyFilters();
    });

    els.countryGrid.addEventListener("click", handleCountryGridClick);
    els.favoriteStrip.addEventListener("click", handleCountryGridClick);
    els.visitedList.addEventListener("click", handleCountryGridClick);
    els.loadMoreBtn.addEventListener("click", () => {
      state.visibleCount += PAGE_SIZE;
      renderCountries();
    });

    els.clearFavoritesBtn.addEventListener("click", () => {
      state.favorites.clear();
      saveSet(scopedKey("favorites"), state.favorites);
      renderFavorites();
      renderCountries();
      refreshDetailFavorite();
    });

    els.authBtn.addEventListener("click", handleAuthButton);
    $$("[data-close-auth]").forEach((item) => item.addEventListener("click", closeAuthModal));
    $$(".auth-tabs [data-auth-mode]").forEach((button) => {
      button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
    });
    els.authForm.addEventListener("submit", submitAuth);

    els.apiSettingsBtn.addEventListener("click", openApiModal);
    $$("[data-close-api]").forEach((item) => item.addEventListener("click", closeApiModal));
    els.apiForm.addEventListener("submit", submitApiSettings);

    $$("[data-close-modal]").forEach((item) => item.addEventListener("click", closeCountryModal));
    els.detailFavoriteBtn.addEventListener("click", () => {
      if (state.currentCountry) toggleFavorite(state.currentCountry.cca3);
    });
    $$(".detail-tabs [data-detail-tab]").forEach((button) => {
      button.addEventListener("click", () => setDetailTab(button.dataset.detailTab));
    });
    els.weatherPanel.addEventListener("click", openApiFromInline);
    els.newsPanel.addEventListener("click", openApiFromInline);

    els.compareA.addEventListener("change", () => {
      localStorage.setItem(`${STORE}compareA`, els.compareA.value);
      renderComparison();
    });
    els.compareB.addEventListener("change", () => {
      localStorage.setItem(`${STORE}compareB`, els.compareB.value);
      renderComparison();
    });
    els.swapCompareBtn.addEventListener("click", () => {
      const value = els.compareA.value;
      els.compareA.value = els.compareB.value;
      els.compareB.value = value;
      localStorage.setItem(`${STORE}compareA`, els.compareA.value);
      localStorage.setItem(`${STORE}compareB`, els.compareB.value);
      renderComparison();
    });

    $$(".segmented [data-quiz-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        state.quiz.mode = button.dataset.quizMode;
        $$(".segmented [data-quiz-mode]").forEach((item) => item.classList.toggle("active", item === button));
        newQuestion();
      });
    });
    els.quizOptions.addEventListener("click", answerQuiz);
    els.nextQuestionBtn.addEventListener("click", newQuestion);
    els.resetQuizBtn.addEventListener("click", () => {
      state.quiz.score = 0;
      state.quiz.total = 0;
      saveQuiz();
      updateQuizScore();
      newQuestion();
    });

    window.addEventListener("scroll", () => {
      els.backToTop.classList.toggle("visible", window.scrollY > 600);
    });
    els.backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCountryModal();
        closeAuthModal();
        closeApiModal();
      }
    });
  }

  async function fetchCountries() {
    try {
      const countries = await requestCountries();
      state.countries = countries
        .filter((country) => country?.name?.common && country?.flags && country?.cca3)
        .sort((a, b) => getName(a).localeCompare(getName(b)));
      setStatus(t("liveData"));
    } catch (error) {
      console.warn(error);
      state.countries = sampleCountries;
      setStatus(t("demoData"));
    }

    state.countryByCode = new Map(state.countries.map((country) => [country.cca3, country]));
    els.metricCountryCount.textContent = `${state.countries.length}+`;
    populateCompareSelects();
    applyFilters();
    renderFavorites();
    renderVisited();
    newQuestion();
    hideLoading();
    addCountryPointsToGlobe();
  }

  async function requestCountries() {
    const primary = await fetch(REST_COUNTRIES_URL);
    if (primary.ok) return primary.json();
    const fallback = await fetch(REST_COUNTRIES_FALLBACK);
    if (!fallback.ok) throw new Error("REST Countries API request failed.");
    return fallback.json();
  }

  async function ensureCountryDetails(code) {
    const current = getCountry(code);
    if (!current || current.__detailsLoaded) return current;
    try {
      const response = await fetch(countryDetailUrl(code));
      if (!response.ok) throw new Error("Country detail request failed.");
      const data = await response.json();
      const detailed = Array.isArray(data) ? data[0] : data;
      if (!detailed?.cca3) return current;
      const merged = { ...current, ...detailed, __detailsLoaded: true };
      const index = state.countries.findIndex((country) => country.cca3 === merged.cca3);
      if (index >= 0) state.countries[index] = merged;
      state.countryByCode.set(merged.cca3, merged);
      state.filtered = state.filtered.map((country) => (country.cca3 === merged.cca3 ? merged : country));
      return merged;
    } catch (error) {
      console.warn(error);
      return current;
    }
  }

  function applyFilters() {
    const query = state.search.toLowerCase();
    state.filtered = state.countries.filter((country) => {
      const matchesContinent = state.continent === "All" || getContinent(country) === state.continent;
      if (!matchesContinent) return false;
      if (!query) return true;
      return getSearchText(country).includes(query);
    });
    state.visibleCount = PAGE_SIZE;
    renderCountries();
    updateResultCount();
  }

  function renderAll() {
    renderCountries();
    renderFavorites();
    renderVisited();
    updateResultCount();
    renderComparison();
    updateQuizScore();
    if (state.currentCountry) {
      renderCountryDetail(state.currentCountry);
    }
    refreshIcons();
  }

  function renderCountries() {
    if (!state.filtered.length) {
      els.countryGrid.innerHTML = `<div class="empty-state">${escapeHtml(t("noResults"))}</div>`;
      els.loadMoreBtn.classList.add("hidden");
      return;
    }
    const visible = state.filtered.slice(0, state.visibleCount);
    els.countryGrid.innerHTML = visible.map(renderCountryCard).join("");
    els.loadMoreBtn.classList.toggle("hidden", state.visibleCount >= state.filtered.length);
    refreshIcons();
  }

  function renderCountryCard(country) {
    const code = country.cca3;
    const isFavorite = state.favorites.has(code);
    return `
      <article class="country-card" data-code="${escapeAttr(code)}">
        <div class="flag-frame">
          <img src="${escapeAttr(getFlag(country))}" alt="${escapeAttr(getName(country))} flag" loading="lazy">
        </div>
        <div class="country-card-body">
          <div>
            <span class="eyebrow">${escapeHtml(getContinent(country))}</span>
            <h3>${escapeHtml(getName(country))}</h3>
          </div>
          <dl>
            ${metricLine(t("capital"), getCapital(country))}
            ${metricLine(t("population"), compactNumber(country.population))}
            ${metricLine(t("continent"), getContinent(country))}
          </dl>
          <div class="card-actions">
            <button class="secondary-button" type="button" data-action="open" data-code="${escapeAttr(code)}">
              <i data-lucide="panel-top-open"></i>
              <span>${escapeHtml(t("details"))}</span>
            </button>
            <button class="icon-button favorite-toggle ${isFavorite ? "active" : ""}" type="button" data-action="favorite" data-code="${escapeAttr(code)}" aria-label="${escapeAttr(t("favorite"))}">
              <i data-lucide="heart"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function metricLine(label, value) {
    return `<div class="metric-line"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || t("unavailable"))}</dd></div>`;
  }

  function handleCountryGridClick(event) {
    const favorite = event.target.closest('[data-action="favorite"]');
    const open = event.target.closest('[data-action="open"], .favorite-chip');
    if (favorite) {
      toggleFavorite(favorite.dataset.code);
      return;
    }
    if (open?.dataset?.code) openCountry(open.dataset.code);
  }

  function toggleFavorite(code) {
    if (state.favorites.has(code)) {
      state.favorites.delete(code);
    } else {
      state.favorites.add(code);
    }
    saveSet(scopedKey("favorites"), state.favorites);
    renderFavorites();
    renderCountries();
    refreshDetailFavorite();
  }

  function renderFavorites() {
    const favorites = Array.from(state.favorites).map(getCountry).filter(Boolean);
    if (!favorites.length) {
      els.favoriteStrip.innerHTML = `<div class="favorite-empty">${escapeHtml(t("noFavorites"))}</div>`;
      return;
    }
    els.favoriteStrip.innerHTML = favorites
      .map(
        (country) => `
          <button class="favorite-chip" type="button" data-action="open" data-code="${escapeAttr(country.cca3)}">
            <img src="${escapeAttr(getFlag(country))}" alt="">
            <span><strong>${escapeHtml(getName(country))}</strong><span>${escapeHtml(getCapital(country))}</span></span>
          </button>
        `,
      )
      .join("");
  }

  function renderSuggestions() {
    const query = els.searchInput.value.trim().toLowerCase();
    if (!query) {
      els.suggestions.classList.remove("open");
      return;
    }
    const suggestions = state.countries.filter((country) => getSearchText(country).includes(query)).slice(0, 7);
    if (!suggestions.length) {
      els.suggestions.classList.remove("open");
      return;
    }
    els.suggestions.innerHTML = suggestions
      .map(
        (country) => `
          <button class="suggestion-item" type="button" data-code="${escapeAttr(country.cca3)}">
            <img src="${escapeAttr(getFlag(country))}" alt="">
            <span><strong>${escapeHtml(getName(country))}</strong><br><small>${escapeHtml(getCapital(country))}</small></span>
          </button>
        `,
      )
      .join("");
    els.suggestions.classList.add("open");
  }

  function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("Voice search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = { en: "en-US", hi: "hi-IN", ar: "ar-SA", ja: "ja-JP" }[state.language] || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    $("#voiceBtn").classList.add("active");
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      els.searchInput.value = transcript;
      state.search = transcript.trim();
      applyFilters();
      renderSuggestions();
    };
    recognition.onerror = () => setStatus("Voice search stopped.");
    recognition.onend = () => $("#voiceBtn").classList.remove("active");
    recognition.start();
  }

  function openCountry(code) {
    const country = getCountry(code);
    if (!country) return;
    state.currentCountry = country;
    markVisited(code);
    renderCountryDetail(country);
    setDetailTab("overview");
    els.countryModal.classList.add("open");
    els.countryModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    els.weatherPanel.innerHTML = loadingLine();
    els.newsPanel.innerHTML = loadingLine();
    ensureCountryDetails(code).then((detailedCountry) => {
      if (!detailedCountry || state.currentCountry?.cca3 !== code) return;
      state.currentCountry = detailedCountry;
      renderCountryDetail(detailedCountry);
      loadWeather(detailedCountry);
      loadNews(detailedCountry);
      loadDetailIndicators(detailedCountry);
      if ($('[data-detail-pane="map"]')?.classList.contains("active")) setupMap(detailedCountry);
    });
    refreshIcons();
  }

  function renderCountryDetail(country) {
    els.detailFlag.src = getFlag(country);
    els.detailFlag.alt = `${getName(country)} flag`;
    els.detailContinent.textContent = getContinent(country);
    els.detailTitle.textContent = getName(country);
    els.detailSubtitle.textContent = `${getOfficialName(country)} • ${getCapital(country)}`;
    els.detailGrid.innerHTML = [
      detailTile(t("capital"), getCapital(country)),
      detailTile(t("population"), formatNumber(country.population)),
      detailTile(t("currency"), getCurrencyText(country)),
      detailTile(t("languages"), getLanguages(country)),
      detailTile(t("timezones"), getTimezones(country)),
      detailTile(t("area"), formatArea(country.area)),
      detailTile(t("callingCode"), getCallingCode(country)),
      detailTile(t("domain"), getDomain(country)),
      detailTile(t("borders"), getBorders(country)),
      detailTile(t("nativeName"), getNativeName(country)),
    ].join("");
    els.factsList.innerHTML = makeFacts(country).map((fact) => `<li>${escapeHtml(fact)}</li>`).join("");
    refreshDetailFavorite();
  }

  function detailTile(label, value) {
    return `<div class="detail-tile"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || t("unavailable"))}</strong></div>`;
  }

  function refreshDetailFavorite() {
    if (!state.currentCountry) return;
    els.detailFavoriteBtn.classList.toggle("active", state.favorites.has(state.currentCountry.cca3));
  }

  function setDetailTab(tabName) {
    $$(".detail-tabs [data-detail-tab]").forEach((button) => button.classList.toggle("active", button.dataset.detailTab === tabName));
    $$("[data-detail-pane]").forEach((pane) => pane.classList.toggle("active", pane.dataset.detailPane === tabName));
    if (tabName === "map" && state.currentCountry) setupMap(state.currentCountry);
    if (tabName === "charts" && state.currentCountry) renderDetailCharts(state.currentCountry);
  }

  function closeCountryModal() {
    els.countryModal.classList.remove("open");
    els.countryModal.setAttribute("aria-hidden", "true");
    releaseBodyScroll();
  }

  function setupMap(country) {
    if (!window.L) {
      els.countryMap.innerHTML = `<div class="empty-state">${escapeHtml(t("apiError"))}</div>`;
      return;
    }
    const latlng = country.latlng || country.capitalInfo?.latlng;
    if (!latlng?.length) {
      els.countryMap.innerHTML = `<div class="empty-state">${escapeHtml(t("unavailable"))}</div>`;
      return;
    }
    if (state.map) {
      state.map.remove();
      state.map = null;
    }
    els.countryMap.innerHTML = "";
    state.map = L.map("countryMap", {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(latlng, getMapZoom(country));
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap",
    }).addTo(state.map);
    L.marker(latlng).addTo(state.map).bindPopup(getName(country)).openPopup();
    setTimeout(() => state.map?.invalidateSize(), 160);
  }

  async function loadWeather(country) {
    const key = localStorage.getItem(`${STORE}openWeatherKey`) || "";
    if (!key) {
      els.weatherPanel.innerHTML = apiPrompt(t("noApiKeyWeather"));
      return;
    }
    els.weatherPanel.innerHTML = loadingLine();
    try {
      const coords = country.capitalInfo?.latlng || country.latlng;
      const query = coords?.length
        ? `lat=${coords[0]}&lon=${coords[1]}`
        : `q=${encodeURIComponent(getCapital(country))},${encodeURIComponent(country.cca2 || "")}`;
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?${query}&units=metric&appid=${encodeURIComponent(key)}`);
      if (!response.ok) throw new Error("Weather request failed.");
      const data = await response.json();
      const weather = data.weather?.[0] || {};
      els.weatherPanel.innerHTML = `
        <div class="weather-main">
          ${weather.icon ? `<img src="https://openweathermap.org/img/wn/${escapeAttr(weather.icon)}@2x.png" alt="">` : ""}
          <div>
            <strong>${Math.round(data.main?.temp ?? 0)}°C</strong>
            <span>${escapeHtml(weather.description || t("unavailable"))}</span>
          </div>
        </div>
        <div class="weather-meta">
          <div><span>Humidity</span><strong>${escapeHtml(String(data.main?.humidity ?? "-"))}%</strong></div>
          <div><span>Wind</span><strong>${escapeHtml(String(data.wind?.speed ?? "-"))} m/s</strong></div>
        </div>
      `;
    } catch (error) {
      console.warn(error);
      els.weatherPanel.innerHTML = `<div class="empty-state">${escapeHtml(t("apiError"))}</div>`;
    }
  }

  async function loadNews(country) {
    const key = localStorage.getItem(`${STORE}newsApiKey`) || "";
    if (!key) {
      els.newsPanel.innerHTML = apiPrompt(t("noApiKeyNews"));
      return;
    }
    els.newsPanel.innerHTML = loadingLine();
    try {
      const query = encodeURIComponent(`"${getName(country)}"`);
      const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${encodeURIComponent(key)}`);
      if (!response.ok) throw new Error("News request failed.");
      const data = await response.json();
      const articles = (data.articles || []).filter((article) => article.title).slice(0, 5);
      if (!articles.length) {
        els.newsPanel.innerHTML = `<div class="empty-state">${escapeHtml(t("unavailable"))}</div>`;
        return;
      }
      els.newsPanel.innerHTML = articles
        .map(
          (article) => `
            <a class="news-card" href="${escapeAttr(article.url)}" target="_blank" rel="noreferrer">
              <div>
                <span class="eyebrow">${escapeHtml(article.source?.name || "NewsAPI")}</span>
                <h3>${escapeHtml(article.title)}</h3>
                <p>${escapeHtml(article.description || "")}</p>
              </div>
              ${article.urlToImage ? `<img src="${escapeAttr(article.urlToImage)}" alt="">` : ""}
            </a>
          `,
        )
        .join("");
    } catch (error) {
      console.warn(error);
      els.newsPanel.innerHTML = `<div class="empty-state">${escapeHtml(t("apiError"))}</div>`;
    }
  }

  function apiPrompt(message) {
    return `
      <div class="empty-state">
        <p>${escapeHtml(message)}</p>
        <button class="text-button" type="button" data-action="open-api">${escapeHtml(t("addKey"))}</button>
      </div>
    `;
  }

  function openApiFromInline(event) {
    if (event.target.closest('[data-action="open-api"]')) openApiModal();
  }

  async function loadDetailIndicators(country) {
    await getIndicators(country);
    const chartsPane = $('[data-detail-pane="charts"]');
    if (chartsPane?.classList.contains("active")) renderDetailCharts(country);
  }

  async function getIndicators(country) {
    if (!country?.cca3) return {};
    if (state.indicators[country.cca3]) return state.indicators[country.cca3];
    const [gdp, literacy] = await Promise.all([
      fetchWorldBankIndicator(country.cca3, "NY.GDP.MKTP.CD"),
      fetchWorldBankIndicator(country.cca3, "SE.ADT.LITR.ZS"),
    ]);
    state.indicators[country.cca3] = { gdp, literacy };
    return state.indicators[country.cca3];
  }

  async function fetchWorldBankIndicator(cca3, indicator) {
    try {
      const response = await fetch(`https://api.worldbank.org/v2/country/${encodeURIComponent(cca3)}/indicator/${indicator}?format=json&per_page=1&MRV=1`);
      if (!response.ok) throw new Error("World Bank request failed.");
      const data = await response.json();
      const row = data?.[1]?.find((item) => item.value !== null);
      return row ? { value: Number(row.value), year: row.date } : null;
    } catch (error) {
      console.warn(error);
      return null;
    }
  }

  async function renderDetailCharts(country) {
    if (!window.Chart) {
      $(".mini-chart-grid").innerHTML = `<div class="empty-state">${escapeHtml(t("apiError"))}</div>`;
      return;
    }
    const indicators = await getIndicators(country);
    const peers = state.countries
      .filter((item) => getContinent(item) === getContinent(country) && item.population)
      .sort((a, b) => Math.abs(a.population - country.population) - Math.abs(b.population - country.population))
      .slice(0, 6)
      .sort((a, b) => a.population - b.population);
    makeChart("populationChart", {
      type: "bar",
      data: {
        labels: peers.map((item) => getName(item)),
        datasets: [
          {
            label: t("population"),
            data: peers.map((item) => Math.round(item.population / 1000000)),
            backgroundColor: peers.map((item) => (item.cca3 === country.cca3 ? cssVar("--accent") : cssVar("--primary"))),
            borderRadius: 6,
          },
        ],
      },
      options: chartOptions("Population peers (millions)"),
    });
    makeChart("gdpChart", {
      type: "bar",
      data: {
        labels: [indicators.gdp?.year ? `${getName(country)} ${indicators.gdp.year}` : getName(country)],
        datasets: [
          {
            label: "GDP (USD billions)",
            data: [indicators.gdp?.value ? indicators.gdp.value / 1000000000 : 0],
            backgroundColor: [cssVar("--accent")],
            borderRadius: 6,
          },
        ],
      },
      options: chartOptions("GDP"),
    });
    const literacy = indicators.literacy?.value;
    makeChart("literacyChart", {
      type: "doughnut",
      data: {
        labels: ["Literacy", "Remaining"],
        datasets: [
          {
            data: [literacy || 0, literacy ? Math.max(0, 100 - literacy) : 100],
            backgroundColor: [cssVar("--primary"), "rgba(255,255,255,0.12)"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: cssVar("--muted") } },
          title: { display: true, text: literacy ? `Literacy ${Math.round(literacy)}%` : "Literacy unavailable", color: cssVar("--text") },
        },
      },
    });
  }

  function populateCompareSelects() {
    const options = state.countries.map((country) => `<option value="${escapeAttr(country.cca3)}">${escapeHtml(getName(country))}</option>`).join("");
    els.compareA.innerHTML = options;
    els.compareB.innerHTML = options;
    const preferredA = localStorage.getItem(`${STORE}compareA`) || (getCountry("USA") ? "USA" : state.countries[0]?.cca3);
    const preferredB = localStorage.getItem(`${STORE}compareB`) || (getCountry("IND") ? "IND" : state.countries[1]?.cca3);
    els.compareA.value = state.countryByCode.has(preferredA) ? preferredA : state.countries[0]?.cca3;
    els.compareB.value = state.countryByCode.has(preferredB) ? preferredB : state.countries[1]?.cca3 || state.countries[0]?.cca3;
    renderComparison();
  }

  async function renderComparison() {
    let countryA = getCountry(els.compareA.value);
    let countryB = getCountry(els.compareB.value);
    if (!countryA || !countryB) return;
    const token = ++state.compareToken;
    renderCompareCards(countryA, countryB, null, null);
    [countryA, countryB] = await Promise.all([ensureCountryDetails(countryA.cca3), ensureCountryDetails(countryB.cca3)]);
    if (token !== state.compareToken || !countryA || !countryB) return;
    const [indicatorsA, indicatorsB] = await Promise.all([getIndicators(countryA), getIndicators(countryB)]);
    if (token !== state.compareToken) return;
    renderCompareCards(countryA, countryB, indicatorsA, indicatorsB);
    renderCompareChart(countryA, countryB, indicatorsA, indicatorsB);
  }

  function renderCompareCards(countryA, countryB, indicatorsA, indicatorsB) {
    els.compareGrid.innerHTML = [countryA, countryB]
      .map((country, index) => {
        const indicators = index === 0 ? indicatorsA : indicatorsB;
        return `
          <article class="compare-card">
            <div class="compare-card-header">
              <img src="${escapeAttr(getFlag(country))}" alt="">
              <div>
                <h3>${escapeHtml(getName(country))}</h3>
                <span>${escapeHtml(getCapital(country))}</span>
              </div>
            </div>
            <div class="compare-list">
              ${metricLine(t("population"), formatNumber(country.population))}
              ${metricLine("GDP", indicators ? formatMoney(indicators.gdp?.value) : "Loading...")}
              ${metricLine(t("area"), formatArea(country.area))}
              ${metricLine(t("currency"), getCurrencyText(country))}
              ${metricLine(t("languages"), getLanguages(country))}
              ${metricLine(t("timezones"), getTimezones(country))}
              ${metricLine("Literacy", indicators ? formatPercent(indicators.literacy?.value) : "Loading...")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderCompareChart(countryA, countryB, indicatorsA, indicatorsB) {
    if (!window.Chart) return;
    const raw = {
      population: [countryA.population || 0, countryB.population || 0],
      area: [countryA.area || 0, countryB.area || 0],
      gdp: [indicatorsA.gdp?.value || 0, indicatorsB.gdp?.value || 0],
    };
    const normalize = (values) => {
      const max = Math.max(...values, 1);
      return values.map((value) => Math.round((value / max) * 100));
    };
    makeChart("compareChart", {
      type: "bar",
      data: {
        labels: [t("population"), t("area"), "GDP"],
        datasets: [
          {
            label: getName(countryA),
            data: [normalize(raw.population)[0], normalize(raw.area)[0], normalize(raw.gdp)[0]],
            backgroundColor: cssVar("--primary"),
            borderRadius: 6,
          },
          {
            label: getName(countryB),
            data: [normalize(raw.population)[1], normalize(raw.area)[1], normalize(raw.gdp)[1]],
            backgroundColor: cssVar("--accent"),
            borderRadius: 6,
          },
        ],
      },
      options: chartOptions("Relative comparison"),
    });
  }

  function newQuestion() {
    if (!state.countries.length) return;
    const pool =
      state.quiz.mode === "flag"
        ? state.countries.filter((country) => getFlag(country))
        : state.countries.filter((country) => getCapital(country) !== t("unavailable"));
    const country = randomItem(pool);
    const answer = state.quiz.mode === "flag" ? getName(country) : getCapital(country);
    const options = buildOptions(pool, answer);
    state.quiz.current = { country, answer, options };
    state.quiz.answered = false;
    els.quizStage.innerHTML =
      state.quiz.mode === "flag"
        ? `<img src="${escapeAttr(getFlag(country))}" alt="${escapeAttr(t("chooseAnswer"))}">`
        : `<h3>${escapeHtml(getName(country))}</h3>`;
    els.quizOptions.innerHTML = options.map((option) => `<button class="quiz-option" type="button">${escapeHtml(option)}</button>`).join("");
    updateQuizScore();
  }

  function buildOptions(pool, answer) {
    const values = new Set([answer]);
    while (values.size < 4 && values.size < pool.length) {
      const country = randomItem(pool);
      values.add(state.quiz.mode === "flag" ? getName(country) : getCapital(country));
    }
    return shuffle(Array.from(values));
  }

  function answerQuiz(event) {
    const button = event.target.closest(".quiz-option");
    if (!button || state.quiz.answered) return;
    state.quiz.answered = true;
    state.quiz.total += 1;
    const selected = button.textContent.trim();
    const correct = selected === state.quiz.current.answer;
    if (correct) state.quiz.score += 1;
    $$(".quiz-option", els.quizOptions).forEach((option) => {
      option.disabled = true;
      if (option.textContent.trim() === state.quiz.current.answer) option.classList.add("correct");
    });
    if (!correct) button.classList.add("wrong");
    saveQuiz();
    updateQuizScore();
    setStatus(correct ? t("quizCorrect") : t("quizWrong"));
  }

  function updateQuizScore() {
    els.quizScore.textContent = `${state.quiz.score} / ${state.quiz.total}`;
  }

  function renderVisited() {
    const visited = Array.from(state.visited).map(getCountry).filter(Boolean).slice(-12).reverse();
    if (!visited.length) {
      els.visitedList.innerHTML = `<div class="favorite-empty">${escapeHtml(t("noVisited"))}</div>`;
      return;
    }
    els.visitedList.innerHTML = visited
      .map(
        (country) => `
          <button class="visited-item" type="button" data-action="open" data-code="${escapeAttr(country.cca3)}">
            <img src="${escapeAttr(getFlag(country))}" alt="">
            <span>${escapeHtml(getName(country))}</span>
          </button>
        `,
      )
      .join("");
  }

  function markVisited(code) {
    state.visited.delete(code);
    state.visited.add(code);
    saveSet(scopedKey("visited"), state.visited);
    renderVisited();
  }

  function openAuthModal() {
    setAuthMode("login");
    els.authEmail.value = "";
    els.authPassword.value = "";
    els.authName.value = "";
    setNote(els.authNote, "");
    els.authModal.classList.add("open");
    els.authModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeAuthModal() {
    els.authModal.classList.remove("open");
    els.authModal.setAttribute("aria-hidden", "true");
    releaseBodyScroll();
  }

  function setAuthMode(mode) {
    state.authMode = mode;
    const dialog = $(".dialog-card", els.authModal);
    dialog.classList.toggle("auth-register", mode === "register");
    els.authName.closest("label").classList.toggle("hidden", mode !== "register");
    $$(".auth-tabs [data-auth-mode]").forEach((button) => button.classList.toggle("active", button.dataset.authMode === mode));
    els.authSubmit.textContent = mode === "register" ? t("register") : t("login");
  }

  function handleAuthButton() {
    if (state.currentUser) {
      state.currentUser = null;
      localStorage.removeItem(`${STORE}currentUser`);
      loadCollections();
      loadQuizState();
      updateAuthUi();
      renderAll();
    } else {
      openAuthModal();
    }
  }

  async function submitAuth(event) {
    event.preventDefault();
    const email = els.authEmail.value.trim().toLowerCase();
    const password = els.authPassword.value;
    const name = els.authName.value.trim() || email.split("@")[0];
    const users = readJson(`${STORE}users`, {});
    const passwordHash = await hashText(password);
    if (state.authMode === "register") {
      if (users[email]) {
        setNote(els.authNote, t("accountExists"), "error");
        return;
      }
      users[email] = { email, name, passwordHash };
      localStorage.setItem(`${STORE}users`, JSON.stringify(users));
      state.currentUser = { email, name };
      localStorage.setItem(`${STORE}currentUser`, JSON.stringify(state.currentUser));
      setNote(els.authNote, t("registered"), "success");
    } else {
      if (!users[email] || users[email].passwordHash !== passwordHash) {
        setNote(els.authNote, t("invalidLogin"), "error");
        return;
      }
      state.currentUser = { email, name: users[email].name };
      localStorage.setItem(`${STORE}currentUser`, JSON.stringify(state.currentUser));
      setNote(els.authNote, t("accountReady"), "success");
    }
    loadCollections();
    loadQuizState();
    updateAuthUi();
    renderAll();
    setTimeout(closeAuthModal, 450);
  }

  function updateAuthUi() {
    const label = state.currentUser ? state.currentUser.name || state.currentUser.email : t("login");
    els.authBtn.innerHTML = `<i data-lucide="${state.currentUser ? "log-out" : "user-round"}"></i><span>${escapeHtml(label)}</span>`;
    refreshIcons();
  }

  function openApiModal() {
    els.weatherKeyInput.value = localStorage.getItem(`${STORE}openWeatherKey`) || "";
    els.newsKeyInput.value = localStorage.getItem(`${STORE}newsApiKey`) || "";
    setNote(els.apiNote, t("keysStored"));
    els.apiModal.classList.add("open");
    els.apiModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeApiModal() {
    els.apiModal.classList.remove("open");
    els.apiModal.setAttribute("aria-hidden", "true");
    releaseBodyScroll();
  }

  function submitApiSettings(event) {
    event.preventDefault();
    localStorage.setItem(`${STORE}openWeatherKey`, els.weatherKeyInput.value.trim());
    localStorage.setItem(`${STORE}newsApiKey`, els.newsKeyInput.value.trim());
    setNote(els.apiNote, t("keysSaved"), "success");
    if (state.currentCountry) {
      loadWeather(state.currentCountry);
      loadNews(state.currentCountry);
    }
    setTimeout(closeApiModal, 450);
  }

  function setupInfiniteLoading() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && state.visibleCount < state.filtered.length) {
        state.visibleCount += PAGE_SIZE;
        renderCountries();
      }
    }, { rootMargin: "450px 0px" });
    observer.observe(els.loadSentinel);
  }

  function showSkeletons() {
    els.countryGrid.innerHTML = Array.from({ length: 12 }, () => `<article class="skeleton-card"><span></span><span></span><span></span></article>`).join("");
  }

  function hideLoading() {
    setTimeout(() => els.loadingScreen.classList.add("hide"), 320);
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
  }

  function applyLanguage() {
    const dictionary = i18n[state.language] || i18n.en;
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
    els.languageSelect.value = state.language;
    $$("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      if (dictionary[key]) node.textContent = dictionary[key];
    });
    $$("[data-i18n-placeholder]").forEach((node) => {
      const key = node.dataset.i18nPlaceholder;
      if (dictionary[key]) node.placeholder = dictionary[key];
    });
    $$("[data-continent]").forEach((node) => {
      const continent = node.dataset.continent;
      if (continent === "All") {
        node.textContent = t("filterAll");
      } else {
        node.textContent = continentLabels[state.language]?.[continent] || continent;
      }
    });
    updateAuthUi();
  }

  function updateResultCount() {
    const noun = state.filtered.length === 1 ? t("country") : t("countries");
    els.resultCount.textContent = `${formatNumber(state.filtered.length)} ${noun}`;
  }

  function setStatus(message) {
    els.dataStatus.textContent = message;
  }

  function setupGlobe() {
    if (!window.THREE) return;
    const canvas = $("#globeCanvas");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 6.2;

    const group = new THREE.Group();
    scene.add(group);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(2, 72, 72),
      new THREE.MeshStandardMaterial({
        color: 0x0f9b86,
        roughness: 0.72,
        metalness: 0.08,
        transparent: true,
        opacity: 0.86,
      }),
    );
    group.add(globe);

    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(2.015, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xf7c948,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      }),
    );
    group.add(wire);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.008, 8, 160),
      new THREE.MeshBasicMaterial({ color: 0xff6b4a, transparent: true, opacity: 0.72 }),
    );
    ring.rotation.x = Math.PI / 2.2;
    ring.rotation.y = Math.PI / 7;
    group.add(ring);

    scene.add(new THREE.AmbientLight(0xffffff, 0.56));
    const light = new THREE.PointLight(0xffffff, 1.4);
    light.position.set(3, 4, 5);
    scene.add(light);

    state.globe = { renderer, scene, camera, group, points: null };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
      group.position.x = rect.width > 820 ? 1.55 : 0;
      group.position.y = rect.width > 820 ? 0.15 : -0.75;
      group.scale.setScalar(rect.width > 820 ? 1 : 0.84);
    };
    resize();
    window.addEventListener("resize", resize);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = () => {
      if (!state.globe) return;
      group.rotation.y += prefersReduced ? 0.0005 : 0.0027;
      ring.rotation.z += prefersReduced ? 0.0004 : 0.0018;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  }

  function addCountryPointsToGlobe() {
    if (!state.globe || !window.THREE) return;
    if (state.globe.points) {
      state.globe.group.remove(state.globe.points);
      state.globe.points.geometry.dispose();
      state.globe.points.material.dispose();
    }
    const vertices = [];
    state.countries.forEach((country) => {
      if (!country.latlng?.length) return;
      const point = latLngToVector3(country.latlng[0], country.latlng[1], 2.045);
      vertices.push(point.x, point.y, point.z);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({
      color: 0xff6b4a,
      size: 0.035,
      transparent: true,
      opacity: 0.9,
    });
    state.globe.points = new THREE.Points(geometry, material);
    state.globe.group.add(state.globe.points);
  }

  function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return {
      x: -radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta),
    };
  }

  function makeChart(id, config) {
    const canvas = typeof id === "string" ? $(`#${id}`) : id;
    if (!canvas || !window.Chart) return;
    if (state.charts[id]) state.charts[id].destroy();
    state.charts[id] = new Chart(canvas, config);
  }

  function chartOptions(title) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: cssVar("--muted") } },
        title: { display: true, text: title, color: cssVar("--text") },
      },
      scales: {
        x: {
          ticks: { color: cssVar("--muted"), maxRotation: 0, autoSkip: true },
          grid: { color: "rgba(255,255,255,0.08)" },
        },
        y: {
          ticks: { color: cssVar("--muted") },
          grid: { color: "rgba(255,255,255,0.08)" },
        },
      },
    };
  }

  function rerenderCharts() {
    Object.values(state.charts).forEach((chart) => chart.destroy());
    state.charts = {};
    if (state.currentCountry && $('[data-detail-pane="charts"]').classList.contains("active")) {
      renderDetailCharts(state.currentCountry);
    }
    renderComparison();
  }

  function makeFacts(country) {
    const density = country.area ? Math.round((country.population || 0) / country.area) : null;
    const facts = [];
    facts.push(`${getName(country)} is in ${getContinent(country)}${country.subregion ? `, within ${country.subregion}` : ""}.`);
    if (density) facts.push(`Population density is about ${formatNumber(density)} people per km².`);
    facts.push(country.landlocked ? "It is landlocked." : "It has access to a coastline or maritime territory.");
    facts.push(country.borders?.length ? `It borders ${country.borders.length} countries.` : "It has no land borders.");
    if (country.unMember) facts.push("It is a United Nations member state.");
    facts.push(`The week commonly starts on ${country.startOfWeek || "Monday"}.`);
    return facts;
  }

  function makeSampleCountry(cca3, cca2, common, official, capital, continent, population, currencyCode, currencyName, currencySymbol, languages, area, timezones, latlng, capitalLatLng, tld, callingCode, borders) {
    return {
      cca3,
      cca2,
      name: {
        common,
        official,
        nativeName: { default: { official, common } },
      },
      flags: {
        svg: `https://flagcdn.com/${cca2.toLowerCase()}.svg`,
        png: `https://flagcdn.com/w320/${cca2.toLowerCase()}.png`,
      },
      capital: [capital],
      capitalInfo: { latlng: capitalLatLng },
      region: continent === "North America" || continent === "South America" ? "Americas" : continent,
      subregion: continent,
      continents: [continent],
      population,
      currencies: { [currencyCode]: { name: currencyName, symbol: currencySymbol } },
      languages: Object.fromEntries(languages.map((language, index) => [`lang${index}`, language])),
      timezones,
      area,
      idd: { root: callingCode, suffixes: [""] },
      tld,
      borders,
      latlng,
      landlocked: false,
      unMember: true,
      maps: { googleMaps: `https://www.google.com/maps/search/${encodeURIComponent(common)}` },
      startOfWeek: "Monday",
      __detailsLoaded: true,
    };
  }

  function getCountry(code) {
    return state.countryByCode.get(code);
  }

  function getName(country) {
    return country?.name?.common || t("unavailable");
  }

  function getOfficialName(country) {
    return country?.name?.official || getName(country);
  }

  function getFlag(country) {
    return country?.flags?.svg || country?.flags?.png || "";
  }

  function getCapital(country) {
    return country?.capital?.[0] || t("unavailable");
  }

  function getContinent(country) {
    return country?.continents?.[0] || country?.region || t("unavailable");
  }

  function getCurrencyText(country) {
    const currencies = Object.values(country?.currencies || {});
    return currencies.map((currency) => `${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}`).join(", ") || t("unavailable");
  }

  function getLanguages(country) {
    return Object.values(country?.languages || {}).join(", ") || t("unavailable");
  }

  function getTimezones(country) {
    const zones = country?.timezones || [];
    return zones.length > 3 ? `${zones.slice(0, 3).join(", ")} +${zones.length - 3}` : zones.join(", ") || t("unavailable");
  }

  function getCallingCode(country) {
    const root = country?.idd?.root || "";
    const suffix = country?.idd?.suffixes?.[0] || "";
    if (!root && !suffix) return t("unavailable");
    return `${root}${suffix}`;
  }

  function getDomain(country) {
    return country?.tld?.join(", ") || t("unavailable");
  }

  function getBorders(country) {
    if (!country?.borders?.length) return t("noBorders");
    return country.borders.map((code) => getCountry(code)?.name?.common || code).join(", ");
  }

  function getNativeName(country) {
    const native = Object.values(country?.name?.nativeName || {})[0];
    return native?.common || native?.official || getName(country);
  }

  function getSearchText(country) {
    const languages = Object.values(country?.languages || {}).join(" ");
    const currencies = Object.values(country?.currencies || {})
      .map((currency) => `${currency.name || ""} ${currency.symbol || ""}`)
      .join(" ");
    return [
      getName(country),
      getOfficialName(country),
      getCapital(country),
      getContinent(country),
      languages,
      currencies,
      country.cca2,
      country.cca3,
    ]
      .join(" ")
      .toLowerCase();
  }

  function getMapZoom(country) {
    if ((country.area || 0) > 7000000) return 3;
    if ((country.area || 0) > 1000000) return 4;
    if ((country.area || 0) > 150000) return 5;
    return 6;
  }

  function formatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return t("unavailable");
    return new Intl.NumberFormat(state.language === "en" ? "en-US" : state.language).format(Math.round(Number(value)));
  }

  function compactNumber(value) {
    if (value === null || value === undefined) return t("unavailable");
    return new Intl.NumberFormat(state.language === "en" ? "en-US" : state.language, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }

  function formatMoney(value) {
    if (!value) return t("unavailable");
    if (value >= 1000000000000) return `$${(value / 1000000000000).toFixed(2)}T`;
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    return `$${formatNumber(value)}`;
  }

  function formatArea(value) {
    return value ? `${formatNumber(value)} km²` : t("unavailable");
  }

  function formatPercent(value) {
    return value ? `${value.toFixed(1)}%` : t("unavailable");
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(items) {
    return items
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.value);
  }

  function loadingLine() {
    return `<div class="empty-state">${escapeHtml(t("loading"))}</div>`;
  }

  function t(key) {
    return i18n[state.language]?.[key] || i18n.en[key] || key;
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function scopedKey(name) {
    return `${STORE}${name}:${state.currentUser?.email || "guest"}`;
  }

  function loadCollections() {
    state.favorites = readSet(scopedKey("favorites"));
    state.visited = readSet(scopedKey("visited"));
  }

  function readSet(key) {
    return new Set(readJson(key, []));
  }

  function saveSet(key, set) {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  }

  function saveQuiz() {
    localStorage.setItem(scopedKey("quiz"), JSON.stringify({ score: state.quiz.score, total: state.quiz.total }));
  }

  function loadQuizState() {
    const saved = readJson(scopedKey("quiz"), { score: 0, total: 0 });
    state.quiz.score = saved.score || 0;
    state.quiz.total = saved.total || 0;
  }

  async function hashText(text) {
    if (window.crypto?.subtle) {
      const bytes = new TextEncoder().encode(text);
      const buffer = await window.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    }
    return btoa(unescape(encodeURIComponent(text)));
  }

  function setNote(element, message, type = "") {
    element.textContent = message;
    element.classList.toggle("error", type === "error");
    element.classList.toggle("success", type === "success");
  }

  function releaseBodyScroll() {
    const modalOpen = $$(".modal.open").length > 0;
    document.body.classList.toggle("no-scroll", modalOpen);
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }
})();
