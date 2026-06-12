import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { favoritesAPI } from '../services/api';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop';

const normalizeImageSrc = (src) => {
  if (!src) return FALLBACK_IMG;
  const cleanSrc = String(src).trim();
  if (!cleanSrc) return FALLBACK_IMG;
  if (/^(https?:|data:|blob:)/i.test(cleanSrc)) return cleanSrc;
  return cleanSrc.startsWith('/') ? cleanSrc : `/${cleanSrc}`;
};

const DashboardFavorites = () => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const fetchFavorites = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await favoritesAPI.getAll();
      const cars = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      console.log('[favorites] dashboard response', {
        count: cars.length,
        car_ids: cars.map(car => car.id),
      });
      setFavorites(cars);
    } catch (err) {
      console.error('[favorites] dashboard fetch failed', err.response?.data || err);
      setError('Unable to load your favorites right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const removeFavorite = async (carId) => {
    setRemovingId(carId);

    try {
      const response = await favoritesAPI.remove(carId);
      console.log('[favorites] dashboard remove response', {
        car_id: carId,
        response: response.data,
      });
      setFavorites(current => current.filter(car => Number(car.id) !== Number(carId)));
    } catch (err) {
      console.error('[favorites] dashboard remove failed', err.response?.data || err);
      alert('Could not remove this favorite. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto h-full flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="w-10 h-10 border-2 border-[#5eead4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto h-full flex flex-col justify-center items-center text-center">
        <div className="bg-[#1b1e2a] p-10 rounded-2xl border border-slate-800/50 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-2">{t('dashboard.favorites')}</h2>
          <p className="text-slate-400 max-w-sm mb-6">{error}</p>
          <button
            onClick={fetchFavorites}
            className="px-5 py-2.5 rounded-lg bg-[#1b3d39] text-[#6ee7b7] border border-[#2a5953] hover:bg-[#214b46] transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto h-full flex flex-col justify-center items-center text-center">
        <div className="bg-[#1b1e2a] p-10 rounded-2xl border border-slate-800/50 shadow-md">
          <svg className="w-16 h-16 text-[#5eead4] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-white mb-2">{t('dashboard.favorites')}</h2>
          <p className="text-slate-400 max-w-sm mb-6">
            {t('dashboard.noFavorites')}
          </p>
          <Link
            to="/cars"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#1b3d39] text-[#6ee7b7] border border-[#2a5953] hover:bg-[#214b46] transition-colors text-sm font-medium"
          >
            {t('dashboard.quickActions.browseCars')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-wide">{t('dashboard.favorites')}</h1>
          <p className="text-slate-400 text-sm mt-1">{favorites.length} saved car{favorites.length === 1 ? '' : 's'}</p>
        </div>
        <Link
          to="/cars"
          className="flex items-center gap-2 bg-[#1b3d39] hover:bg-[#214b46] text-[#6ee7b7] px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[#2a5953] shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('dashboard.quickActions.browseCars')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {favorites.map((car) => {
          const imageSrc = normalizeImageSrc(car.image_url || car.main_image || car.image);

          return (
            <div key={car.id} className="bg-[#161821] rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
              <Link to={`/car/${car.id}`} className="block h-44 bg-slate-900 overflow-hidden">
                <img
                  src={imageSrc}
                  alt={`${car.brand} ${car.model}`}
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMG;
                  }}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </Link>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-white font-semibold text-lg truncate">
                      {car.brand} {car.model}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {car.year} - {car.category || car.type || 'Vehicle'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#5eead4] font-bold">{Number(car.price || 0).toLocaleString()} DH</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <Link
                    to={`/car/${car.id}`}
                    className="flex-1 text-center py-2.5 rounded-lg bg-[#1b3d39] text-[#6ee7b7] border border-[#2a5953] hover:bg-[#214b46] transition-colors text-sm font-medium"
                  >
                    {t('common.viewCar')}
                  </Link>
                  <button
                    onClick={() => removeFavorite(car.id)}
                    disabled={removingId === car.id}
                    className="px-4 py-2.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-wait transition-colors text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardFavorites;
