import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { aiAPI } from '../services/api';

const copy = {
  en: {
    examples: ['luxury family SUV under 700k', 'sporty black BMW automatic', 'comfortable daily Mercedes', 'cheap fuel efficient Toyota'],
    defaultQuery: 'luxury family SUV under 700k',
    eyebrow: 'AI Car Advisor',
    title: 'Find the car that fits your life, not just your filters.',
    subtitle: 'Describe what you want and get grounded recommendations from the vehicles currently available in the marketplace.',
    describe: 'Describe your ideal vehicle',
    placeholder: 'Example: comfortable daily Mercedes with low mileage',
    budget: 'Optional max budget (DH)',
    thinking: 'Thinking...',
    ask: 'Ask AI Advisor',
    visualTitle: 'Visual Search',
    visualText: 'Upload a reference car photo and the AI will infer visual taste signals.',
    visualButton: 'Search by Image',
    chooseFile: 'Choose image',
    noFile: 'No image selected',
    analyzing: 'Analyzing...',
    forYou: 'For You',
    forYouText: 'Personalized recommendations improve as users view, favorite, search, and compare.',
    trainProfile: 'Start viewing and saving cars to train your recommendation profile.',
    loginForYou: 'Log in to unlock personalized AI recommendations.',
    grounded: 'Inventory-grounded answer',
    inventoryReviewed: 'Recommendations are based on real vehicles currently available in the marketplace',
    showingFor: 'Showing matches for',
    yesFound: 'Here are the available marketplace matches:',
    currentNoMatch: 'Currently, no available vehicles in the current marketplace inventory match this request.',
    noMatch: 'No available cars in the current marketplace inventory match this request.',
    ranked: 'AI-ranked inventory',
    matches: 'intelligent matches',
    query: 'Query',
    compare: 'Compare',
    comparing: 'Comparing...',
    selected: 'Selected',
    viewDetails: 'View Details',
    tasteMatch: 'AI taste match',
    compareAssistant: 'AI Compare Assistant',
    summary: 'Recommendation Summary',
    daily: 'Daily',
    performance: 'Performance',
    value: 'Value',
    unavailable: 'The AI advisor is not available yet. Please try again in a moment.',
    visualUnavailable: 'Visual AI search could not process this image.',
    compareUnavailable: 'AI comparison is unavailable.',
  },
  fr: {
    examples: ['SUV familial premium sous 700k', 'BMW noire sportive automatique', 'Mercedes confortable au quotidien', 'Toyota économique en carburant'],
    defaultQuery: 'SUV familial premium sous 700k',
    eyebrow: 'Conseiller auto IA',
    title: 'Trouvez la voiture adaptée à votre vie, pas seulement à vos filtres.',
    subtitle: 'Décrivez ce que vous recherchez et recevez des recommandations basées sur les véhicules actuellement disponibles.',
    describe: 'Décrivez votre véhicule idéal',
    placeholder: 'Exemple : Mercedes confortable avec faible kilométrage',
    budget: 'Budget maximum optionnel (DH)',
    thinking: 'Analyse...',
    ask: 'Demander à l’IA',
    visualTitle: 'Recherche Visuelle',
    visualText: 'Importez une photo de référence et l’IA déduira les signaux visuels.',
    visualButton: 'Rechercher par image',
    chooseFile: 'Choisir une image',
    noFile: 'Aucune image sélectionnée',
    analyzing: 'Analyse...',
    forYou: 'Pour Vous',
    forYouText: 'Les recommandations s’améliorent avec vos vues, favoris, recherches et comparaisons.',
    trainProfile: 'Consultez et enregistrez des voitures pour entraîner votre profil.',
    loginForYou: 'Connectez-vous pour débloquer les recommandations personnalisées.',
    grounded: 'Réponse basée sur l’inventaire',
    inventoryReviewed: 'Les recommandations sont basées sur les véhicules réels actuellement disponibles sur le marché',
    showingFor: 'Suggestions pour',
    yesFound: 'Voici les véhicules disponibles dans le marketplace :',
    currentNoMatch: 'Actuellement, aucun véhicule disponible dans l’inventaire ne correspond à cette demande.',
    noMatch: 'Aucune voiture disponible dans l’inventaire actuel ne correspond à cette demande.',
    ranked: 'Inventaire classé par IA',
    matches: 'résultats intelligents',
    query: 'Requête',
    compare: 'Comparer',
    comparing: 'Comparaison...',
    selected: 'Sélectionné',
    viewDetails: 'Voir détails',
    tasteMatch: 'compatibilité IA',
    compareAssistant: 'Assistant comparatif IA',
    summary: 'Résumé de recommandation',
    daily: 'Quotidien',
    performance: 'Performance',
    value: 'Valeur',
    unavailable: 'Le conseiller IA n’est pas encore disponible. Veuillez réessayer dans un instant.',
    visualUnavailable: 'La recherche visuelle IA n’a pas pu traiter cette image.',
    compareUnavailable: 'La comparaison IA est indisponible.',
  },
  ar: {
    examples: ['سيارة رياضية سريعة', 'BMW سوداء رياضية أوتوماتيك', 'مرسيدس مريحة للاستخدام اليومي', 'تويوتا اقتصادية في الوقود'],
    defaultQuery: 'سيارة رياضية سريعة',
    eyebrow: 'مستشار السيارات بالذكاء الاصطناعي',
    title: 'اعثر على السيارة المناسبة لأسلوب حياتك، وليس لفلاترك فقط.',
    subtitle: 'صف ما تبحث عنه واحصل على توصيات مبنية على السيارات المتاحة حالياً في السوق.',
    describe: 'صف سيارتك المثالية',
    placeholder: 'مثال: مرسيدس مريحة يومياً وبمسافة قليلة',
    budget: 'الميزانية القصوى اختيارية (درهم)',
    thinking: 'جاري التحليل...',
    ask: 'اسأل المستشار الذكي',
    visualTitle: 'البحث بالصورة',
    visualText: 'ارفع صورة سيارة مرجعية وسيستنتج الذكاء الاصطناعي نمط السيارة المناسب.',
    visualButton: 'البحث بالصورة',
    chooseFile: 'اختر صورة',
    noFile: 'لم يتم اختيار صورة',
    analyzing: 'جاري التحليل...',
    forYou: 'مقترحة لك',
    forYouText: 'تتحسن التوصيات كلما شاهدت السيارات أو حفظتها أو قارنتها.',
    trainProfile: 'ابدأ بتصفح وحفظ السيارات لتدريب ملف التوصيات الخاص بك.',
    loginForYou: 'سجل الدخول لفتح التوصيات الشخصية.',
    grounded: 'إجابة مبنية على المخزون',
    inventoryReviewed: 'تستند التوصيات إلى سيارات حقيقية متاحة حالياً في السوق',
    showingFor: 'عرض النتائج لـ',
    yesFound: 'هذه هي الخيارات المتاحة في السوق:',
    currentNoMatch: 'حالياً لا توجد سيارات متاحة في المخزون الحالي تطابق هذا الطلب.',
    noMatch: 'لا توجد سيارات متاحة في المخزون الحالي تطابق هذا الطلب.',
    ranked: 'المخزون المرتب بالذكاء الاصطناعي',
    matches: 'نتائج ذكية',
    query: 'الطلب',
    compare: 'قارن',
    comparing: 'جاري المقارنة...',
    selected: 'محدد',
    viewDetails: 'عرض التفاصيل',
    tasteMatch: 'تطابق ذكي',
    compareAssistant: 'مساعد المقارنة الذكي',
    summary: 'ملخص التوصية',
    daily: 'الاستخدام اليومي',
    performance: 'الأداء',
    value: 'القيمة',
    unavailable: 'المستشار الذكي غير متاح حالياً. يرجى المحاولة بعد قليل.',
    visualUnavailable: 'تعذر تحليل الصورة بواسطة البحث الذكي.',
    compareUnavailable: 'المقارنة الذكية غير متاحة حالياً.',
  },
};

