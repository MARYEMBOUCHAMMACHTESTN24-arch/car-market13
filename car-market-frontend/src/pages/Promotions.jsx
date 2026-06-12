import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { offersAPI } from '../services/api';

const resolveImg = (path) => {
  if (!path || path.trim() === '') return null;
  let url = path.replace(/https?:\/\/(127\.0\.0\.1|localhost):\d+/, '');
  if (url && !url.startsWith('/') && !url.startsWith('http')) {
    url = '/' + url;
  }
  return url;
};


const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.error('Failed to load premium offers', error);
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
    const price = Number(offer.car?.price || 0);
    const discount = Number(offer.discount || 0);

    if (offer.discount_type === 'fixed') {
      return Math.max(price - discount, 0);
    }

    return Math.max(price - (price * discount / 100), 0);
  };

  const formatDiscount = (offer) => {
    const discount = Number(offer.discount || 0);

    return offer.discount_type === 'fixed'
      ? `${discount.toLocaleString()} DH OFF`
      : `${discount.toLocaleString()}% OFF`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-rose-900 rounded-full flex items-center justify-center relative">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          <span className="text-rose-500 text-xs font-bold uppercase tracking-widest animate-pulse">Loading</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-200">
      <section className="pt-28 pb-12 bg-slate-950">
        <div className="container mx-auto px-6">
          <span className="text-red-500 text-xs font-bold uppercase tracking-[0.25em]">Offers</span>
          <h1 className="mt-4 text-4xl md:text-6xl font-black tracking-tight text-white">Current Offers</h1>
        </div>
      </section>

      {offers.length > 0 && (
        <main className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {offers.map((offer) => {
              const car = offer.car || {};
              const originalPrice = Number(car.price || 0);
              const finalPrice = calculatePrice(offer);

              return (
                <article key={offer.id} className="group overflow-hidden rounded-2xl bg-white text-slate-950 shadow-xl shadow-black/20">
                  <div className="relative h-56 overflow-hidden bg-slate-800">
                    {resolveImg(car.image_url || car.main_image) ? (
                      <img
                        src={resolveImg(car.image_url || car.main_image)}
                        alt={`${car.brand || ''} ${car.model || ''}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-bold uppercase tracking-widest text-slate-500">
                        AutoMarket
                      </div>
                    )}
                    <div className="absolute left-4 top-4 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                      {formatDiscount(offer)}
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                      {car.brand} {car.model}
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{offer.title}</h2>
                    {offer.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{offer.description}</p>
                    )}

                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-400 line-through">{originalPrice.toLocaleString()} DH</p>
                        <p className="text-2xl font-black text-red-600">{Math.round(finalPrice).toLocaleString()} DH</p>
                      </div>
                      <Link
                        to={`/car/${car.id}`}
                        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600"
                      >
                        View Car
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
};

export default OffersPage;
