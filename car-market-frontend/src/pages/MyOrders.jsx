import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ordersAPI, facturesAPI } from '../services/api';

/* ─────────────────────────────────────────────────────────────────────────
   Status helpers
───────────────────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    dot: 'bg-amber-400',
    badge: 'bg-amber-400/10 text-amber-300 border-amber-500/20',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  approved: {
    label: 'Approuvé',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-500/20',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  rejected: {
    label: 'Rejeté',
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 text-red-300 border-red-500/20',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  cancelled: {
    label: 'Annulé',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-600/20',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

const getStatus = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

const fmtDate = (raw) => {
  if (!raw) return null;
  try {
    return new Date(raw).toLocaleDateString('fr-MA', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return raw; }
};

/* ─────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────── */
const MyOrders = ({ user }) => {
  const { t } = useTranslation();
  const [orders, setOrders]   = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, facturesRes] = await Promise.all([
          ordersAPI.getAll(),
          facturesAPI.getAll().catch(() => ({ data: [] })),
        ]);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setFactures(Array.isArray(facturesRes.data) ? facturesRes.data : []);
      } catch (err) {
        console.error('MyOrders fetch error:', err);
        setError('Impossible de charger vos commandes. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#161821] rounded-2xl h-40 border border-slate-800/60" />
        ))}
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-wide">Mes commandes</h1>
          <p className="text-sm text-slate-500 mt-1">Suivez l'état de vos demandes d'achat.</p>
        </div>
        <Link
          to="/cars"
          className="flex items-center gap-2 bg-[#1b3d39] hover:bg-[#214b46] text-[#6ee7b7] px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border border-[#2a5953] shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle demande
        </Link>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="bg-[#161821] rounded-2xl border border-slate-800/60 p-16 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Aucune commande</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Vous n'avez pas encore soumis de demande d'achat. Parcourez notre catalogue pour trouver votre véhicule.
          </p>
          <Link
            to="/cars"
            className="inline-flex items-center gap-2 bg-[#5eead4] hover:bg-[#4dd9c3] text-[#11131a] font-semibold px-6 py-2.5 rounded-xl transition text-sm"
          >
            Parcourir les véhicules
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const st = getStatus(order.status);
            const facture = factures.find((f) => f.order_id === order.id);
            const carImg = order.car?.image_url || order.car?.image || order.car?.main_image;

            return (
              <div
                key={order.id}
                className="bg-[#161821] border border-slate-800/60 rounded-2xl overflow-hidden"
              >
                {/* ── Main card body ─────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-0">

                  {/* Car image */}
                  <div className="sm:w-48 shrink-0">
                    {carImg ? (
                      <img
                        src={carImg}
                        alt={`${order.car?.brand} ${order.car?.model}`}
                        className="w-full h-40 sm:h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-40 sm:h-full bg-slate-800 flex items-center justify-center">
                        <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4">

                    {/* Left: car + order info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                          Commande #{String(order.id).padStart(5, '0')}
                        </p>
                        <h3 className="text-lg font-bold text-white">
                          {order.car?.brand} {order.car?.model}
                        </h3>
                        <p className="text-sm text-slate-500">{order.car?.year}</p>
                      </div>

                      <div className="text-xl font-black text-[#5eead4]">
                        {Number(order.car?.price || 0).toLocaleString()}
                        <span className="text-sm font-bold text-[#5eead4]/60 ml-1">DH</span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>Demandé le {fmtDate(order.created_at)}</span>
                        {order.phone && <span>· {order.phone}</span>}
                      </div>
                    </div>

                    {/* Right: status + actions */}
                    <div className="flex flex-col gap-3 sm:items-end justify-between sm:min-w-[160px]">

                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${st.badge}`}>
                        {st.icon}
                        {st.label}
                      </span>

                      {/* Status description */}
                      <p className="text-xs text-slate-500 sm:text-right">
                        {order.status === 'pending' && 'Votre demande est en cours d\'examen par notre équipe.'}
                        {order.status === 'approved' && 'Votre demande a été approuvée !'}
                        {order.status === 'rejected' && 'Votre demande n\'a pas pu être acceptée.'}
                        {order.status === 'cancelled' && 'Cette commande a été annulée.'}
                      </p>

                      {/* Action buttons — read-only */}
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <Link
                          to={`/car/${order.car_id}`}
                          className="text-center px-4 py-2 border border-slate-700/50 hover:border-[#5eead4]/40 text-slate-400 hover:text-[#5eead4] rounded-xl text-xs font-medium transition"
                        >
                          Voir le véhicule
                        </Link>

                        {/* Invoice button — only if approved and facture exists */}
                        {order.status === 'approved' && facture && (
                          <Link
                            to={`/invoice/${facture.id}`}
                            className="text-center px-4 py-2 bg-[#5eead4] hover:bg-[#4dd9c3] text-[#11131a] rounded-xl text-xs font-bold transition flex justify-center items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Voir la facture
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Appointment Information (Premium Compact Design) ──────────────────── */}
                {order.appointment_date && (
                  <div className="relative overflow-hidden mt-4 mx-4 mb-4 rounded-xl bg-gradient-to-r from-[#213f3b]/90 to-[#1b332f] border border-[#5eead4]/20 shadow-md">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#5eead4]/10 blur-2xl pointer-events-none -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#5eead4]/5 blur-xl pointer-events-none -ml-8 -mb-8"></div>

                    <div className="relative p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                        
                        {/* Title Area */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5eead4] to-[#34d399] flex items-center justify-center text-[#11131a] shadow-lg shadow-[#5eead4]/20 shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white tracking-wide">Rendez-vous Programmé</h4>
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                                Confirmé
                              </span>
                            </div>
                            <p className="text-[#5eead4]/80 text-[10px] mt-0.5 flex items-center gap-1 font-semibold uppercase tracking-wider">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Géré par notre équipe
                            </p>
                          </div>
                        </div>

                        {/* Divider for desktop */}
                        <div className="hidden lg:block w-px h-10 bg-[#5eead4]/20 shrink-0"></div>

                        {/* Details Row */}
                        <div className="flex-1 flex flex-wrap md:flex-nowrap items-start gap-x-6 gap-y-4">
                          
                          {/* Date */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#5eead4]/10 flex items-center justify-center text-[#5eead4] shrink-0">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Date</p>
                              <p className="text-sm font-bold text-white whitespace-nowrap">{fmtDate(order.appointment_date)}</p>
                            </div>
                          </div>

                          {/* Time */}
                          {order.appointment_time && (
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#5eead4]/10 flex items-center justify-center text-[#5eead4] shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Heure</p>
                                <p className="text-sm font-bold text-[#5eead4] whitespace-nowrap">{order.appointment_time.substring(0, 5)}</p>
                              </div>
                            </div>
                          )}

                          {/* Location */}
                          {order.appointment_location && (
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#5eead4]/10 flex items-center justify-center text-[#5eead4] shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Lieu</p>
                                <p className="text-sm font-semibold text-white whitespace-nowrap">{order.appointment_location}</p>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {order.appointment_note && (
                            <div className="flex items-start gap-2.5 md:ml-auto max-w-[240px]">
                              <div className="w-8 h-8 rounded-lg bg-[#5eead4]/10 flex items-center justify-center text-[#5eead4] shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Notes</p>
                                <p className="text-xs font-medium text-slate-300 italic leading-snug">
                                  {order.appointment_note}
                                </p>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>

                      {/* Confirmation Message */}
                      <div className="mt-4 pt-3 border-t border-[#5eead4]/10 flex items-center gap-2 text-emerald-400 text-[11px] font-bold tracking-wide">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Votre rendez-vous a été confirmé par notre équipe.
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Pending appointment notice ─────────────────────── */}
                {order.status === 'approved' && !order.appointment_date && (
                  <div className="border-t border-slate-800/60 bg-amber-400/5 px-5 py-3 flex items-center gap-3 text-xs text-amber-400/80">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Notre équipe vous contactera bientôt pour planifier votre rendez-vous au showroom.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