const getAdvisorCopy = (language) => {
  const key = language?.startsWith('ar') ? 'ar' : language?.startsWith('fr') ? 'fr' : 'en';
  return copy[key];
};

const getMatchLabel = (language) => {
  if (language?.startsWith('ar')) return 'مطابقة';
  if (language?.startsWith('fr')) return 'compatibilite';
  return 'Match';
};

const detectQueryLanguage = (query, fallbackLanguage = 'en') => {
  const raw = String(query || '');
  if (/[\u0600-\u06FF]/.test(raw)) return 'ar';

  const textValue = ` ${raw.toLowerCase()} `;
  const frenchMarkers = [
    ' je ', ' cherche ', ' recherche ', ' veux ', ' voudrais ', ' voiture ', ' voitures ',
    ' vehicule ', ' vehicules ', ' véhicule ', ' véhicules ', ' noire ', ' noir ',
    ' blanche ', ' blanc ', ' rouge ', ' automatique ', ' manuelle ', ' sportif ',
    ' sportive ', ' familial ', ' familiale ', ' confortable ', ' economique ',
    ' économique ', ' carburant ', ' sous ', ' moins de ', ' disponible ', ' essence ',
    ' electrique ', ' électrique ', ' hybride ', ' citadine ', ' berline ',
  ];
  const englishMarkers = [
    ' looking ', ' want ', ' need ', ' car ', ' cars ', ' vehicle ', ' vehicles ',
    ' black ', ' white ', ' red ', ' automatic ', ' manual ', ' sporty ', ' family ',
    ' comfortable ', ' cheap ', ' efficient ', ' under ', ' below ', ' recommend ',
    ' available ', ' fuel ', ' daily ',
  ];
  const frenchScore = frenchMarkers.reduce((score, marker) => score + (textValue.includes(marker) ? 1 : 0), /[àâçéèêëîïôùûüÿœ]/.test(textValue) ? 2 : 0);
  const englishScore = englishMarkers.reduce((score, marker) => score + (textValue.includes(marker) ? 1 : 0), 0);

  if (frenchScore > englishScore) return 'fr';
  if (englishScore > frenchScore) return 'en';
  if (fallbackLanguage?.startsWith('ar')) return 'ar';
  if (fallbackLanguage?.startsWith('fr')) return 'fr';
  return 'en';
};

