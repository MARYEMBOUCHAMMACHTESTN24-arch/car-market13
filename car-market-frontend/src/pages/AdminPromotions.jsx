import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { carsAPI, offersAPI } from '../services/api';

const emptyForm = {
  title: '',
  description: '',
  discount_price: '',
  car_id: '',
  is_active: true,
  is_premium: false,
  image: '',
  start_date: '',
  end_date: '',
};

const MIN_PROMO_DISCOUNT = 3;
const MAX_PROMO_DISCOUNT = 18;

const promoPriceBounds = (price) => {
  const amount = Number(price || 0);
  if (!amount) {
    return { min: 0, max: undefined };
  }

  return {
    min: Math.round(amount * (1 - MAX_PROMO_DISCOUNT / 100)),
    max: Math.round(amount * (1 - MIN_PROMO_DISCOUNT / 100)),
  };
};

const resolveImg = (path) => {
  if (!path || path.trim() === '') return null;
  let url = path.replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/, '');
  if (url && !url.startsWith('/') && !url.startsWith('http')) url = '/' + url;
  return url;
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const toApiDate = (value) => value ? new Date(value).toISOString() : '';
const money = (value) => `${Number(value || 0).toLocaleString()} DH`;

const statusFor = (offer, now = new Date()) => {
  const start = new Date(offer.start_date);
  const end = new Date(offer.end_date);
  if (!offer.is_active) return { key: 'inactive', labelKey: 'statusInactive', className: 'bg-slate-700 text-slate-200' };
  if (Number.isNaN(end.getTime()) || end < now) return { key: 'expired', labelKey: 'statusExpired', className: 'bg-rose-500/15 text-rose-300' };
  if (!Number.isNaN(start.getTime()) && start > now) return { key: 'scheduled', labelKey: 'statusScheduled', className: 'bg-amber-500/15 text-amber-200' };
  return { key: 'active', labelKey: 'statusActive', className: 'bg-emerald-500/15 text-emerald-300' };
};

