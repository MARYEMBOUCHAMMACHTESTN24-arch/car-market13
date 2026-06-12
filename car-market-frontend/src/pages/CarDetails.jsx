import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { aiAPI, carsAPI, favoritesAPI, ordersAPI, v2API } from '../services/api';

// Helper: resolve a DB image path to a usable URL.
// Images live in frontend/public/car1/ and are served at root by Vite.
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop';
const resolveImg = (path) => {
  if (!path || path.trim() === '') return null;

  let url = String(path).trim().replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/i, '');
  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }

  url = url.replace(/\\/g, '/').replace(/\/{2,}/g, '/');

  if (url.startsWith('/car1/')) {
    return url;
  }
  if (url.startsWith('car1/')) {
    return `/${url}`;
  }
  if (url.startsWith('/car/')) {
    return `/car1/${url.slice('/car/'.length)}`;
  }
  if (url.startsWith('car/')) {
    return `/car1/${url.slice('car/'.length)}`;
  }
  if (url.startsWith('/cars/')) {
    return `/car1/${url.slice('/cars/'.length)}`;
  }
  if (url.startsWith('cars/')) {
    return `/car1/${url.slice('cars/'.length)}`;
  }
  if (url.startsWith('/cars1/')) {
    return `/car1/${url.slice('/cars1/'.length)}`;
  }
  if (url.startsWith('cars1/')) {
    return `/car1/${url.slice('cars1/'.length)}`;
  }

  return url.startsWith('/') ? url : `/${url}`;
};

const displayCarColor = (color) => {
  const value = String(color || '').trim().replace(/\s+/g, ' ');
  return value || 'Color unavailable';
};

const SELLER_CONTACT = {
  phone: '+212 522 418 735',
  email: 'sales.casablanca@automarket.ma',
};

const promotionForCar = (car) => {
  const price = Number(car?.price || 0);
  const oldPrice = Number(car?.old_price || 0);

  if (!price || !oldPrice || oldPrice <= price) {
    return null;
  }

  const discount = ((oldPrice - price) / oldPrice) * 100;
  if (discount < 3 || discount > 18) {
    return null;
  }

  return {
    oldPrice,
    discount: Math.round(discount),
  };
};