const languageKey = (language) => (language?.startsWith('ar') ? 'ar' : language?.startsWith('fr') ? 'fr' : 'en');

const localizedAttribute = (value, type, language) => {
  const lang = languageKey(language);
  const raw = String(value || '').trim();
  if (!raw) return '';
  const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ').trim();
  const dictionaries = {
    transmission: {
      automatic: { fr: 'automatique', ar: 'أوتوماتيك' },
      auto: { fr: 'automatique', ar: 'أوتوماتيك' },
      manual: { fr: 'manuelle', ar: 'يدوي' },
      cvt: { fr: 'CVT', ar: 'CVT' },
    },
    category: {
      suv: { fr: 'SUV', ar: 'SUV' },
      crossover: { fr: 'crossover', ar: 'كروس أوفر' },
      sedan: { fr: 'berline', ar: 'سيدان' },
      saloon: { fr: 'berline', ar: 'سيدان' },
      coupe: { fr: 'coupe', ar: 'كوبيه' },
      hatchback: { fr: 'citadine compacte', ar: 'هاتشباك' },
      truck: { fr: 'pickup', ar: 'بيك أب' },
      pickup: { fr: 'pickup', ar: 'بيك أب' },
      wagon: { fr: 'break', ar: 'واجون' },
      convertible: { fr: 'cabriolet', ar: 'مكشوفة' },
      sports: { fr: 'sportive', ar: 'رياضية' },
    },
    fuel: {
      petrol: { fr: 'essence', ar: 'بنزين' },
      gasoline: { fr: 'essence', ar: 'بنزين' },
      gas: { fr: 'essence', ar: 'بنزين' },
      diesel: { fr: 'diesel', ar: 'ديزل' },
      hybrid: { fr: 'hybride', ar: 'هجين' },
      electric: { fr: 'electrique', ar: 'كهربائي' },
      ev: { fr: 'electrique', ar: 'كهربائي' },
    },
    color: {
      black: { fr: 'noir', ar: 'أسود' },
      white: { fr: 'blanc', ar: 'أبيض' },
      red: { fr: 'rouge', ar: 'أحمر' },
      blue: { fr: 'bleu', ar: 'أزرق' },
      silver: { fr: 'argent', ar: 'فضي' },
      gray: { fr: 'gris', ar: 'رمادي' },
      grey: { fr: 'gris', ar: 'رمادي' },
      green: { fr: 'vert', ar: 'أخضر' },
      yellow: { fr: 'jaune', ar: 'أصفر' },
      orange: { fr: 'orange', ar: 'برتقالي' },
      brown: { fr: 'marron', ar: 'بني' },
      beige: { fr: 'beige', ar: 'بيج' },
      gold: { fr: 'dore', ar: 'ذهبي' },
    },
  };
  return dictionaries[type]?.[normalized]?.[lang] || raw;
};

