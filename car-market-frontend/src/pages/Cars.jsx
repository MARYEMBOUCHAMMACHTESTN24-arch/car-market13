import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { carsAPI, v2API } from '../services/api';
import CarCard from '../components/CarCard';

const getCarRenderKey = (car) => {
  if (car.id !== null && car.id !== undefined) {
    return `car-${car.id}`;
  }

  return [
    car.brand,
    car.model,
    car.year,
    car.price,
    car.image_url || car.main_image || car.image
  ].filter(Boolean).join('-');
};

const normalizeBrand = (brand) => String(brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getBrandName = (car) => {
  if (typeof car.brand === 'object' && car.brand !== null) {
    return car.brand.name || car.brand.title || '';
  }

  return car.brand || '';
};

const Cars = () => {
  const { t } = useTranslation();
  const [cars, setCars] = useState([]);
  const [totalCars, setTotalCars] = useState(0);
  const [isServerPaginated, setIsServerPaginated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const carsPerPage = 9;
  const [filters, setFilters] = useState({
    brand: '', category: '', fuel_type: '', transmission: '', minPrice: '', maxPrice: ''
  });
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedBrandParam = searchParams.get('brand') || '';

  useEffect(() => {
    setFilters(prev => (
      prev.brand === selectedBrandParam
        ? prev
        : { ...prev, brand: selectedBrandParam }
    ));
    setCurrentPage(1);
  }, [selectedBrandParam]);

  const buildParams = useCallback(() => {
    const params = {};

    const urlCategory = searchParams.get('category') || searchParams.get('type');
    const urlSearch = searchParams.get('search');
    const urlMaxPrice = searchParams.get('max_price');

    if (selectedBrandParam) params.brand = selectedBrandParam;
    if (urlCategory) params.category = urlCategory;
    if (urlSearch) params.search = urlSearch;
    if (urlMaxPrice) params.max_price = urlMaxPrice;

    if (filters.brand) params.brand = filters.brand;
    if (filters.category) params.category = filters.category;
    if (filters.fuel_type) params.fuel_type = filters.fuel_type;
    if (filters.transmission) params.transmission = filters.transmission;
    if (filters.minPrice) params.min_price = filters.minPrice;
    if (filters.maxPrice) params.max_price = filters.maxPrice;

    return params;
  }, [searchParams, selectedBrandParam, filters]);

  useEffect(() => {
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

  useEffect(() => {
    let cancelled = false;
    const fetchCars = async () => {
      setLoading(true);
      const params = buildParams();

      try {
        const response = await carsAPI.getAll(params);
        if (cancelled) return;
        let carsData = Array.isArray(response.data) ? response.data : [];
        const selectedBrand = params.brand;

        if (selectedBrand) {
          const normalizedSelectedBrand = normalizeBrand(selectedBrand);
          carsData = carsData.filter(car => normalizeBrand(getBrandName(car)) === normalizedSelectedBrand);
        }

        if (sortBy === 'price-low') carsData = [...carsData].sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-high') carsData = [...carsData].sort((a, b) => b.price - a.price);

        setCars(carsData);
        setTotalCars(carsData.length);
        setIsServerPaginated(false);
      } catch (error) {
        console.error('Error fetching cars:', error);
        if (!cancelled) {
            setCars([]);
            setTotalCars(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCars();
    return () => { cancelled = true; };
  }, [buildParams, sortBy, currentPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (value === "") {
        if (name === "maxPrice") newParams.delete("max_price");
        else if (name === "category") {
            newParams.delete("category");
            newParams.delete("type");
        }
        else newParams.delete(name);
    } else {
        if (name === "maxPrice") newParams.set("max_price", value);
        else if (name === "category") newParams.set("category", value);
        else newParams.set(name, value);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({ brand: '', category: '', fuel_type: '', transmission: '', minPrice: '', maxPrice: '' });
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  const totalPages = Math.ceil(totalCars / carsPerPage);
  const paginatedCars = isServerPaginated ? cars : cars.slice((currentPage - 1) * carsPerPage, currentPage * carsPerPage);

  if (loading) {
    return (
      <div className="pt-28 pb-12 max-w-[1400px] mx-auto px-4 lg:px-8 min-h-screen bg-[#F8F9FA]">
        <div className="flex gap-8">
          <div className="w-[280px] hidden lg:block"><div className="bg-slate-200 animate-pulse h-[600px] rounded-[24px]"></div></div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-[24px] shadow-sm overflow-hidden border border-[#ECECEC]">
                <div className="bg-slate-200 animate-pulse h-[260px]"></div>
                <div className="p-6 space-y-4">
                  <div className="bg-slate-200 animate-pulse h-5 w-3/4 rounded-md"></div>
                  <div className="bg-slate-200 animate-pulse h-4 w-1/2 rounded-md"></div>
                  <div className="bg-slate-200 animate-pulse h-12 mt-6 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans selection:bg-red-600/20 selection:text-red-900 pb-16">
      
      {/* High Density Main Content Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        
        {/* Compact Page Header Inline */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">
              <Link to="/" className="hover:text-red-600 transition-colors">{t('navbar.home')}</Link>
              <span>/</span>
              <span className="text-slate-900">{t('navbar.cars')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('cars.title')} <span className="text-slate-400 font-medium text-xl md:text-2xl ml-2">{totalCars} {t('cars.results')}</span>
            </h1>
          </div>
          
          {/* Sort Dropdown now placed directly next to the header on desktop */}
          <div className="flex items-center gap-3 shrink-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('cars.sortBy')}</label>
            <div className="relative">
              <select value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="h-10 pl-4 pr-10 bg-white border border-[#ECECEC] rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all appearance-none cursor-pointer shadow-sm">
                <option value="newest">{t('cars.newest')}</option>
                <option value="price-low">{t('cars.priceLow')}</option>
                <option value="price-high">{t('cars.priceHigh')}</option>
              </select>
              <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters - Compact and Elegant */}
          <aside className="w-full lg:w-[280px] flex-shrink-0">
            <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 sticky top-28 border border-[#ECECEC]">
              <div className="flex items-center justify-between mb-5 pb-5 border-b border-[#F1F3F5]">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  {t('cars.filters')}
                </h2>
                <button onClick={clearFilters} className="text-[10px] font-bold text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors">
                  Clear
                </button>
              </div>

              <div className="space-y-5">
                {/* Brand Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('common.brand')}</label>
                  <select name="brand" value={filters.brand} onChange={handleFilterChange} className="w-full h-11 bg-[#F8F9FA] border border-[#ECECEC] rounded-xl px-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-semibold appearance-none cursor-pointer">
                    <option value="">{t('cars.allBrands')}</option>
                    {availableBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('common.type')}</label>
                  <select name="category" value={filters.category || searchParams.get('category') || searchParams.get('type') || ''} onChange={handleFilterChange} className="w-full h-11 bg-[#F8F9FA] border border-[#ECECEC] rounded-xl px-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-semibold appearance-none cursor-pointer">
                    <option value="">{t('cars.allTypes')}</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('admin.form_fuel') || 'Fuel Type'}</label>
                  <select name="fuel_type" value={filters.fuel_type} onChange={handleFilterChange} className="w-full h-11 bg-[#F8F9FA] border border-[#ECECEC] rounded-xl px-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-semibold appearance-none cursor-pointer">
                    <option value="">{t('cars.allFuelTypes')}</option>
                    <option value="Petrol">{t('cars.fuel_petrol')}</option>
                    <option value="Diesel">{t('cars.fuel_diesel')}</option>
                    <option value="Hybrid">{t('cars.fuel_hybrid')}</option>
                    <option value="Electric">{t('cars.fuel_electric')}</option>
                  </select>
                </div>

                {/* Transmission */}
                <div className="pb-5 border-b border-[#F1F3F5]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t('admin.form_transmission') || 'Transmission'}</label>
                  <select name="transmission" value={filters.transmission} onChange={handleFilterChange} className="w-full h-11 bg-[#F8F9FA] border border-[#ECECEC] rounded-xl px-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-semibold appearance-none cursor-pointer">
                    <option value="">{t('cars.allTransmissions')}</option>
                    <option value="Automatic">{t('cars.trans_auto')}</option>
                    <option value="Manual">{t('cars.trans_manual')}</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t('cars.max')}</label>
                  <div className="flex gap-2 mb-3">
                    <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min" className="w-1/2 h-11 bg-[#F8F9FA] border border-[#ECECEC] rounded-xl px-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-semibold" />
                    <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max" className="w-1/2 h-11 bg-[#F8F9FA] border border-[#ECECEC] rounded-xl px-3 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-semibold" />
                  </div>
                  <input type="range" min="0" max="200000" step="5000" value={filters.maxPrice || 200000} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                    <span>0 DH</span>
                    <span className="text-red-600">{Number(filters.maxPrice || 200000).toLocaleString()} DH</span>
                    <span>200k+ DH</span>
                  </div>
                </div>

                <button onClick={clearFilters} className="w-full h-11 mt-2 rounded-xl bg-slate-900 text-white font-bold text-sm transition-all duration-300 hover:bg-red-600 hover:shadow-lg hover:shadow-red-600/20">
                  {t('cars.clearFilters')}
                </button>
              </div>
            </div>
          </aside>

          {/* Main Grid Container */}
          <div className="flex-1">
            {/* Cars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedCars.map(car => (
                <CarCard
                  key={getCarRenderKey(car)}
                  car={car}
                />
              ))}
            </div>

            {/* Empty State */}
            {cars.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[24px] shadow-sm border border-[#ECECEC]">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">{t('cars.noResults')}</h3>
                <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto">{t('cars.noResultsMessage')}</p>
                <button onClick={clearFilters} className="h-11 px-6 rounded-xl bg-slate-900 text-white font-bold text-sm transition-all duration-300 hover:bg-red-600">
                  {t('cars.clearFilters')}
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl bg-white border border-[#ECECEC] flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-600 shadow-sm disabled:opacity-40 disabled:hover:border-[#ECECEC] disabled:hover:text-slate-400 transition-all font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${page === currentPage ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border-transparent' : 'bg-white border border-[#ECECEC] text-slate-700 hover:border-red-600 hover:text-red-600 shadow-sm'}`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-xl bg-white border border-[#ECECEC] flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-600 shadow-sm disabled:opacity-40 disabled:hover:border-[#ECECEC] disabled:hover:text-slate-400 transition-all font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cars;
