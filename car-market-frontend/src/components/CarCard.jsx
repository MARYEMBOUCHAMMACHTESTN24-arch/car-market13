import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop';

const normalizeImageSrc = (src) => {
  if (!src) return '';

  let cleanSrc = String(src).trim().replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/i, '');
  if (!cleanSrc) return '';

  if (/^(https?:|data:|blob:)/i.test(cleanSrc)) {
    return cleanSrc;
  }

  cleanSrc = cleanSrc.replace(/\\/g, '/').replace(/\/{2,}/g, '/');

  if (cleanSrc.startsWith('/car1/')) return cleanSrc;
  if (cleanSrc.startsWith('car1/')) return `/${cleanSrc}`;
  if (cleanSrc.startsWith('/car/')) return `/car1/${cleanSrc.slice('/car/'.length)}`;
  if (cleanSrc.startsWith('car/')) return `/car1/${cleanSrc.slice('car/'.length)}`;
  if (cleanSrc.startsWith('/cars/')) return `/car1/${cleanSrc.slice('/cars/'.length)}`;
  if (cleanSrc.startsWith('cars/')) return `/car1/${cleanSrc.slice('cars/'.length)}`;
  if (cleanSrc.startsWith('/cars1/')) return `/car1/${cleanSrc.slice('/cars1/'.length)}`;
  if (cleanSrc.startsWith('cars1/')) return `/car1/${cleanSrc.slice('cars1/'.length)}`;

  return cleanSrc.startsWith('/') ? cleanSrc : `/${cleanSrc}`;
};

const CarCard = ({ car, badge, badgeColor = 'bg-red-600' }) => {
  const { t } = useTranslation();

  const title = car.brand && car.model ? `${car.brand} ${car.model}` : (car.name || 'Unknown Car');
  const price = car.price || 0;

  const [imgError, setImgError] = useState(false);

  const imageSrc = useMemo(
    () => normalizeImageSrc(car.image_url || car.main_image || car.image),
    [car.image_url, car.main_image, car.image]
  );

  useEffect(() => {
    setImgError(false);
  }, [car.id, imageSrc]);

  return (
    <div className="group bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 ease-out overflow-hidden flex flex-col h-full border border-[#ECECEC] transform hover:-translate-y-2">
      {/* Image Section */}
      <div className="relative overflow-hidden aspect-[4/3] w-full shrink-0 bg-slate-100">
        <img
          key={`${car.id || title}-${imageSrc}`}
          src={imgError ? FALLBACK_IMG : imageSrc || FALLBACK_IMG}
          alt={`${car.brand} ${car.model}`}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        {/* Modern floating Badges */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          {badge && (
            <span className={`${badgeColor} text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg`}>
              {badge}
            </span>
          )}
          <span className="bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
            {car.year || '2024'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-1 gap-5 bg-white">
        {/* Header: Title on Left, Price on Right */}
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold text-slate-900 mb-1.5 group-hover:text-red-600 transition-colors duration-300 tracking-tight leading-tight line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 text-slate-500">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-widest truncate">{car.brand}</span>
            </div>
          </div>

          <div className="text-right shrink-0 bg-[#F8F9FA] px-4 py-2 rounded-2xl border border-[#ECECEC]">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common.price')}</span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">
                {Number(price)?.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-red-600 uppercase">DH</span>
            </div>
          </div>
        </div>

        {/* Specs as Modern Pills */}
        <div className="flex items-center gap-3 mt-auto pt-2">
          <div className="flex items-center gap-2 bg-[#F8F9FA] group-hover:bg-red-50 px-3.5 py-2.5 rounded-xl flex-1 justify-center transition-colors border border-[#ECECEC] group-hover:border-red-100">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-[10px] font-bold text-slate-600 group-hover:text-red-700 uppercase tracking-widest truncate transition-colors">
              {car.category || car.type || 'Sports'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#F8F9FA] group-hover:bg-red-50 px-3.5 py-2.5 rounded-xl flex-1 justify-center transition-colors border border-[#ECECEC] group-hover:border-red-100">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4" />
            </svg>
            <span className="text-[10px] font-bold text-slate-600 group-hover:text-red-700 uppercase tracking-widest truncate transition-colors">
              {t('common.automatic')}
            </span>
          </div>
        </div>

        {/* Minimal Action Link */}
        <Link
          to={`/car/${car.id}`}
          className="group/btn w-full mt-2 h-[48px] rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 hover:bg-red-600 shadow-sm hover:shadow-red-600/30"
        >
          {t('common.viewDetails')}
          <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default CarCard;
