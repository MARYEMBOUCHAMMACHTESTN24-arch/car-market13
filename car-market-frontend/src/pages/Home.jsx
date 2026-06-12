import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { aiAPI, carsAPI, offersAPI, v2API } from '../services/api';
import heroBg from '../assets/hero-bg.png';
import CarCard from '../components/CarCard';
import { motion as Motion } from 'framer-motion';
import { getBuyingTipImage } from '../utils/buyingTipImages';


const Home = () => {
  const { t } = useTranslation();

  const staticCars = [
    { id: 's1', name: 'Audi RS6 Avant', brand: 'Audi', model: 'RS6 Avant', price: 759000, city: 'Tangier', year: '2024', type: 'Sports', image: '/car/Audi/RS6_Avant/main.jpg', main_image: '/car/Audi/RS6_Avant/main.jpg' },
    { id: 's2', name: 'BMW M4 Competition', brand: 'BMW', model: 'M4 Competition', price: 825000, city: 'Casablanca', year: '2024', type: 'Sports', image: '/car/BMW/M4_Coupe/main.jpg', main_image: '/car/BMW/M4_Coupe/main.jpg' },
    { id: 's3', name: 'Mercedes-Benz S65 AMG', brand: 'Mercedes-Benz', model: 'S65 AMG', price: 890000, city: 'Rabat', year: '2023', type: 'Sports', image: '/car/Mercedes/S65_AMG/main.jpg', main_image: '/car/Mercedes/S65_AMG/main.jpg' },
    { id: 's4', name: 'Porsche 911 Carrera T', brand: 'Porsche', model: '911 Carrera T', price: 1144000, city: 'Marrakech', year: '2023', type: 'Sports', image: '/car/Porsche/911_Carrera_T_7-Speed/main.jpg', main_image: '/car/Porsche/911_Carrera_T_7-Speed/main.jpg' },
    { id: 's5', name: 'Ford Mustang', brand: 'Ford', model: 'Mustang', price: 429000, city: 'Tangier', year: '2024', type: 'Sports', image: '/car/Ford/Mustang/main.jpg', main_image: '/car/Ford/Mustang/main.jpg' },
    { id: 's6', name: 'Toyota Supra', brand: 'Toyota', model: 'Supra', price: 545000, city: 'Agadir', year: '2023', type: 'Sports', image: '/car/Toyota/GR_Supra_A91-CF_Edition/main.jpg', main_image: '/car/Toyota/GR_Supra_A91-CF_Edition/main.jpg' },
  ];

  const [featuredCars, setFeaturedCars] = useState(staticCars);
  const [premiumOffers, setPremiumOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    brand: '', maxPrice: '', category: ''
  });
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedCars = async () => {
      // Legacy API (Active Production Source)
      try {
        const response = await carsAPI.getFeatured();
        const carsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        if (carsData.length > 0) {
          setFeaturedCars(carsData);
        }
      } catch (error) {
        console.error('Error fetching featured cars:', error);
      } finally {
        setLoading(false);
      }

      /* 
      // V2 MIGRATION: Kept for staging/testing
      try {
        const response = await v2API.get('/featured');
        const v2Cars = response.data?.data || [];
        
        if (v2Cars.length > 0) {
          const mappedCars = v2Cars.map(car => ({
            id: car.id,
            name: car.title,
            brand: car.brand?.name || '',
            model: '', 
            price: car.price,
            year: car.year,
            type: car.category?.name || 'Sports',
            main_image: car.mainImage?.imageUrl || '',
            image_url: car.mainImage?.imageUrl || '',
          }));
          setFeaturedCars(mappedCars);
        }
      } catch (error) {
        console.warn('V2 API failed', error);
      }
      */
    };
    fetchFeaturedCars();

    const fetchPremiumOffers = async () => {
      try {
        const response = await offersAPI.getActive();
        const offersData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setPremiumOffers(offersData.filter(offer => offer.car).slice(0, 4));
      } catch (error) {
        console.error('Error fetching premium offers:', error);
      }
    };
    fetchPremiumOffers();

    // Fetch filter metadata
    const fetchMetadata = async () => {
      try {
        const [brandsRes, catsRes] = await Promise.all([
          carsAPI.getBrands(),
          carsAPI.getCategories()
        ]);
        setAvailableBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
        setAvailableCategories(
          Array.isArray(catsRes.data)
            ? catsRes.data.map(category => typeof category === 'string' ? category : category.name).filter(Boolean)
            : []
        );
      } catch (error) {
        console.error('Error fetching filter metadata:', error);
      }
    };
    fetchMetadata();
  }, []);



  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(searchFilters).forEach(([key, val]) => {
      if (val) {
        let paramKey = key;
        if (key === 'maxPrice') paramKey = 'max_price';
        // The backend and Cars.jsx expect 'category' for body type
        if (key === 'type') paramKey = 'category';
        params.append(paramKey, val);
      }
    });
    navigate(`/cars?${params.toString()}`);
  };

  /* ───────────────────────── HERO + SEARCH ───────────────────────── */
  const HeroSection = () => (
    <section className="relative min-h-[680px] md:min-h-[720px] flex flex-col overflow-hidden">
      {/* Background - night city with red car */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Red sports car with city skyline at night"
          className="w-full h-full object-cover object-center"
        />
        {/* Lightened overlay for better color visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-28 md:py-32">
          {/* Force left alignment even in RTL */}
          <div className="max-w-xl animate-fade-in-up text-left rtl:mr-auto rtl:ml-0">
            <span className="inline-block text-red-500 text-xs font-bold uppercase tracking-[0.25em] mb-4 drop-shadow-sm">
              {t('home.heroTitle')}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] lg:text-6xl font-extrabold text-white leading-[1.1] mb-5 font-heading drop-shadow-lg">
              {t('home.heroTitle')}
            </h1>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-md drop-shadow-sm">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/cars"
                className="group inline-flex items-center gap-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-all duration-300 shadow-xl shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-0.5"
              >
                {t('home.browseAllCars')}
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-lg border border-white/25 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5"
              >
                {t('home.getStarted')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - integrated at bottom of hero */}
      <div className="relative z-20 pb-0 -mb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl shadow-black/15 p-5 md:p-7 border border-gray-100/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Brand */}
              <div>
                <label className="block text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">{t('common.brand')}</label>
                <div className="relative">
                  <select name="brand" value={searchFilters.brand} onChange={handleFilterChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none cursor-pointer transition-all hover:border-gray-300">
                    <option value="">{t('cars.allBrands')}</option>
                    {availableBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {/* Max Price */}
              <div>
                <label className="block text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">{t('cars.max')}</label>
                <div className="relative">
                  <select name="maxPrice" value={searchFilters.maxPrice} onChange={handleFilterChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none cursor-pointer transition-all hover:border-gray-300">
                    <option value="">{t('cars.max')}</option>
                    <option value="25000">{t('cars.under')} $25,000</option>
                    <option value="50000">{t('cars.under')} $50,000</option>
                    <option value="100000">{t('cars.under')} $100,000</option>
                    <option value="200000">{t('cars.under')} $200,000</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Car Type */}
              <div>
                <label className="block text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-2">Category</label>
                <div className="relative">
                  <select name="category" value={searchFilters.category} onChange={handleFilterChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none cursor-pointer transition-all hover:border-gray-300">
                    <option value="">{t('cars.allTypes')}</option>
                    {availableCategories.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {/* Search Button */}
              <button type="submit" className="flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:-translate-y-0.5 text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                {t('common.search')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );

  // SearchSection is now integrated into HeroSection
  const SearchSection = () => null;

  /* ───────────────────────── FEATURED CARS ───────────────────────── */
  const FeaturedCarsSection = () => (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading">{t('home.featuredCars')}</h2>
          <Link to="/cars" className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center gap-1 transition-colors">
            {t('home.viewAll')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        <p className="text-gray-500 text-sm mb-8">{t('home.heroSubtitle')}</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCars.map(car => (
              <CarCard
                key={car.id}
                car={car}
                badge={t('common.featured')}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const PremiumOffersSection = ({ offers }) => (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading">{t('home.premiumOffers') || 'Premium Offers'}</h2>
            <Link to="/offers" className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center gap-1 transition-colors">
              {t('common.view_all')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <p className="text-gray-500 text-sm mb-8">{t('home.premiumOffersDesc') || 'Exclusive vehicles selected by the admin team.'}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {offers.map(offer => (
              <CarCard
                key={offer.id}
                car={offer.car}
                badge={offer.discount_type === 'fixed' ? `${Number(offer.discount || 0).toLocaleString()} DH OFF` : `${Number(offer.discount || 0).toLocaleString()}% OFF`}
              />
            ))}
          </div>
        </div>
      </section>
  );

  const PersonalizedAISection = () => {
    const { t } = useTranslation();
    const features = [
      {
        title: t('home.aiSemanticTitle') || 'Semantic Search',
        description: t('home.aiSemanticDesc') || 'Try "comfortable daily Mercedes" or "luxury family SUV under 700k". Our AI understands natural language, not just keywords.',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zm-3 4a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        ),
      },
      {
        title: t('home.aiMatchTitle') || 'AI Match Scores',
        description: t('home.aiMatchDesc') || 'Every recommendation includes a percentage match and clear purchase reasons so you know exactly why a car fits your needs.',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        title: t('home.aiTasteTitle') || 'Taste Learning',
        description: t('home.aiTasteDesc') || 'Logged-in users get smarter suggestions after every view and saved favorite. The more you browse, the better it gets.',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
      },
    ];

    return (
      <section className="py-8 md:py-10 bg-[#070B12] border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & CTA */}
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-6">
            <div className="inline-flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                {t('home.aiAdvisorBadge') || 'AI Advisor • Powered by AutoMarket AI'}
              </span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black text-white font-heading mb-1.5">
              {t('home.aiAdvisorTitle') || 'Personalized Automotive Intelligence'}
            </h2>
            
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto mb-3">
              {t('home.aiAdvisorDesc') || 'Search by intent, compare vehicles intelligently, and unlock recommendations that learn from your views and favorites.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-4">
              {[
                t('home.aiSemanticTitle') || 'Semantic Search',
                t('home.aiSmartMatching') || 'Smart Vehicle Matching',
                t('home.aiPersonalized') || 'Personalized Recommendations'
              ].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>

            <Link
              to="/ai-advisor"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs md:text-sm font-black text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:bg-red-500 hover:-translate-y-0.5 hover:shadow-red-500/30 w-fit"
            >
              {t('home.openAiAdvisor') || 'Open AI Advisor'}
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {features.map(({ title, description, icon }) => (
              <div
                key={title}
                className="group rounded-2xl border border-white/5 bg-[#111827] bg-gradient-to-br from-white/[0.02] to-transparent p-3.5 transition-all duration-300 hover:-translate-y-1.5 hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-500/10 text-left"
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-red-500/10 text-red-500 mb-2 transition-transform duration-300 group-hover:scale-110">
                  {icon}
                </div>

                {/* Text */}
                <h3 className="text-sm font-black text-white mb-1 tracking-tight">{title}</h3>
                <p className="text-xs text-slate-400 leading-snug">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };


  /* ───────────────────────── WHY CHOOSE US ───────────────────────── */
  const WhyChooseUsSection = () => {
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2
        }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
      }
    };

    return (
      <section className="py-16 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-12"
          >
            <Motion.h2 variants={itemVariants} className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-2">{t('home.whyChooseUs')}</Motion.h2>
            <Motion.p variants={itemVariants} className="text-gray-500 text-sm">{t('home.heroSubtitle')}</Motion.p>
          </Motion.div>
          <Motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: t('home.trustedDealers'), desc: t('home.trustedDealersDesc') },
              { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: t('home.bestPrices'), desc: t('home.bestPricesDesc') },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: t('home.fastProcess'), desc: t('home.fastProcessDesc') },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: t('home.securePayments'), desc: t('home.securePaymentsDesc') },
            ].map((item, i) => (
              <Motion.div variants={itemVariants} key={i} className="text-center group">
                <Motion.div
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full group-hover:bg-red-50 transition-all duration-200"
                >
                  {/* Static Background Border */}
                  <div className="absolute inset-0 rounded-full border-2 border-red-100 z-0"></div>

                  {/* Rotating Fire Trail (Conic Gradient) */}
                  <div className="absolute inset-0 animate-[spin_2s_linear_infinite] group-hover:animate-[spin_1s_linear_infinite] z-10">
                    {/* The Fire Glow (Outer Aura) */}
                    <div className="absolute inset-[-2px] rounded-full bg-[conic-gradient(from_0deg,transparent_20%,rgba(239,68,68,0.3)_60%,rgba(239,68,68,0.8)_90%,#D32F2F_100%)] blur-[6px] opacity-70 group-hover:opacity-100 group-hover:blur-[10px] transition-all duration-300"></div>

                    {/* The Core Comet Tail */}
                    <div className="absolute inset-0 rounded-full p-[2px] bg-[conic-gradient(from_0deg,transparent_30%,rgba(239,68,68,0.4)_70%,rgba(239,68,68,1)_95%,#ffffff_100%)]">
                      {/* Inner Mask (Hollows out the circle, revealing only the gradient border) */}
                      <div className="w-full h-full rounded-full bg-gray-50 group-hover:bg-red-50 transition-colors duration-200"></div>
                    </div>
                  </div>

                  {/* Static Icon */}
                  <svg className="w-7 h-7 text-red-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </Motion.div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
              </Motion.div>
            ))}
          </Motion.div>
        </div>
      </section>
    );
  };

  /* ───────────────────────── HOW IT WORKS ───────────────────────── */
  const HowItWorksSection = () => (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-2">{t('home.howItWorks')}</h2>
          <p className="text-gray-500 text-sm">{t('home.heroSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {[
            { num: '1', title: t('common.search'), desc: t('home.heroSubtitle'), icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
            { num: '2', title: t('common.viewDetails'), desc: t('home.heroSubtitle'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { num: '3', title: t('common.submit'), desc: t('home.heroSubtitle'), icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          ].map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Step Number */}
              <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mb-4">
                <span className="text-red-600 font-bold text-sm">{step.num}.</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[220px]">{step.desc}</p>

              {/* Arrow between steps */}
              {i < 2 && (
                <div className="hidden md:block absolute top-7 -right-4 z-10">
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ───────────────────────── POPULAR BRANDS ───────────────────────── */
  const PopularBrandsSection = () => (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-2">{t('home.popularBrands')}</h2>
          <p className="text-gray-500 text-sm">{t('home.heroSubtitle')}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {[
            { name: 'BMW', query: 'BMW', logo: 'https://cdn.simpleicons.org/bmw' },
            { name: 'Mercedes-Benz', query: 'Mercedes-Benz', logo: 'https://cdn.worldvectorlogo.com/logos/mercedes-benz-9.svg' },
            { name: 'Audi', query: 'Audi', logo: 'https://cdn.simpleicons.org/audi' },
            { name: 'Toyota', query: 'Toyota', logo: 'https://cdn.simpleicons.org/toyota' },
            { name: 'Ford', query: 'Ford', logo: 'https://cdn.simpleicons.org/ford' },
            { name: 'Honda', query: 'Honda', logo: 'https://cdn.simpleicons.org/honda' },
            { name: 'Porsche', query: 'Porsche', logo: 'https://cdn.simpleicons.org/porsche' },
            { name: 'Hyundai', query: 'Hyundai', logo: 'https://cdn.simpleicons.org/hyundai' },
          ].map((brand) => (
            <Link
              key={brand.name}
              to={`/cars?brand=${encodeURIComponent(brand.query)}`}
              aria-label={`View ${brand.name} vehicles`}
              className="w-20 h-20 md:w-32 md:h-28 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-4 hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-all duration-300 group"
            >
              <div className="relative flex items-center justify-center mb-2 h-12">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                  className="h-full w-auto object-contain transition-all duration-300"
                />
                <div className="hidden text-[10px] font-bold text-gray-400 group-hover:text-red-500 text-center uppercase">
                  {brand.name}
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-500 group-hover:text-red-600 transition-colors uppercase tracking-widest">{brand.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  /* ───────────────────────── TESTIMONIALS ───────────────────────── */
  const TestimonialsSection = () => (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading mb-2">{t('home.testimonials')}</h2>
          <p className="text-gray-500 text-sm">{t('home.heroSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'James Wilson',
              location: 'New York',
              rating: 5,
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
              text: t('testimonials.james')
            },
            {
              name: 'Sophia Martinez',
              location: 'Los Angeles',
              rating: 5,
              image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
              text: t('testimonials.sophia')
            },
            {
              name: 'Michael Brown',
              location: 'Chicago',
              rating: 5,
              image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
              text: t('testimonials.michael')
            },
          ].map((review, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-6 relative">
              {/* Quote Icon */}
              <div className="text-red-500 text-3xl font-serif mb-3 leading-none">"</div>
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(review.rating)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.text}</p>
              {/* Author */}
              <div className="flex items-center gap-3">
                <img src={review.image} alt={review.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{review.name}</h4>
                  <p className="text-xs text-gray-500">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ───────────────────────── CAR TIPS SECTION ───────────────────────── */
  const CarTipsSection = () => {
    const { t } = useTranslation();
    const [selectedTip, setSelectedTip] = useState(null);

    const tips = [
      {
        id: 1,
        title: t('home.tips_1_title') || 'Check the Vehicle History',
        shortText: t('home.tips_1_short') || 'Always run a history check before buying any car.',
        details: t('home.tips_1_details') || "A vehicle history report reveals past accidents, title issues, flood damage, and the true mileage. Never buy a used car without seeing this report — services like Carfax or AutoCheck can uncover hidden problems that save you from costly surprises.",
        image: getBuyingTipImage('history'),
      },
      {
        id: 2,
        title: t('home.tips_2_title') || 'Take a Proper Test Drive',
        shortText: t('home.tips_2_short') || 'Drive on both local roads and highways to test all conditions.',
        details: t('home.tips_2_details') || "A test drive shouldn't just be around the block. Take the car on the highway to check for high-speed vibrations, ensure the transmission shifts smoothly, and test the brakes firmly to see if the car pulls to one side. Listen for any clunks or squeals.",
        image: getBuyingTipImage('testDrive'),
      },
      {
        id: 3,
        title: t('home.tips_3_title') || 'Have a Mechanic Inspect It',
        shortText: t('home.tips_3_short') || 'Get an independent pre-purchase inspection before signing.',
        details: t('home.tips_3_details') || "Even a great-looking car can hide expensive mechanical problems. A qualified independent mechanic can spot fluid leaks, worn brake pads, suspension issues, and failing components. A small inspection fee can save you thousands in repairs.",
        image: getBuyingTipImage('mechanic'),
      },
    ];

    return (
      <section className="py-20 bg-[#F9FAFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">{t('home.car_buying_tips_title') || 'Car Buying Tips'}</h2>
              <p className="text-gray-500 text-base">{t('home.car_buying_tips_subtitle') || 'Essential advice before making your next purchase.'}</p>
            </div>
            <Link
              to="/blog"
              className="shrink-0 inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors group/btn"
            >
              {t('home.view_all') || 'View All'}
              <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* 3-column cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="h-48 overflow-hidden relative group">
                  <img
                    src={tip.image}
                    alt={tip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{tip.title}</h3>
                  <p className="text-gray-500 text-sm flex-1 mb-6">{tip.shortText}</p>
                  <button
                    onClick={() => setSelectedTip(tip)}
                    className="w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold py-3 px-6 rounded-xl transition-colors duration-300 text-sm"
                  >
                    {t('home.read_tip') || 'Read Tip'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {selectedTip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedTip(null)}
            />

            {/* Modal card */}
            <div className="relative bg-white w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
              {/* Close button */}
              <button
                onClick={() => setSelectedTip(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Large image */}
              <div className="h-64 sm:h-72 w-full shrink-0">
                <img src={selectedTip.image} alt={selectedTip.title} className="w-full h-full object-cover" />
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto">
                <p className="text-red-600 font-black uppercase tracking-widest text-xs mb-3">Expert Advice</p>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 tracking-tight">{selectedTip.title}</h3>
                <p className="text-gray-600 text-base leading-relaxed">{selectedTip.details}</p>
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setSelectedTip(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-8 py-3 rounded-xl transition-colors text-sm"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  };




  /* ───────────────────────── CTA SECTION ───────────────────────── */
  const CTASection = () => (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&h=400&fit=crop&q=80"
              alt="Luxury cars"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/50 to-transparent" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-8 md:px-14 py-10 md:py-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white font-heading mb-2">{t('home.heroTitle')}</h2>
              <p className="text-gray-400 text-sm">{t('home.heroSubtitle')}</p>
            </div>
            <Link
              to="/cars"
              className="mt-6 md:mt-0 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-7 py-3 rounded-lg transition-colors shadow-lg"
            >
              {t('home.viewInventory')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );

  /* ───────────────────────── RENDER ───────────────────────── */
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <SearchSection />
      <PersonalizedAISection />
      <FeaturedCarsSection />
      {premiumOffers.length > 0 && (
        <PremiumOffersSection offers={premiumOffers} />
      )}
      <WhyChooseUsSection />
      <HowItWorksSection />
      <PopularBrandsSection />
      <TestimonialsSection />
      <CarTipsSection />
      <CTASection />
    </div>
  );
};

export default Home;

