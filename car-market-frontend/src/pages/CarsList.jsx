import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { carsAPI } from '../services/api';

const Icons = {
  search: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>,
  filter: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  export: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  eye: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  edit: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  trash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  car: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
};

const CarsList = ({ showToast }) => {
  const { t, i18n } = useTranslation();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCars, setFilteredCars] = useState([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    price: '',
    year: new Date().getFullYear(),
    category: 'Sedan',
    description: '',
    mileage: '',
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    color: '',
    old_price: '',
    discount_percentage: '',
    is_premium: false,
    is_featured: false,
    is_deal_of_day: false
  });
  const [files, setFiles] = useState({
    main_image: null,
    front_image: null,
    side_image: null,
    rear_image: null,
    interior_image: null
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCars(cars);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCars(cars.filter(c => 
        c.brand.toLowerCase().includes(term) || 
        c.model.toLowerCase().includes(term) ||
        (c.category || '').toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, cars]);

  const loadCars = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await carsAPI.getAdmin();
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCars(data);
      setFilteredCars(data);
    } catch (e) {
      console.error(e.response?.data || e.message);
      const status = e.response?.status;
      const message = status === 403
        ? 'You do not have permission to view cars'
        : status === 401
          ? 'Your session expired. Please sign in again'
          : 'Error loading cars';
      setLoadError(message);
      showToast?.(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle listing?')) return;
    try {
      await carsAPI.delete(id);
      showToast?.('Vehicle listing deleted successfully');
      loadCars();
    } catch (e) {
      showToast?.('Error deleting vehicle', 'error');
    }
  };

  const handleOpenAdd = () => {
    setEditingCar(null);
    setFormData({
      brand: '',
      model: '',
      price: '',
      year: new Date().getFullYear(),
      category: 'Sedan',
      description: '',
      mileage: '',
      fuel_type: 'Petrol',
      transmission: 'Automatic',
      color: '',
      old_price: '',
      discount_percentage: '',
      is_premium: false,
      is_featured: false,
      is_deal_of_day: false
    });
    setFiles({
      main_image: null,
      front_image: null,
      side_image: null,
      rear_image: null,
      interior_image: null
    });
    setShowModal(true);
  };

  const handleOpenEdit = (car) => {
    setEditingCar(car);
    setFormData({
      brand: car.brand || '',
      model: car.model || '',
      price: car.price || '',
      year: car.year || new Date().getFullYear(),
      category: car.category || 'Sedan',
      description: car.description || '',
      mileage: car.mileage || '',
      fuel_type: car.fuel_type || 'Petrol',
      transmission: car.transmission || 'Automatic',
      color: car.color || '',
      old_price: car.old_price || '',
      discount_percentage: car.discount_percentage || '',
      is_premium: Boolean(car.is_premium),
      is_featured: Boolean(car.is_featured),
      is_deal_of_day: Boolean(car.is_deal_of_day)
    });
    setFiles({
      main_image: null,
      front_image: null,
      side_image: null,
      rear_image: null,
      interior_image: null
    });
    setShowModal(true);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Debugging
      console.log('Submitting vehicle listing with values:', {
        is_premium: formData.is_premium,
        is_featured: formData.is_featured,
        is_deal_of_day: formData.is_deal_of_day
      });

      const fd = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'is_premium') {
          fd.append('is_premium', formData.is_premium ? '1' : '0');
        } else if (key === 'is_featured') {
          fd.append('is_featured', formData.is_featured ? '1' : '0');
        } else if (key === 'is_deal_of_day') {
          fd.append('is_deal_of_day', formData.is_deal_of_day ? '1' : '0');
          fd.append('deal_of_day', formData.is_deal_of_day ? '1' : '0');
        } else {
          fd.append(key, formData[key] === null ? '' : formData[key]);
        }
      });
      Object.keys(files).forEach(key => {
        if (files[key]) {
          fd.append(key, files[key]);
        }
      });

      if (editingCar) {
        await carsAPI.update(editingCar.id, fd);
        showToast?.('Vehicle listing updated successfully');
      } else {
        await carsAPI.create(fd);
        showToast?.('Vehicle listing created successfully');
      }
      setShowModal(false);
      loadCars();
    } catch (err) {
      console.error(err);
      showToast?.(err.response?.data?.message || 'Failed to save vehicle listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`}></div>
  );

  const isRtl = i18n.language?.startsWith('ar');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('admin.inventory_title')}</h1>
          <p className="text-slate-500 mt-1">{t('admin.inventory_subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-[#111827] border border-white/5 p-2.5 rounded-xl text-slate-400 hover:text-white transition-all">
            {Icons.export}
          </button>
          <button 
            onClick={handleOpenAdd}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
          >
            {Icons.plus} {t('admin.sidebar_add_car')}
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#111827] rounded-[24px] border border-white/5 shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="relative w-full max-w-md group">
            <span className={`absolute top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors ${isRtl ? 'right-4' : 'left-4'}`}>{Icons.search}</span>
            <input 
              type="text" 
              placeholder={t('admin.inventory_search')} 
              className={`w-full py-2.5 bg-[#0B0F19] border border-white/5 rounded-xl text-sm text-white outline-none focus:border-red-500/30 transition-all ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-[#0B0F19] border border-white/5 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-all">
              {Icons.filter} <span>{t('cars.filters') || 'Filter'}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01]">
                <th className={`py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'pr-8 pl-6 text-right' : 'pl-8 pr-6 text-left'}`}>{t('admin.table_car')}</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.form_category')}</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.table_price')}</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('admin.form_stock')}</th>
                <th className={`py-5 text-xs font-bold text-slate-500 uppercase tracking-widest ${isRtl ? 'text-left pl-8' : 'text-right pr-8'}`}>{t('admin.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan="5" className="px-8 py-4"><Skeleton className="h-14 w-full" /></td></tr>
                ))
              ) : loadError ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-rose-400 font-semibold">{loadError}</td>
                </tr>
              ) : filteredCars.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-500 font-medium">{t('cars.noResults') || 'No Cars Found'}</td>
                </tr>
              ) : (
                filteredCars.map((car, idx) => {
                  const calculatedStock = car.stock !== undefined ? car.stock : (car.id % 5 + 1);
                  // Debug: log each car's image data to verify correct per-car images
                  console.log('[CarsList] car.id:', car.id, '| car.main_image:', car.main_image, '| car.image_url:', car.image_url);
                  // Resolve the image: image_url is the canonical clean relative path from the backend
                  const resolvedImage = car.image_url || car.main_image || null;
                  return (
                    <tr key={car.id || idx} className="hover:bg-white/[0.02] transition-all group">
                      <td className={`py-5 ${isRtl ? 'pr-8 pl-6' : 'pl-8 pr-6'}`}>
                        <div className="flex items-center gap-5">
                          <div className="relative shrink-0">
                            {resolvedImage ? (
                              <img
                                src={resolvedImage}
                                alt={`${car.brand} ${car.model}`}
                                onError={(e) => { e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                className="w-16 h-12 rounded-xl object-cover border border-white/10 group-hover:border-red-500/30 transition-all shadow-lg shadow-black/40"
                              />
                            ) : null}
                            <div
                              style={{ display: resolvedImage ? 'none' : 'flex' }}
                              className="w-16 h-12 rounded-xl border border-white/10 bg-white/5 items-center justify-center text-slate-600 text-[10px] font-bold uppercase tracking-wider"
                            >
                              {car.brand?.charAt(0)}
                            </div>
                            <div className={`absolute -top-2 w-5 h-5 bg-red-600 rounded-full border-2 border-[#111827] flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isRtl ? '-left-2' : '-right-2'}`}>
                              {car.year?.toString().slice(-2)}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-red-500 transition-all text-lg leading-none">{car.brand} {car.model}</p>
                            <p className="text-[11px] text-slate-500 mt-2 font-mono uppercase tracking-tighter">ID: VHL-{car.id?.toString().padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-red-600/10 text-red-500 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-red-500/10">{car.category || 'Sedan'}</span>
                      </td>
                      <td className="px-6 py-5 font-mono font-bold text-white text-lg">{car.price?.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans ml-0.5">DH</span></td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className={`${calculatedStock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{calculatedStock > 0 ? t('admin.inStock').toUpperCase() : t('admin.outOfStock').toUpperCase()}</span>
                            <span className="text-slate-500">{calculatedStock || 0} units</span>
                          </div>
                          <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((calculatedStock || 0) * 20, 100)}%` }}
                              className={`h-full rounded-full ${calculatedStock > 3 ? 'bg-emerald-500' : calculatedStock > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className={`py-5 ${isRtl ? 'text-left pl-8' : 'text-right pr-8'}`}>
                        <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                          <button onClick={() => window.open(`/car/${car.id}`, '_blank')} title="View Listing" className="p-2.5 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10">{Icons.eye}</button>
                          <button onClick={() => handleOpenEdit(car)} title="Edit Details" className="p-2.5 text-red-500 hover:text-white transition-all hover:bg-red-600 rounded-xl border border-red-500/20 hover:border-red-600 shadow-sm">{Icons.edit}</button>
                          <button onClick={() => handleDelete(car.id)} title="Remove Vehicle" className="p-2.5 text-rose-500 hover:text-white transition-all hover:bg-rose-600 rounded-xl border border-rose-500/20 hover:border-rose-600 shadow-sm">{Icons.trash}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provisioning/Editing Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] rounded-[24px] border border-white/5 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <span className="text-red-500">{Icons.car}</span>
                  {editingCar ? `${t('admin.editCar')}: ${editingCar.brand} ${editingCar.model}` : t('admin.addCar')}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors font-bold text-lg">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Grid fields */}
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_brand')} *</label>
                      <input
                        required
                        type="text"
                        value={formData.brand}
                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm"
                        placeholder="e.g. Audi"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_model')} *</label>
                      <input
                        required
                        type="text"
                        value={formData.model}
                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm"
                        placeholder="e.g. RS6 Avant"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_year')} *</label>
                      <input
                        required
                        type="number"
                        value={formData.year}
                        onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm"
                        placeholder="e.g. 2024"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_price')} *</label>
                      <input
                        required
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm"
                        placeholder="e.g. 850000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_category')}</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold"
                      >
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Coupe">Coupe</option>
                        <option value="Cabriolet">Cabriolet</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Wagon">Wagon</option>
                        <option value="Supercar">Supercar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_mileage')} *</label>
                      <input
                        type="number"
                        value={formData.mileage}
                        onChange={e => setFormData({ ...formData, mileage: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm"
                        placeholder="e.g. 15000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_fuel')}</label>
                      <select
                        value={formData.fuel_type}
                        onChange={e => setFormData({ ...formData, fuel_type: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold"
                      >
                        <option value="Petrol">{t('cars.fuel_petrol')}</option>
                        <option value="Diesel">{t('cars.fuel_diesel')}</option>
                        <option value="Electric">{t('cars.fuel_electric')}</option>
                        <option value="Hybrid">{t('cars.fuel_hybrid')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_transmission')}</label>
                      <select
                        value={formData.transmission}
                        onChange={e => setFormData({ ...formData, transmission: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm font-semibold"
                      >
                        <option value="Automatic">{t('cars.trans_auto')}</option>
                        <option value="Manual">{t('cars.trans_manual')}</option>
                        <option value="Dual-Clutch">Dual-Clutch (DCT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_color')}</label>
                      <input
                        type="text"
                        value={formData.color}
                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm"
                        placeholder="e.g. Nardo Grey"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_original_price')}</label>
                      <input
                        type="number"
                        value={formData.old_price}
                        onChange={e => setFormData({ ...formData, old_price: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm"
                        placeholder="e.g. 920000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_discount')}</label>
                      <input
                        type="number"
                        value={formData.discount_percentage}
                        onChange={e => setFormData({ ...formData, discount_percentage: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm"
                        placeholder="e.g. 10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('admin.form_desc')}</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-xl text-white outline-none focus:border-red-500/30 transition-all text-sm h-32 resize-none custom-scrollbar"
                      placeholder="Input standard, high-end vehicle descriptions..."
                    />
                  </div>

                  {/* Images Upload Matrix */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('admin.form_attachments')}</label>
                    <div className="grid grid-cols-5 gap-4">
                      {[
                        { label: t('admin.photo_cover'), field: 'main_image' },
                        { label: t('admin.photo_front'), field: 'front_image' },
                        { label: t('admin.photo_side'), field: 'side_image' },
                        { label: t('admin.photo_rear'), field: 'rear_image' },
                        { label: t('admin.photo_interior'), field: 'interior_image' }
                      ].map((imgInfo, i) => (
                        <div key={i} className="bg-[#0B0F19] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:border-red-500/20 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">{imgInfo.label}</span>
                          <input
                            type="file"
                            id={`file-${imgInfo.field}`}
                            className="hidden"
                            accept="image/*"
                            onChange={e => handleFileChange(e, imgInfo.field)}
                          />
                          <label 
                            htmlFor={`file-${imgInfo.field}`} 
                            className="cursor-pointer bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 hover:bg-white/10 uppercase tracking-widest transition-all"
                          >
                            {files[imgInfo.field] ? t('admin.photo_attached') : t('admin.photo_browse')}
                          </label>
                          {files[imgInfo.field] && (
                            <span className="text-[8px] text-slate-500 truncate w-full mt-2 font-mono block">{files[imgInfo.field].name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Promotion Flags */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('admin.form_flag_matrix')}</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: t('admin.flag_premium'), desc: t('admin.flag_premium_desc'), field: 'is_premium' },
                        { label: t('admin.flag_featured'), desc: t('admin.flag_featured_desc'), field: 'is_featured' },
                        { label: t('admin.flag_deal'), desc: t('admin.flag_deal_desc'), field: 'is_deal_of_day' }
                      ].map((flag, idx) => {
                        const val = formData[flag.field];
                        return (
                          <div 
                            key={idx}
                            onClick={() => setFormData(prev => ({ ...prev, [flag.field]: !val }))}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${val ? 'bg-red-500/10 border-red-500/20' : 'bg-[#0B0F19] border-white/5 hover:border-white/10'}`}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox"
                                checked={!!val}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    [flag.field]: e.target.checked
                                  });
                                }}
                                className="rounded border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0 bg-[#0B0F19] w-4 h-4"
                              />
                              <div>
                                <p className="text-xs font-bold text-white uppercase tracking-wide">{flag.label}</p>
                                <p className="text-[9px] text-slate-500 mt-1 font-semibold leading-tight">{flag.desc}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit / Action Buttons */}
                  <div className="pt-6 border-t border-white/5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 uppercase tracking-widest transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                    >
                      {submitting ? t('common.loading') : editingCar ? t('admin.save_changes') : t('admin.publish')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CarsList;