const localizeReason = (reason, language) => {
  const lang = languageKey(language);
  if (lang === 'en') return reason;
  const value = String(reason || '').trim();
  const normalized = value.toLowerCase();
  if (!value) return '';

  if (lang === 'ar') {
    if (normalized.includes('brand match')) return 'تطابق مع العلامة المطلوبة';
    if (normalized.includes('german brand')) return 'تطابق مع علامة ألمانية مطلوبة';
    if (normalized.includes('body type')) return 'تطابق مع نوع الهيكل المطلوب';
    if (normalized.includes('luxury')) return 'طابع فاخر قريب من طلبك';
    if (normalized.includes('family')) return 'مناسب للاستخدام العائلي';
    if (normalized.includes('budget')) return 'قريب من الميزانية المطلوبة';
    if (normalized.includes('automatic')) return 'يتطابق مع ناقل الحركة الأوتوماتيكي المطلوب';
    if (normalized.includes('color')) return 'اللون المطلوب غير متوفر بالكامل';
    if (normalized.includes('semantic') || normalized.includes('criteria')) return 'يطابق معايير بحثك حسب المخزون الحالي';
    return 'توصية مناسبة حسب طلبك والمخزون الحالي';
  }

  if (normalized.includes('brand match')) return 'Correspond a la marque demandee';
  if (normalized.includes('german brand')) return 'Correspond a une marque allemande demandee';
  if (normalized.includes('body type')) return 'Correspond au type de carrosserie demande';
  if (normalized.includes('luxury')) return 'Positionnement premium proche de votre demande';
  if (normalized.includes('family')) return 'Adapte a un usage familial';
  if (normalized.includes('budget')) return 'Proche du budget demande';
  if (normalized.includes('automatic')) return 'Correspond a la transmission automatique demandee';
  if (normalized.includes('color')) return 'La couleur demandee n est pas entierement disponible';
  if (normalized.includes('semantic') || normalized.includes('criteria')) return 'Correspond a vos criteres selon l inventaire actuel';
  return 'Recommandation adaptee a votre demande et a l inventaire actuel';
};

const localizePersonalityTag = (tag, language) => {
  const lang = languageKey(language);
  if (lang === 'en') return tag;
  const normalized = String(tag || '').toLowerCase();
  if (lang === 'ar') {
    if (normalized.includes('strong')) return 'مطابقة قوية';
    if (normalized.includes('budget')) return 'خيار فوق الميزانية';
    if (normalized.includes('luxury')) return 'بديل فاخر قريب';
    if (normalized.includes('alternative') || normalized.includes('premium')) return 'بديل مناسب';
    return 'مطابقة مناسبة';
  }
  if (normalized.includes('strong')) return 'Forte compatibilite';
  if (normalized.includes('budget')) return 'Option au-dessus du budget';
  if (normalized.includes('luxury')) return 'Alternative premium proche';
  if (normalized.includes('alternative') || normalized.includes('premium')) return 'Alternative pertinente';
  return 'Correspondance adaptee';
};