const Toggle = ({ checked, onChange, isRtl = false }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-red-600' : 'bg-slate-700'}`}
  >
    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? (isRtl ? 'right-4' : 'left-4') : (isRtl ? 'right-0.5' : 'left-0.5')}`} />
  </button>
);

export default function AdminPromotions({ showToast }) {
  const { t, i18n } = useTranslation();
  const [offers, setOffers] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [activeOnly, setActiveOnly] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [now, setNow] = useState(new Date());
  const isRtl = i18n.language?.startsWith('ar');

  const selectedCar = cars.find(car => String(car.id) === String(form.car_id));
  const previewImage = imagePreview || resolveImg(form.image) || resolveImg(selectedCar?.image_url || selectedCar?.main_image);
  const discountPriceBounds = promoPriceBounds(selectedCar?.price);
  const formDiscountPercentage = selectedCar?.price && form.discount_price
    ? Math.max(0, Math.min(100, ((Number(selectedCar.price) - Number(form.discount_price)) / Number(selectedCar.price)) * 100))
    : 0;
  const carName = (car) => car
    ? (`${car.brand || ''} ${car.model || ''}`.trim() || t('offers.carFallback', { id: car.id }))
    : t('offers.noCarLinked');

  const load = async () => {
    try {
      setLoading(true);
      const [offersRes, carsRes] = await Promise.all([offersAPI.getAdmin(), carsAPI.getAdmin()]);
      setOffers(Array.isArray(offersRes.data) ? offersRes.data : (offersRes.data?.data || []));
      setCars(Array.isArray(carsRes.data) ? carsRes.data : (carsRes.data?.data || []));
    } catch (error) {
      console.error(error);
      showToast?.(t('offers.failedLoad'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const active = offers.filter(offer => statusFor(offer, now).key === 'active').length;
    const expired = offers.filter(offer => statusFor(offer, now).key === 'expired').length;
    const revenueImpact = offers.reduce((sum, offer) => {
      const original = Number(offer.original_price || offer.car?.price || 0);
      const discounted = Number(offer.discount_price || 0);
      return sum + Math.max(original - discounted, 0);
    }, 0);
    const premiumCars = new Set(offers.filter(o => o.car?.is_premium || o.is_premium).map(o => o.car_id || o.car?.id).filter(Boolean)).size;
    return { total: offers.length, active, expired, revenueImpact, premiumCars };
  }, [offers, now]);

  const filteredOffers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...offers]
      .filter((offer) => {
        const status = statusFor(offer, now).key;
        const text = `${offer.title} ${offer.description || ''} ${offer.car?.brand || ''} ${offer.car?.model || ''}`.toLowerCase();
        return (!term || text.includes(term)) &&
          (statusFilter === 'all' || status === statusFilter) &&
          (!activeOnly || status === 'active');
      })
      .sort((a, b) => {
        if (sortBy === 'discount') return Number(b.discount_percentage || 0) - Number(a.discount_percentage || 0);
        if (sortBy === 'ending') return new Date(a.end_date) - new Date(b.end_date);
        return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
      });
  }, [offers, search, statusFilter, sortBy, activeOnly, now]);

  const openCreate = (car = null) => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 7);
    const price = Number(car?.price || 0);
    setEditingOffer(null);
    setForm({
      ...emptyForm,
      title: car ? `${carName(car)} ${t('offers.offerSuffix')}` : '',
      description: car ? t('offers.limitedOfferFor', { car: carName(car) }) : '',
      car_id: car?.id || '',
      discount_price: price ? Math.round(price * 0.9) : '',
      is_premium: !!car?.is_premium,
      start_date: toDateTimeLocal(start),
      end_date: toDateTimeLocal(end),
    });
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title || '',
      description: offer.description || '',
      discount_price: offer.discount_price || '',
      car_id: offer.car_id || offer.car?.id || '',
      is_active: !!offer.is_active,
      is_premium: !!offer.is_premium || !!offer.car?.is_premium,
      image: offer.image || '',
      start_date: toDateTimeLocal(offer.start_date),
      end_date: toDateTimeLocal(offer.end_date),
    });
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const payload = () => {
    const data = new FormData();
    data.append('title', form.title);
    data.append('description', form.description || '');
    data.append('discount_price', Number(form.discount_price || 0));
    data.append('car_id', Number(form.car_id));
    data.append('is_active', form.is_active ? '1' : '0');
    data.append('is_premium', form.is_premium ? '1' : '0');
    data.append('start_date', toApiDate(form.start_date));
    data.append('end_date', toApiDate(form.end_date));
    data.append('image', imageFile || form.image || '');
    return data;
  };

  const saveOffer = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (editingOffer) {
        await offersAPI.update(editingOffer.id, payload());
        showToast?.(t('offers.updatedSuccess'));
      } else {
        await offersAPI.create(payload());
        showToast?.(t('offers.createdSuccess'));
      }
      setModalOpen(false);
      await load();
    } catch (error) {
      console.error(error);
      showToast?.(error.response?.data?.message || t('offers.failedSave'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (offer) => {
    try {
      await offersAPI.update(offer.id, {
        title: offer.title,
        description: offer.description || '',
        discount_price: offer.discount_price,
        car_id: offer.car_id,
        is_active: !offer.is_active,
        is_premium: !!offer.is_premium,
        start_date: offer.start_date,
        end_date: offer.end_date,
      });
      await load();
    } catch (error) {
      console.error(error);
      showToast?.(t('offers.failedStatus'), 'error');
    }
  };

  const togglePremium = async (offer) => {
    if (!offer.car?.id) return;
    try {
      const res = await carsAPI.togglePremium(offer.car.id, !offer.car.is_premium);
      const updatedCar = res.data;
      setOffers(current => current.map(item => item.car?.id === updatedCar.id ? { ...item, car: updatedCar } : item));
      setCars(current => current.map(car => car.id === updatedCar.id ? updatedCar : car));
    } catch (error) {
      console.error(error);
      showToast?.(t('offers.failedPremium'), 'error');
    }
  };

  const deleteOffer = async () => {
    if (!deleteTarget) return;
    try {
      await offersAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      showToast?.(t('offers.deletedSuccess'));
      await load();
    } catch (error) {
      console.error(error);
      showToast?.(t('offers.failedDelete'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-10 text-center text-sm font-bold text-slate-400">
        {t('offers.loadingAdmin')}
      </div>
    );
  }

  return (
    <div className={`min-w-0 bg-[#020617] ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white md:text-3xl">{t('offers.management')}</h1>
            <p className="mt-1 text-sm text-slate-400">{t('offers.managementSubtitle')}</p>
          </div>
          <button onClick={() => openCreate()} className="h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-4 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500">
            {t('offers.createOffer')}
          </button>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            [t('offers.totalOffers'), stats.total],
            [t('offers.activeOffers'), stats.active],
            [t('offers.expired'), stats.expired],
            [t('offers.revenueImpact'), money(stats.revenueImpact)],
            [t('offers.premiumCars'), stats.premiumCars],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[#111827] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-2 text-xl font-black text-white">{value}</p>
              <div className="mt-2 h-1 rounded-full bg-slate-800">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-red-600 to-rose-400" />
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111827] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('offers.searchPlaceholder')}
              className="h-10 min-w-[240px] flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-red-500/50"
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-white outline-none sm:w-40">
              <option value="all">{t('offers.allStatuses')}</option>
              <option value="active">{t('offers.statusActive')}</option>
              <option value="scheduled">{t('offers.statusScheduled')}</option>
              <option value="inactive">{t('offers.statusInactive')}</option>
              <option value="expired">{t('offers.statusExpired')}</option>
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-white outline-none sm:w-40">
              <option value="newest">{t('offers.sortNewest')}</option>
              <option value="discount">{t('offers.sortHighestDiscount')}</option>
              <option value="ending">{t('offers.sortEndingSoon')}</option>
            </select>
            <button onClick={() => setActiveOnly(value => !value)} className={`h-10 w-full rounded-xl border px-3 text-xs font-black uppercase tracking-[0.12em] sm:w-auto ${activeOnly ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-slate-950 text-slate-400'}`}>
              {t('offers.activeOnly')}
            </button>
          </div>
        </section>

        {filteredOffers.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white">{t('offers.noOffersFound')}</h2>
                <p className="text-sm text-slate-400">{t('offers.startFromCar')}</p>
              </div>
              <button onClick={() => openCreate()} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white">{t('offers.createOffer')}</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cars.slice(0, 8).map((car) => (
                <button key={car.id} onClick={() => openCreate(car)} className="overflow-hidden rounded-xl border border-white/10 bg-slate-950 text-left transition hover:border-red-500/40">
                  <img src={resolveImg(car.image_url || car.main_image) || 'https://placehold.co/400x260'} alt={carName(car)} className="h-28 w-full object-cover" />
                  <div className="p-3">
                    <p className="truncate text-sm font-black text-white">{carName(car)}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{money(car.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="grid gap-2">
            {filteredOffers.map((offer, index) => {
              const status = statusFor(offer, now);
              const image = resolveImg(offer.image_url || offer.image || offer.car?.image_url || offer.car?.main_image);
              return (
                <motion.article
                  key={offer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#111827] shadow-sm transition hover:-translate-y-0.5 hover:border-red-500/30 hover:shadow-red-950/20 sm:grid-cols-[118px_minmax(0,1fr)] lg:grid-cols-[140px_minmax(0,1fr)]"
                >
                  <div className="relative h-28 bg-slate-950 sm:h-full sm:min-h-[104px]">
                    <img src={image || 'https://placehold.co/500x320'} alt={carName(offer.car)} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className={`absolute top-1.5 rounded-md bg-gradient-to-r from-red-600 to-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white ${isRtl ? 'right-1.5' : 'left-1.5'}`}>
                      {Number(offer.discount_percentage || 0).toFixed(0)}% {t('offers.off')}
                    </span>
                    <span className={`absolute top-1.5 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase ${isRtl ? 'left-1.5' : 'right-1.5'} ${status.className}`}>
                      {t(`offers.${status.labelKey}`)}
                    </span>
                    {(offer.car?.is_premium || offer.is_premium) && (
                      <span className={`absolute bottom-1.5 rounded-md bg-amber-300 px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-950 ${isRtl ? 'left-1.5' : 'right-1.5'}`}>{t('offers.premium')}</span>
                    )}
                  </div>
                  <div className="min-w-0 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13px] font-black leading-tight text-white md:text-sm">{carName(offer.car)}</h3>
                        <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{offer.title}</p>
                      </div>
                      <Toggle checked={!!offer.is_active} onChange={() => toggleActive(offer)} isRtl={isRtl} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/5 bg-slate-950/70 px-2.5 py-1.5 text-[11px]">
                      <span className="min-w-0 text-slate-500">
                        <span className="font-black uppercase tracking-wider">{t('offers.original')}:</span>{' '}
                        <span className="font-bold text-slate-300 line-through">{money(offer.original_price || offer.car?.price)}</span>
                      </span>
                      <span className="min-w-0 text-red-300">
                        <span className="font-black uppercase tracking-wider">{t('offers.offer')}:</span>{' '}
                        <span className="font-black text-white">{money(offer.discount_price)}</span>
                      </span>
                      <span className="min-w-0 text-emerald-300">
                        <span className="font-black uppercase tracking-wider">{t('offers.off')}:</span>{' '}
                        <span className="font-black">{Number(offer.discount_percentage || 0).toFixed(2)}%</span>
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-semibold text-slate-500">
                      <span>{t('offers.ends')} {new Date(offer.end_date).toLocaleDateString(i18n.language)}</span>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => openEdit(offer)} aria-label={t('offers.edit')} title={t('offers.edit')} className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-slate-200 transition hover:bg-red-600 hover:text-white">
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(offer)} aria-label={t('offers.delete')} title={t('offers.delete')} className="grid h-6 w-6 place-items-center rounded-md bg-rose-500/10 text-rose-300 transition hover:bg-rose-600 hover:text-white">
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></svg>
                        </button>
                        <button type="button" onClick={() => togglePremium(offer)} aria-label={offer.car?.is_premium ? t('offers.unpremium') : t('offers.premium')} title={offer.car?.is_premium ? t('offers.unpremium') : t('offers.premium')} className="grid h-6 w-6 place-items-center rounded-md bg-amber-300/10 text-amber-200 transition hover:bg-amber-300 hover:text-slate-950">
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><path d="m12 2 2.8 6 6.5.8-4.8 4.5 1.2 6.4L12 16.5 6.3 19.7l1.2-6.4L2.7 8.8 9.2 8Z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </section>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onSubmit={saveOffer}
              className="grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="min-h-0">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <h2 className="text-lg font-black text-white">{editingOffer ? t('offers.editOffer') : t('offers.createOffer')}</h2>
                  <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-black text-slate-300">{t('offers.close')}</button>
                </div>
                <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t('offers.titleField')}</span>
                      <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t('offers.carField')}</span>
                      <select required value={form.car_id} onChange={e => {
                        const car = cars.find(item => String(item.id) === e.target.value);
                        setForm({ ...form, car_id: e.target.value, is_premium: !!car?.is_premium });
                      }} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                        <option value="">{t('offers.selectCar')}</option>
                        {cars.map(car => <option key={car.id} value={car.id}>{carName(car)} ({money(car.price)})</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t('offers.description')}</span>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t('offers.originalPrice')}</span>
                      <input disabled value={selectedCar ? money(selectedCar.price) : t('offers.selectCar')} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-400 outline-none" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t('offers.discountedPrice')}</span>
                      <input
                        required
                        type="number"
                        min={discountPriceBounds.min}
                        max={discountPriceBounds.max}
                        value={form.discount_price}
                        onChange={e => setForm({ ...form, discount_price: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      />
                    </label>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                    <p className="text-xs font-black uppercase tracking-widest text-red-300">{t('offers.calculatedDiscount')}</p>
                    <p className="mt-1 text-xl font-black text-white">{formDiscountPercentage.toFixed(2)}%</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input required type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
                    <input required type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 p-3 text-sm font-bold text-white">
                      {t('offers.statusActive')} <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="h-5 w-5 accent-red-600" />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 p-3 text-sm font-bold text-white">
                      {t('offers.premium')} <input type="checkbox" checked={form.is_premium} onChange={e => setForm({ ...form, is_premium: e.target.checked })} className="h-5 w-5 accent-red-600" />
                    </label>
                  </div>
                  <label className="block rounded-xl border border-dashed border-white/10 bg-slate-950 p-4 text-center text-xs font-black uppercase tracking-widest text-slate-500">
                    {t('offers.uploadImage')}
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }} />
                  </label>
                </div>
                <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-slate-300">{t('offers.cancel')}</button>
                  <button disabled={submitting} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white disabled:opacity-60">{submitting ? t('offers.saving') : t('offers.saveOffer')}</button>
                </div>
              </div>
              <aside className="border-t border-white/10 bg-slate-950 p-5 lg:border-l lg:border-t-0">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('offers.preview')}</p>
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
                  <img src={previewImage || 'https://placehold.co/500x320'} alt="" className="h-44 w-full object-cover" />
                  <div className="p-4">
                    <p className="font-black text-white">{selectedCar ? carName(selectedCar) : t('offers.selectCar')}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <span className="rounded-lg bg-slate-950 p-3 text-slate-400">{selectedCar ? money(selectedCar.price) : money(0)}</span>
                      <span className="rounded-lg bg-red-500/10 p-3 font-black text-white">{money(form.discount_price)}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </motion.form>
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
              <h2 className="text-xl font-black text-white">{t('offers.deleteOfferTitle')}</h2>
              <p className="mt-2 text-sm text-slate-400">{t('offers.deleteOfferMessage', { title: deleteTarget.title })}</p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setDeleteTarget(null)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-slate-300">{t('offers.cancel')}</button>
                <button onClick={deleteOffer} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white">{t('offers.delete')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
