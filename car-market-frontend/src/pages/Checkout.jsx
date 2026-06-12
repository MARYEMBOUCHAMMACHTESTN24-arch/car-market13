import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { carsAPI, ordersAPI } from '../services/api';

const Checkout = ({ user }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const fetchCar = async () => {
      try {
        const response = await carsAPI.getById(id);
        setCar(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id, user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setForm({ ...form, phone: val });
    if (val && val.length !== 10) {
      setErrors({ ...errors, phone: 'Phone number must contain exactly 10 digits.' });
    } else {
      setErrors({ ...errors, phone: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = t('register.nameRequired');
    if (!form.phone.trim()) {
      newErrors.phone = t('carDetails.phoneRequired');
    } else if (!/^[0-9]{10}$/.test(form.phone)) {
      newErrors.phone = 'Phone number must contain exactly 10 digits.';
    }
    if (!form.email.trim()) newErrors.email = t('register.emailRequired');
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSubmitting(true);
    try {
      await ordersAPI.create({ car_id: car.id, ...form });
      alert(t('checkout.successMessage'));
      navigate('/');
    } catch (error) {
      console.error('Order error:', error);
      alert(t('checkout.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="pt-32 pb-12 max-w-5xl mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-200 animate-pulse h-80 rounded-2xl"></div>
        <div className="bg-gray-200 animate-pulse h-80 rounded-2xl"></div>
      </div>
    </div>
  );

  if (!car) return (
    <div className="pt-32 pb-20 text-center">
      <h1 className="text-3xl font-black font-heading text-gray-800">{t('carDetails.notFound')}</h1>
      <Link to="/cars" className="btn-primary mt-4 inline-block">{t('common.back')}</Link>
    </div>
  );

  return (
    <div className="bg-[#0a0c10] min-h-screen text-white">
      {/* Premium Header */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black font-heading mb-4 tracking-tight">{t('checkout.title')}</h1>
          <div className="flex items-center justify-center gap-3 text-sm font-bold text-gray-500 uppercase tracking-widest">
            <Link to="/" className="hover:text-red-500 transition-colors">{t('navbar.home')}</Link>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
            <Link to="/cars" className="hover:text-red-500 transition-colors">{t('navbar.cars')}</Link>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
            <span className="text-white">{t('checkout.title')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
              <h2 className="text-2xl font-black font-heading mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                {t('checkout.contactInfo')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{t('register.nameLabel')}</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    className={`input-field-dark ${errors.name ? 'ring-2 ring-red-500/50' : ''}`} placeholder={t('register.namePlaceholder')} />
                  {errors.name && <p className="text-red-500 text-xs mt-2 font-bold">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{t('carDetails.phoneNumber')}</label>
                  <input type="text" inputMode="numeric" maxLength={10} pattern="[0-9]*" name="phone" value={form.phone} onChange={handlePhoneChange}
                    className={`input-field-dark ${errors.phone ? 'ring-2 ring-red-500/50' : ''}`} placeholder={t('carDetails.phonePlaceholder')} />
                  {errors.phone && <p className="text-red-500 text-xs mt-2 font-bold">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{t('register.emailLabel')}</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    className={`input-field-dark ${errors.email ? 'ring-2 ring-red-500/50' : ''}`} placeholder={t('register.emailPlaceholder')} />
                  {errors.email && <p className="text-red-500 text-xs mt-2 font-bold">{errors.email}</p>}
                </div>
                <button type="submit" disabled={submitting || (form.phone.length > 0 && form.phone.length !== 10)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl transition-all duration-300 text-lg disabled:opacity-50 shadow-xl shadow-red-600/30 hover:-translate-y-1 active:scale-95">
                  {submitting ? t('checkout.processing') : t('checkout.confirmOrder')}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden sticky top-28 shadow-2xl">
              <div className="relative h-56">
                <img src={car.image || 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=200&fit=crop'} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg mb-2 inline-block shadow-lg shadow-red-600/30">
                    {t('checkout.title')}
                  </span>
                  <h3 className="text-2xl font-black font-heading text-white">{car.brand} {car.model}</h3>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('common.year')}</div>
                    <div className="text-sm font-black">{car.year}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('common.type')}</div>
                    <div className="text-sm font-black">{car.type}</div>
                  </div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-bold">{t('common.price')}</span><span className="font-black">${car.price?.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-bold">{t('checkout.tax')}</span><span className="font-black text-green-500">+$0</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-bold">{t('checkout.delivery')}</span><span className="font-black text-green-500">{t('checkout.free')}</span></div>
                </div>
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{t('checkout.total')}</div>
                    <div className="text-3xl font-black text-red-500 font-heading leading-none">${car.price?.toLocaleString()}</div>
                  </div>
                  <div className="text-white/20">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