const localizedInventorySentence = (results, language) => {
  const lang = languageKey(language);
  const items = results?.results || results?.recommendations || [];
  if (!items.length) {
    if (lang === 'ar') return 'لا توجد حاليا مركبات مطابقة لطلبك في المخزون المتاح.';
    if (lang === 'fr') return 'Actuellement, aucun vehicule correspondant a votre demande n est disponible dans l inventaire.';
    return 'Currently, no available vehicles in the current marketplace inventory match this request.';
  }

  const first = items[0]?.car || {};
  const brand = first.brand || '';
  const category = localizedAttribute(first.category, 'category', language);
  const transmission = localizedAttribute(first.transmission, 'transmission', language);
  const fuel = localizedAttribute(first.fuel_type, 'fuel', language);
  const details = [brand, category, transmission, fuel].filter(Boolean);

  if (lang === 'ar') {
    return `بناء على تفضيلاتك، هذه هي أنسب المركبات المتاحة حاليا. تم اختيارها لأنها تطابق ${details.join(' و ')} حسب المخزون الحالي.`;
  }
  if (lang === 'fr') {
    return `Selon vos preferences, voici les vehicules les plus adaptes actuellement disponibles. Ils ont ete selectionnes car ils correspondent a ${details.join(', ')} selon l inventaire actuel.`;
  }
  return results?.inventory_answer || `Based on your preferences, these are the closest ${details.join(' ')} vehicles currently available.`;
};

const normalizeLocalizedResults = (data, language) => {
  if (!data) return data;
  const localizeItem = (item) => ({
    ...item,
    personality_tag: localizePersonalityTag(item.personality_tag, language),
    match_reason: localizeReason(item.match_reason, language),
    reasons: (item.reasons || [item.match_reason]).filter(Boolean).map((reason) => localizeReason(reason, language)),
  });
  const results = (data.results || data.recommendations || []).map(localizeItem);
  return {
    ...data,
    response_language: languageKey(language),
    inventory_answer: localizedInventorySentence({ ...data, results }, language),
    results,
    recommendations: results,
  };
};

const localizeInventoryAnswer = (results, text) => {
  if (!results) return '';
  if (results.inventory_answer) return results.inventory_answer;
  const items = results.results || results.recommendations || [];
  if (!items.length) return text.currentNoMatch;
  const names = items
    .slice(0, 5)
    .map((item) => `${item.car?.brand || ''} ${item.car?.model || ''}`.trim())
    .filter(Boolean);
  return `${text.yesFound} ${names.join('؛ ')}.`;
};

const resolveImage = (car) => {
  const src = car?.image_url || car?.main_image || car?.image;
  if (!src) return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&h=600&fit=crop';
  return String(src).startsWith('/') || String(src).startsWith('http') ? src : `/${src}`;
};

const fallbackVehicleLabel = (type, language) => {
  const lang = language?.startsWith('ar') ? 'ar' : language?.startsWith('fr') ? 'fr' : 'en';
  const labels = {
    category: { en: 'Premium', fr: 'Premium', ar: 'فئة مميزة' },
    transmission: { en: 'Auto', fr: 'Auto', ar: 'أوتوماتيك' },
    color: { en: 'Color unavailable', fr: 'Couleur indisponible', ar: 'اللون غير متاح' },
  };
  return labels[type]?.[lang] || labels[type]?.en || '';
};

const displayCarColor = (color, language) => {
  const value = localizedAttribute(color, 'color', language).replace(/\s+/g, ' ');
  return value || fallbackVehicleLabel('color', language);
};

const formatPrice = (price) => `${Number(price || 0).toLocaleString()} DH`;

