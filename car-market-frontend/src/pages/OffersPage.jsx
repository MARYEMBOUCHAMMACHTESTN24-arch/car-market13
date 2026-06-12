import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { offersAPI } from '../services/api';

const resolveImg = (path) => {
  if (!path || path.trim() === '') return null;
  let url = path.replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/, '');
  if (url && !url.startsWith('/') && !url.startsWith('http')) {
    url = '/' + url;
  }
  return url;
};

const CountdownTimer = ({ expiryDate }) => {
  const { t } = useTranslation();

  const calculateTimeLeft = () => {
    const difference = +new Date(expiryDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearTimeout(timer);
  });

  const isExpired = Object.keys(timeLeft).length === 0;

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        {t('offers.expiredEndingSoon')}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-red-600 shadow-sm" dir="ltr">
      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
      {timeLeft.days > 0 ? `${timeLeft.days}${t('offers.daysLetter')} ` : ''}
      {timeLeft.hours}{t('offers.hoursLetter')} {timeLeft.minutes}{t('offers.minutesLetter')} {t('offers.timeLeft')}
    </span>
  );
};

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith('ar');

  useEffect(() => {
    let isMounted = true;

    offersAPI.getActive()
      .then((response) => {
        if (isMounted) {
          const offersData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          setOffers(offersData);
        }
      })
      .catch((error) => {
        console.error('Failed to load active offers', error);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const calculatePrice = (offer) => {
    // If backend already provides calculated discount_price, use it
    if (offer.discount_price) {
      return Number(offer.discount_price);
    }

    const price = Number(offer.car?.price || offer.original_price || 0);
    const discount = Number(offer.discount || 0);

    if (offer.discount_type === 'fixed') {
      return Math.max(price - discount, 0);
    }

    return Math.max(price - (price * discount / 100), 0);
  };

  const formatDiscount = (offer) => {
    const discount = Number(offer.discount || 0);

    return offer.discount_type === 'fixed'
      ? `${discount.toLocaleString()} DH ${t('offers.off')}`
      : `${discount.toLocaleString()}% ${t('offers.off')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-100 rounded-full flex items-center justify-center relative">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          <span className="text-red-600 text-[10px] font-black uppercase tracking-widest animate-pulse">{t('offers.loadingLabel')}</span>
        </div>
        <p className="mt-4 text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">{t('offers.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-red-600/20 selection:text-red-900" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-8 pt-32 pb-16 lg:pb-20">
        {offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {offers.map((offer) => {
              const car = offer.car || {};
              const originalPrice = Number(offer.original_price || car.price || 0);
              const finalPrice = calculatePrice(offer);
              const isPremium = offer.is_premium || car.is_premium;
              const displayImg = resolveImg(offer.image_url || offer.image || car.image_url || car.main_image);

              return (
                <article
                  key={offer.id}
                  className={`group relative rounded-[24px] overflow-hidden bg-white border border-[#ECECEC] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]`}
                >
                  {/* Image Container */}
                  <div className="relative h-[260px] overflow-hidden bg-slate-100">
                    {displayImg ? (
                      <img
                        src={displayImg}
                        alt={offer.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-bold uppercase tracking-widest text-slate-400 bg-slate-100">
                        AutoMarket
                      </div>
                    )}

                    {/* Expiration Timer badge */}
                    <div className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-4 z-10`}>
                      <CountdownTimer expiryDate={offer.expires_at || offer.end_date} />
                    </div>

                    {/* Premium Gold Tag */}
                    {isPremium && (
                      <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-4 z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20`}>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {t('offers.premiumSpec')}
                      </div>
                    )}

                    {/* Red Discount Ribbon */}
                    <div className={`absolute ${isRtl ? 'right-0 rounded-tl-[24px]' : 'left-0 rounded-tr-[24px]'} bottom-0 bg-red-600 px-5 py-2.5 text-sm font-black uppercase tracking-widest text-white shadow-lg`}>
                      {formatDiscount(offer)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8">
                    <div className="mb-6">
                      {car.brand && (
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          {car.brand} {car.model} • {car.year}
                        </p>
                      )}
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                        {offer.title}
                      </h2>
                      {offer.description && (
                        <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-2">
                          {offer.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing Block */}
                    <div className="pt-6 border-t border-[#ECECEC] flex items-center justify-between">
                      <div>
                        {originalPrice > 0 && (
                          <p className="text-sm font-bold text-slate-400 line-through mb-1">
                            {originalPrice.toLocaleString()} DH
                          </p>
                        )}
                        <p className="text-2xl font-black text-slate-900">
                          {Math.round(finalPrice).toLocaleString()} <span className="text-sm font-bold text-slate-500">DH</span>
                        </p>
                      </div>
                      
                      {car.id ? (
                        <Link
                          to={`/car/${car.id}`}
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                            isPremium
                              ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white'
                              : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-sm'
                          }`}
                        >
                          <svg className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7-7 7" /></svg>
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 italic">{t('offers.noCarLinked')}</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Premium Empty State */
          <div className="max-w-2xl mx-auto py-12">
            <div className="bg-white rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-[#ECECEC] p-12 sm:p-16 text-center flex flex-col items-center">
              <div className="w-24 h-24 mb-8 bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{t('offers.noActiveOffers')}</h2>
              <p className="text-lg text-slate-500 mb-10 max-w-md">
                {t('offers.noActiveOffersDesc')}
              </p>
              <Link
                to="/cars"
                className="inline-flex items-center justify-center gap-3 h-[60px] px-10 rounded-2xl bg-slate-900 text-white font-bold text-lg transition-all duration-300 hover:bg-red-600 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-1"
              >
                {t('offers.browseInventory')}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OffersPage;