const CarDetails = ({ user }) => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [similarCars, setSimilarCars] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [isTranslatingDesc, setIsTranslatingDesc] = useState(false);
  const currentLang = i18n.language || 'en';

  useEffect(() => {
    const fetchCar = async () => {
      // Legacy API (Active Production Source)
      try {
        const response = await carsAPI.getById(id);
        setCar(response.data);
      } catch (error) {
        console.error('Error fetching car:', error);
      } finally {
        setLoading(false);
      }

      /*
      // V2 MIGRATION: Kept for staging/testing
      try {
        // V2 Fetch (supports both numeric ID or slug seamlessly)
        const response = await v2API.get(`/cars/${id}`);
        if (response.data?.car) {
          const v2Car = response.data.car;
          const brandName = v2Car.brand?.name || '';
          
          const mappedCar = {
            id: v2Car.slug, 
            brand: brandName,
            model: v2Car.title.replace(new RegExp(`^${brandName}\\s*`, 'i'), '').trim(),
            price: v2Car.price,
            year: v2Car.year,
            mileage: v2Car.mileage,
            category: v2Car.category?.name || 'Sports',
            fuel_type: v2Car.fuelType,
            transmission: v2Car.transmission,
            color: v2Car.color,
            description: v2Car.description || '',
            stock: v2Car.isSold ? 0 : 5, 
            
            main_image: v2Car.images?.[0]?.imageUrl || '',
            front_image: v2Car.images?.[1]?.imageUrl || '',
            side_image: v2Car.images?.[2]?.imageUrl || '',
            rear_image: v2Car.images?.[3]?.imageUrl || '',
            interior_image: v2Car.images?.[4]?.imageUrl || '',
          };
          
          setCar(mappedCar);
        }
      } catch (error) {
        console.warn('V2 API failed', error);
      }
      */
    };
    fetchCar();
  }, [id]);

  useEffect(() => {
    if (!car) return;

    const rawImages = {
      main_image: car.main_image,
      front_image: car.front_image,
      side_image: car.side_image,
      rear_image: car.rear_image,
      interior_image: car.interior_image,
    };
    console.log('[car image debug] raw main_image', car.main_image);
    console.log('[car image debug] resolved image urls', Object.fromEntries(
      Object.entries(rawImages).map(([key, value]) => [key, resolveImg(value)])
    ));
  }, [car]);

  useEffect(() => {
    if (!car?.id) return;

    setSimilarLoading(true);
    aiAPI.similarCars(car.id, 6)
      .then((response) => {
        const items = response.data?.results || response.data?.recommendations || [];
        setSimilarCars(items);
      })
      .catch((error) => {
        console.warn('AI similar cars unavailable:', error.response?.data || error.message);
        setSimilarCars([]);
      })
      .finally(() => setSimilarLoading(false));

    if (user) {
      aiAPI.track({
        event_type: 'view',
        car_id: car.id,
        metadata: {
          car: {
            brand: car.brand,
            model: car.model,
            category: car.category,
            price: car.price,
            fuel_type: car.fuel_type,
            transmission: car.transmission,
          },
        },
      }).catch((error) => console.warn('AI view tracking unavailable:', error.response?.data || error.message));
    }
  }, [car, user]);

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setRequestForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user, id]);

  useEffect(() => {
    const fetchFavoriteState = async () => {
      if (!user || !id) {
        setIsFavorite(false);
        return;
      }

      try {
        const response = await favoritesAPI.getAll();
        const favorites = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        console.log('[favorites] loaded for car detail', {
          user_id: user.id,
          car_id: Number(id),
          favorite_car_ids: favorites.map(favorite => favorite.id),
        });
        setIsFavorite(favorites.some(favorite => Number(favorite.id) === Number(id)));
      } catch (error) {
        console.error('[favorites] failed to load favorite state', error.response?.data || error);
        setIsFavorite(false);
      }
    };

    fetchFavoriteState();
  }, [user, id]);

  // Dynamic Auto-Translation for Description
  useEffect(() => {
    if (!car || !car.description) return;
    
    const lang = currentLang.split('-')[0]; // fr, ar, en
    if (lang === 'en') {
      setTranslatedDesc(car.description);
      return;
    }

    const translateDescription = async () => {
      setIsTranslatingDesc(true);
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(car.description)}`);
        const data = await res.json();
        const translated = data[0].map(x => x[0]).join('');
        setTranslatedDesc(translated);
      } catch (e) {
        console.error('Auto-translation failed:', e);
        setTranslatedDesc(car.description);
      } finally {
        setIsTranslatingDesc(false);
      }
    };
    
    translateDescription();
  }, [car, currentLang]);

  const handleRequestClick = () => {
    if (!user) {
      // Redirect to login with return URL
      navigate(`/login?redirect=${encodeURIComponent(`/car/${id}`)}`);
      return;
    }
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.phone.trim()) {
      alert(t('carDetails.phoneRequired'));
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(requestForm.phone)) {
      setPhoneError('Phone number must contain exactly 10 digits.');
      return;
    }

    setSubmitting(true);
    try {
      await ordersAPI.create({
        car_id: id,
        name: requestForm.name,
        email: requestForm.email,
        phone: requestForm.phone,
        status: 'pending'
      });
      setSuccessMessage(t('carDetails.successMessage'));
      setShowRequestModal(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error submitting request:', err);
      alert(t('carDetails.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };
  const handleToggleFavorite = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/car/${id}`)}`);
      return;
    }

    if (favoriteSaving) {
      return;
    }

    const nextState = !isFavorite;
    setIsFavorite(nextState);
    setFavoriteSaving(true);

    try {
      const response = nextState
        ? await favoritesAPI.add(id)
        : await favoritesAPI.remove(id);

      console.log('[favorites] toggle response', {
        user_id: user.id,
        car_id: Number(id),
        is_favorite: nextState,
        response: response.data,
      });

      if (nextState) {
        aiAPI.track({
          event_type: 'favorite',
          car_id: Number(id),
          metadata: {
            car: {
              brand: car.brand,
              model: car.model,
              category: car.category,
              price: car.price,
            },
          },
        }).catch(() => {});
      }
    } catch (error) {
      setIsFavorite(!nextState);
      console.error('[favorites] failed to toggle favorite', error.response?.data || error);
      alert('Could not update favorites. Please try again.');
    } finally {
      setFavoriteSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="bg-white border-b border-gray-100 h-20 animate-pulse"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-gray-200 animate-pulse h-56 sm:h-72 rounded-xl"></div>
              <div className="bg-gray-200 animate-pulse h-24 rounded-xl"></div>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-200 animate-pulse h-28 rounded-xl"></div>
              <div className="bg-gray-200 animate-pulse h-40 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-lg font-bold text-gray-800 mb-3">{t('carDetails.notFound')}</h1>
          <Link to="/cars" className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {t('common.back')}
          </Link>
        </div>
      </div>
    );
  }

  const translateFuel = (fuel) => {
    switch (String(fuel || '').toLowerCase()) {
      case 'petrol':
      case 'gasoline':
        return t('cars.fuel_petrol') || fuel;
      case 'diesel':
        return t('cars.fuel_diesel') || fuel;
      case 'electric':
      case 'ev':
        return t('cars.fuel_electric') || fuel;
      case 'hybrid':
        return t('cars.fuel_hybrid') || fuel;
      default:
        return fuel;
    }
  };

  const translateTrans = (trans) => {
    switch (String(trans || '').toLowerCase()) {
      case 'automatic':
        return t('cars.trans_auto') || trans;
      case 'manual':
        return t('cars.trans_manual') || trans;
      default:
        return trans;
    }
  };

  const translateColor = (color) => {
    const c = String(color || '').toLowerCase().trim();
    switch (c) {
      case 'various': return t('cars.color_various') || 'Various';
      case 'black': return t('cars.color_black') || 'Black';
      case 'white': return t('cars.color_white') || 'White';
      case 'red': return t('cars.color_red') || 'Red';
      case 'blue': return t('cars.color_blue') || 'Blue';
      case 'silver': return t('cars.color_silver') || 'Silver';
      case 'grey':
      case 'gray': return t('cars.color_grey') || 'Grey';
      default: return displayCarColor(color);
    }
  };

  const translateCategory = (cat) => {
    const c = String(cat || '').toLowerCase().trim();
    switch (c) {
      case 'hatchback': return t('cars.cat_hatchback') || 'Hatchback';
      case 'sedan': return t('cars.cat_sedan') || 'Sedan';
      case 'suv': return t('cars.cat_suv') || 'SUV';
      case 'sports': return t('cars.cat_sports') || 'Sports';
      case 'luxury': return t('cars.cat_luxury') || 'Luxury';
      case 'truck': return t('cars.cat_truck') || 'Truck';
      case 'van': return t('cars.cat_van') || 'Van';
      default: return cat;
    }
  };

  const specs = [
    { label: t('carDetails.year'), value: car.year, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: t('carDetails.mileage'), value: `${Number(car.mileage)?.toLocaleString()} km`, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: t('common.type'), value: translateCategory(car.category || car.type), icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { label: t('admin.form_fuel') || 'Fuel Type', value: translateFuel(car.fuel_type), icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: t('admin.form_transmission') || 'Transmission', value: translateTrans(car.transmission), icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4' },
    { label: t('admin.form_color') || 'Color', value: translateColor(car.color), icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  ];

  // Build the image gallery from real DB fields
  const getCarImages = () => {
    const imgs = [
      resolveImg(car.image_url || car.main_image),
      resolveImg(car.front_image),
      resolveImg(car.side_image),
      resolveImg(car.rear_image),
      resolveImg(car.interior_image),
    ].filter(Boolean);
    return imgs.length > 0 ? imgs : [FALLBACK_IMG];
  };

  const images = getCarImages();
  const promotion = promotionForCar(car);

  const features = [t('carDetails.bluetooth'), t('carDetails.backupCamera'), t('carDetails.navigation'), t('carDetails.heatedSeats'), t('carDetails.sunroof'), t('carDetails.keylessEntry'), t('carDetails.cruiseControl'), t('carDetails.laneAssist')];

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-red-600 transition-colors">{t('navbar.home')}</Link>
            <span>/</span>
            <Link to="/cars" className="hover:text-red-600 transition-colors">{t('navbar.cars')}</Link>
            <span>/</span>
            <span className="text-gray-900">{car.brand} {car.model}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Image Gallery */}
          <div className="lg:col-span-2">
            {/* Main Image with Slider */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              <div className="relative h-80 sm:h-96 md:h-[450px]">
                  <img
                  src={images[currentImageIndex]}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = FALLBACK_IMG; e.target.onerror = null; }}
                />
                {/* Slider Arrows */}
                <button
                  onClick={() => setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {/* Stock Badge */}
                {car.stock <= 3 && car.stock > 0 && (
                  <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-md">{t('carDetails.lowStock')}</span>
                )}
                {car.stock === 0 && (
                  <span className="absolute top-4 right-4 bg-gray-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-md">{t('carDetails.soldOut')}</span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-20 rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 hover:border-red-300'
                    }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; e.currentTarget.onerror = null; }}
                  />
                </button>
              ))}
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('carDetails.specifications')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={spec.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{spec.label}</p>
                      <p className="text-sm font-bold text-gray-900">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('carDetails.features')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {features.map(feature => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('carDetails.description')}</h3>
              <div className="text-gray-600 text-sm leading-relaxed">
                {isTranslatingDesc ? (
                  <div className="animate-pulse flex flex-col gap-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                ) : (
                  translatedDesc || t('carDetails.descriptionText')
                )}
              </div>
            </div>

            {/* AI Similar Cars */}
            <div className="bg-[#07101d] rounded-2xl shadow-xl p-6 mt-6 border border-slate-800">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-300 mb-1">{t('carDetails.aiSimilarVehicles') || 'AI SIMILAR VEHICLES'}</p>
                  <h3 className="text-lg font-bold text-white">{t('carDetails.aiSimilarRecommended') || 'Recommended beyond brand matching'}</h3>
                </div>
                <Link to="/ai-advisor" className="hidden sm:inline-flex rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:border-red-400/70 hover:text-white transition">
                  {t('carDetails.openAdvisor') || 'Open Advisor'}
                </Link>
              </div>

              {similarLoading ? (
                <div className="grid sm:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-44 rounded-xl bg-white/10 animate-pulse" />
                  ))}
                </div>
              ) : similarCars.length > 0 ? (
                <div className="grid sm:grid-cols-3 gap-3">
                  {similarCars.slice(0, 6).map((item) => (
                    <Link key={item.car.id} to={`/car/${item.car.id}`} className="group overflow-hidden rounded-xl bg-white/[0.06] border border-white/10 hover:border-red-400/50 transition">
                      <div className="relative h-28">
                        <img
                          src={resolveImg(item.car.image_url || item.car.main_image) || FALLBACK_IMG}
                          alt={`${item.car.brand} ${item.car.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; e.currentTarget.onerror = null; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#07101d] to-transparent" />
                        <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                          {item.ai_match_percentage || item.score}% Match
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-black text-white truncate">{item.car.brand} {item.car.model}</h4>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mt-1 truncate">{item.personality_tag}</p>
                        <p className="text-xs text-slate-300 mt-2">{Number(item.car.price || 0).toLocaleString()} DH</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.06] p-4 text-sm text-slate-400">
                  {t('carDetails.startFastAPI') || 'Start the FastAPI AI engine to unlock semantic similar-vehicle recommendations.'}
                </div>
              )}
            </div>
          </div>

          {/* Right - Details Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {car.brand} <span className="text-red-600">{car.model}</span>
              </h1>
              {/* Location removed from DB */}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">{Number(car.price)?.toLocaleString()} DH</span>
                  {promotion && (
                    <span className="text-lg text-gray-400 line-through">{promotion.oldPrice.toLocaleString()} DH</span>
                  )}
                </div>
                {promotion && (
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mt-2">
                    {t('carDetails.offer')} - {promotion.discount}% off
                  </span>
                )}
              </div>

              {/* Request Button */}
              <button
                onClick={handleRequestClick}
                className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30"
              >
                {t('carDetails.requestCar')}
              </button>

              {/* Contact Seller */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('carDetails.contactSeller')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span>{SELLER_CONTACT.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span>{SELLER_CONTACT.email}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleToggleFavorite}
                  disabled={favoriteSaving}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm border disabled:opacity-70 disabled:cursor-wait ${isFavorite
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-200 hover:border-red-500 text-gray-700 hover:text-red-600'
                    }`}
                >
                  <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isFavorite ? t('carDetails.savedToWishlist') : t('carDetails.addToWishlist')}
                </button>
                <button className="flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm border border-gray-200 hover:border-gray-300 text-gray-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {t('common.share')}
                </button>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mt-4">
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-heading">{t('carDetails.requestCar')}</h3>
                <p className="text-gray-500 text-sm mt-1">{car.brand} {car.model} - {Number(car.price)?.toLocaleString()} DH</p>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitRequest} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('register.nameLabel')}</label>
                <input
                  type="text"
                  value={requestForm.name}
                  onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  placeholder={t('register.namePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('register.emailLabel')}</label>
                <input
                  type="email"
                  value={requestForm.email}
                  onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  placeholder={t('register.emailPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('carDetails.phoneNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]*"
                  value={requestForm.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setRequestForm({ ...requestForm, phone: val });
                    if (val && val.length !== 10) {
                      setPhoneError(t('carDetails.phoneDigitsError') || 'Phone number must contain exactly 10 digits.');
                    } else {
                      setPhoneError('');
                    }
                  }}
                  required
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-red-500'
                  }`}
                  placeholder={t('carDetails.phonePlaceholder')}
                />
                {phoneError ? (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">{phoneError}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">{t('carDetails.phoneNote')}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || (requestForm.phone.length > 0 && requestForm.phone.length !== 10)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-600/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('carDetails.sending')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {t('carDetails.requestCar')}
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              {t('carDetails.agreement')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarDetails;