const Recommendation = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith('ar');
  const text = getAdvisorCopy(i18n.language);
  const [query, setQuery] = useState(text.defaultQuery);
  const [maxPrice, setMaxPrice] = useState('');
  const [results, setResults] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [compareResult, setCompareResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [error, setError] = useState('');

  const hasToken = useMemo(() => Boolean(localStorage.getItem('token')), []);
  const resultItems = results?.results || results?.recommendations || [];
  const resultLanguage = results?.response_language || detectQueryLanguage(results?.query || results?.description || query, i18n.language);
  const resultText = getAdvisorCopy(resultLanguage);
  const matchLabel = getMatchLabel(resultLanguage);
  const inventoryAnswer = localizeInventoryAnswer(results, resultText);

  useEffect(() => {
    const allDefaults = Object.values(copy).map((item) => item.defaultQuery);
    if (!query || allDefaults.includes(query)) {
      setQuery(text.defaultQuery);
    }
  }, [i18n.language]);



  const runSearch = async (event) => {
    event?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setCompareResult(null);
    const detectedLanguage = detectQueryLanguage(query, i18n.language);

    try {
      const response = await aiAPI.search({
        query,
        max_price: maxPrice || null,
        limit: 12,
        response_language: detectedLanguage,
      });
      setResults(normalizeLocalizedResults(response.data, detectedLanguage));
      setCompareIds([]);
    } catch (err) {
      setError(err.response?.data?.message || text.unavailable);
    } finally {
      setLoading(false);
    }
  };



  const toggleCompare = (carId) => {
    setCompareIds((current) => {
      if (current.includes(carId)) {
        return current.filter((id) => id !== carId);
      }
      if (current.length >= 4) {
        return current;
      }
      return [...current, carId];
    });
  };

  const runCompare = async () => {
    if (compareIds.length < 2) return;

    setCompareLoading(true);
    setError('');

    try {
      const response = await aiAPI.compare(compareIds);
      setCompareResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || text.compareUnavailable);
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#070B12] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(220,38,38,0.22),transparent_34%),radial-gradient(ellipse_at_78%_20%,rgba(15,23,42,0.92),transparent_50%),linear-gradient(135deg,#050914_0%,#0b1220_52%,#050914_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#070B12] to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]"
          >
            <div className={`${isRtl ? 'text-right lg:order-2' : 'text-left'} max-w-3xl ${isRtl ? 'lg:mr-auto' : ''}`}>
              <div className={`mb-5 inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.28em] text-red-300 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="h-px w-10 bg-red-500/70" />
                {text.eyebrow}
              </div>
              <h1 className={`max-w-3xl font-black leading-[1.04] tracking-tight ${isRtl ? 'text-4xl sm:text-5xl lg:text-[4.6rem]' : 'text-4xl sm:text-5xl lg:text-6xl'}`}>
                {text.title}
              </h1>
              <p className={`mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg ${isRtl ? 'lg:mr-0' : ''}`}>
                {text.subtitle}
              </p>
            </div>

            <form onSubmit={runSearch} className={`${isRtl ? 'lg:order-1' : ''} rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-5`}>
              <label className={`mb-3 block text-xs font-black uppercase tracking-[0.18em] text-slate-400 ${isRtl ? 'text-right' : 'text-left'}`}>{text.describe}</label>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                dir="auto"
                className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/60"
                placeholder={text.placeholder}
              />
              <div className={`mt-4 grid gap-3 sm:grid-cols-[1fr_auto] ${isRtl ? 'sm:[direction:ltr]' : ''}`}>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className={`rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/60 ${isRtl ? 'text-right sm:[direction:rtl]' : ''}`}
                  placeholder={text.budget}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-500 disabled:opacity-60 ${isRtl ? 'sm:[direction:rtl]' : ''}`}
                >
                  {loading ? text.thinking : text.ask}
                  <span aria-hidden>{isRtl ? '←' : '→'}</span>
                </button>
              </div>
              <div className={`mt-4 flex flex-wrap gap-2 ${isRtl ? 'justify-end' : ''}`}>
                {text.examples.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-red-400/60 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </form>
          </Motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">


        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
            {error}
          </div>
        )}

        {results && (
          <section className={`rounded-3xl border border-white/10 bg-white/[0.045] p-5 sm:p-6 ${isRtl ? 'text-right' : ''}`}>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-300">{resultText.grounded}</p>
            <p className="mt-3 text-lg font-semibold leading-relaxed text-slate-100">{inventoryAnswer}</p>
            <p className="mt-3 text-sm text-slate-500">
              {resultText.inventoryReviewed}.
            </p>
          </section>
        )}

        {results && resultItems.length === 0 && !error && (
          <section className={`rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-slate-300 ${isRtl ? 'text-right' : ''}`}>
            {resultText.noMatch}
          </section>
        )}

        {resultItems.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div className={isRtl ? 'text-right' : ''}>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-red-300">{resultText.ranked}</p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">{resultItems.length} {resultText.matches}</h2>
                <p className="mt-1 text-sm text-slate-400">{resultText.showingFor}: "{results.query || results.description}"</p>
              </div>
              <button
                type="button"
                onClick={runCompare}
                disabled={compareIds.length < 2 || compareLoading}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-red-50 disabled:opacity-50"
              >
                {compareLoading ? resultText.comparing : `${resultText.compare} ${compareIds.length || ''}`}
              </button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {resultItems.map((item, index) => (
                <Motion.article
                  key={item.car.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: index * 0.03 }}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/15"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img src={resolveImage(item.car)} alt={`${item.car.brand} ${item.car.model}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-transparent to-black/20" />
                    <div className={`${isRtl ? 'right-4' : 'left-4'} absolute top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-black shadow-lg shadow-red-600/25`}>
                      {item.ai_match_percentage || item.score}% {matchLabel}
                    </div>
                    <div className={`${isRtl ? 'left-4' : 'right-4'} absolute top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-bold backdrop-blur`}>
                      {item.personality_tag}
                    </div>
                  </div>
                  <div className={`p-5 ${isRtl ? 'text-right' : ''}`}>
                    <div className={`flex items-start justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div>
                        <h3 className="text-lg font-black">{item.car.brand} {item.car.model}</h3>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mt-1">
                          {item.car.year} - {localizedAttribute(item.car.category, 'category', resultLanguage) || fallbackVehicleLabel('category', resultLanguage)} - {localizedAttribute(item.car.transmission, 'transmission', resultLanguage) || fallbackVehicleLabel('transmission', resultLanguage)} - {displayCarColor(item.car.color, resultLanguage)}
                        </p>
                      </div>
                      <p className="text-right text-sm font-black text-red-200">{formatPrice(item.car.price)}</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {(item.reasons || [item.match_reason]).slice(0, 4).map((reason) => (
                        <div key={reason} className={`flex gap-2 text-sm text-slate-300 ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCompare(item.car.id)}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-black transition ${compareIds.includes(item.car.id) ? 'border-red-400 bg-red-500/15 text-red-100' : 'border-white/10 text-slate-300 hover:border-white/30'}`}
                      >
                        {compareIds.includes(item.car.id) ? resultText.selected : resultText.compare}
                      </button>
                      <Link to={`/car/${item.car.id}`} className="rounded-xl bg-white px-3 py-2.5 text-center text-xs font-black text-slate-950 transition hover:bg-red-50">
                        {resultText.viewDetails}
                      </Link>
                    </div>
                  </div>
                </Motion.article>
              ))}
            </div>
          </section>
        )}

        {compareResult && (
          <Motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/30 to-white/[0.04] p-5 sm:p-6 ${isRtl ? 'text-right' : ''}`}
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-300">{text.compareAssistant}</p>
            <h2 className="mt-2 text-2xl font-black">{text.summary}</h2>
            <p className="mt-3 text-slate-300 leading-relaxed">{compareResult.summary}</p>
            <div className="mt-5 grid md:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-black/24 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black">{text.daily}</p>
                <p className="mt-1 font-black">{compareResult.best_for_daily}</p>
              </div>
              <div className="rounded-2xl bg-black/24 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black">{text.performance}</p>
                <p className="mt-1 font-black">{compareResult.best_for_performance}</p>
              </div>
              <div className="rounded-2xl bg-black/24 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-black">{text.value}</p>
                <p className="mt-1 font-black">{compareResult.best_value}</p>
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-400">{compareResult.recommendation}</p>
          </Motion.section>
        )}
      </main>
    </div>
  );
};

export default Recommendation;
