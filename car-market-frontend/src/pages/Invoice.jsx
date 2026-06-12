import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { facturesAPI } from '../services/api';

/* ─────────────────────────────────────────────────────────────────────────
   Helper utilities
───────────────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 });

const fmtDate = (raw) => {
  if (!raw) return null;
  try {
    return new Date(raw).toLocaleDateString('fr-MA', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
};

const fmtTime = (raw) => {
  if (!raw) return null;
  // raw may be "14:00" or "14:00:00"
  return raw.substring(0, 5);
};

const StatusBadge = ({ status }) => {
  const map = {
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    pending: 'bg-amber-100 text-amber-700 border-amber-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300',
  };
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
        map[status] || map.pending
      }`}
    >
      {status || 'pending'}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Invoice Page
───────────────────────────────────────────────────────────────────────── */
const Invoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await facturesAPI.getById(id);
        setInvoice(res.data);
      } catch (err) {
        console.error('Invoice fetch error:', err.response?.data || err.message);
        setError(
          err.response?.status === 403
            ? 'You do not have permission to view this invoice.'
            : err.response?.status === 404
            ? 'Invoice not found.'
            : 'Failed to load invoice. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  /* ── Loading ── */
  const [pdfLoading, setPdfLoading] = useState(false);

  /* ── PDF Generation (Backend DomPDF) ────────────────────────────────────── */
  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      await facturesAPI.downloadPdf(invoice.id, invoice.invoice_number);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Impossible de générer le PDF. Veuillez réessayer.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Loading invoice…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600/10 rounded-full mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invoice Not Found</h1>
          <p className="text-gray-400 mb-8">{error || 'The requested invoice could not be loaded.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-semibold transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── Data extraction ── */
  const order   = invoice.order   || {};
  const car     = invoice.vehicle || {};
  const client  = invoice.client  || {};

  const clientName  = client.name  || order.name  || '—';
  const clientEmail = client.email || order.email || '—';
  const clientPhone = client.phone || order.phone || '—';
  const clientAddr  = client.address || order.address || '—';

  const carImage = car.image_url || car.image || null;
  const carName  = car.brand && car.model ? `${car.brand} ${car.model}` : '—';

  // Appointment — prefer order-level fields, fallback to facture appointment_date
  const apptDate = order.appointment_date || null;
  const apptTime = order.appointment_time ? fmtTime(order.appointment_time) : null;
  const apptLoc  = order.appointment_location || null;
  const apptDisplayDate = fmtDate(apptDate);
  const apptDisplay = apptDisplayDate
    ? apptDisplayDate + (apptTime ? ` à ${apptTime}` : '')
    : fmtDate(invoice.appointment_date) || 'Non planifié';

  const DOCS = [
    { icon: '🪪', label: 'CIN / Carte d\'identité nationale (valide)' },
    { icon: '💳', label: 'Preuve de paiement / Reçu de virement bancaire' },
    { icon: '📄', label: 'Contrat d\'achat signé' },
    { icon: '🚗', label: 'Permis de conduire (valide)' },
    { icon: '🛡️', label: 'Documents d\'assurance (si requis)' },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          PRINT STYLES — injected inline for reliability
      ═══════════════════════════════════════════════════════════════════ */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #fff !important; margin: 0; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; }
          .print-break-inside { page-break-inside: avoid; break-inside: avoid; }
          @page { size: A4; margin: 15mm 15mm; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE WRAPPER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="min-h-screen bg-gray-950 pt-32 pb-12 print:bg-white print:py-0">
        <div className="max-w-4xl mx-auto px-4 print:max-w-none print:px-0">

          {/* ── Action Bar ─────────────────────────────────────────────── */}
          <div className="no-print flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg disabled:opacity-60 disabled:cursor-wait"
              >
                {pdfLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Génération...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-red-900/30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                </svg>
                Print Invoice
              </button>
              <Link
                to="/admin-dashboard"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-5 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* ── Invoice Document ─────────────────────────────────────────── */}
          <div className="print-page bg-white text-gray-900 shadow-2xl overflow-hidden" id="invoice-print">

            {/* ════════════════════════════════════════
                HEADER BAND
            ════════════════════════════════════════ */}
            <div className="bg-gray-900 px-10 pt-10 pb-8 print:bg-gray-900">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6">

                {/* Brand */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img 
                      src="/logo/logo-horizontal-dark.svg" 
                      alt="AutoMark Logo" 
                      className="h-10"
                    />
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    <p>123 AutoMarket Boulevard, Casablanca 20000</p>
                    <p>+212 522 000 000 · contact@automarket.ma</p>
                    <p>www.automarket.ma · RC: 12345 · ICE: 000000000000000</p>
                  </div>
                </div>

                {/* Invoice Meta */}
                <div className="text-right shrink-0">
                  <p className="text-4xl font-black text-white uppercase tracking-widest mb-1">Facture</p>
                  <p className="text-sm font-mono text-red-400 mb-4">{invoice.invoice_number}</p>

                  <div className="inline-block text-left bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs space-y-2 min-w-[190px]">
                    <div className="flex justify-between gap-6">
                      <span className="text-gray-500">Date d'émission</span>
                      <span className="text-white font-semibold">{fmtDate(invoice.created_at) || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span className="text-gray-500">Rendez-vous</span>
                      <span className="text-white font-semibold">{apptDisplay}</span>
                    </div>
                    {apptLoc && (
                      <div className="flex justify-between gap-6">
                        <span className="text-gray-500">Lieu</span>
                        <span className="text-white font-semibold">{apptLoc}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-6 pt-2 border-t border-white/10">
                      <span className="text-gray-500">Statut paiement</span>
                      <StatusBadge status={invoice.payment_status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════
                BODY
            ════════════════════════════════════════ */}
            <div className="px-10 py-8 space-y-8">

              {/* ── Client + Purchase Details ── */}
              <div className="print-break-inside grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Client */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-3">Facturé à</p>
                  <p className="text-xl font-black text-gray-900 leading-tight mb-1">{clientName}</p>
                  <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <span>{clientEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{clientPhone}</span>
                    </div>
                    {clientAddr && clientAddr !== '—' && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{clientAddr}</span>
                      </div>
                    )}
                    {client.id && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 mt-2">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-gray-500">Client ID: <strong className="text-gray-900">#{client.id}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase Details */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-3">Détails de la commande</p>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'N° de commande', value: order.id ? `#${String(order.id).padStart(5, '0')}` : '—' },
                      { label: 'N° de facture', value: invoice.invoice_number },
                      { label: 'Date de la demande', value: fmtDate(order.created_at) || '—' },
                      { label: 'Rendez-vous', value: apptDisplay },
                      apptLoc && { label: 'Lieu', value: apptLoc },
                    ].filter(Boolean).map((row) => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-gray-500">{row.label}</span>
                        <span className="font-semibold text-gray-900">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Vehicle Section ── */}
              <div className="print-break-inside">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-100" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Véhicule</p>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="flex flex-col sm:flex-row gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  {/* Image */}
                  <div className="shrink-0">
                    {carImage ? (
                      <img
                        src={carImage}
                        alt={carName}
                        className="w-full sm:w-52 h-36 object-cover rounded-xl border border-gray-200 shadow-sm"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full sm:w-52 h-36 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Specs */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-900 mb-0.5">{carName}</h3>
                    <p className="text-sm text-gray-500 mb-4">Année {car.year || '—'}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {[
                        { icon: '⛽', label: 'Carburant', value: car.fuel_type },
                        { icon: '⚙️', label: 'Transmission', value: car.transmission },
                        { icon: '📍', label: 'Kilométrage', value: car.mileage ? `${Number(car.mileage).toLocaleString()} km` : null },
                        { icon: '🎨', label: 'Couleur', value: car.color },
                        { icon: '🏷️', label: 'Catégorie', value: car.type || car.category?.name },
                        { icon: '🌍', label: 'Ville', value: car.city },
                      ].map((s) =>
                        s.value ? (
                          <div key={s.label} className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider">{s.icon} {s.label}</p>
                            <p className="font-semibold text-gray-900 capitalize mt-0.5">{s.value}</p>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Financial Summary ── */}
              <div className="print-break-inside">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-100" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Résumé financier</p>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Prix de base du véhicule</span>
                      <span className="font-semibold">{fmt(car.price)} DH</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Frais de traitement et documentation</span>
                      <span className="font-semibold">1 500,00 DH</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes (incluses)</span>
                      <span className="font-semibold text-gray-400">—</span>
                    </div>
                    <div className="border-t-2 border-gray-200 pt-4 mt-2 flex justify-between items-center">
                      <span className="text-lg font-black text-gray-900">Total</span>
                      <span className="text-3xl font-black text-red-600">{fmt(invoice.total_amount)} <span className="text-base font-bold text-red-400">DH</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Required Documents ── */}
              <div className="print-break-inside">
                <div className="border border-amber-200 bg-amber-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-amber-900 text-sm">Documents requis pour finaliser l'achat</h3>
                      <p className="text-xs text-amber-700">Merci d'apporter les originaux lors de votre rendez-vous</p>
                    </div>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DOCS.map((d, i) => (
                      <li key={i} className="flex items-center gap-3 bg-white border border-amber-100 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800">
                        <span className="text-base">{d.icon}</span>
                        {d.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="print-break-inside pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
                <p className="font-semibold text-gray-600 mb-1">Merci de faire confiance à AutoMarket !</p>
                <p>Cette facture est générée électroniquement et ne nécessite pas de signature physique, sauf mention contraire.</p>
                <p className="mt-1">Pour toute question : contact@automarket.ma · +212 522 000 000</p>
              </div>

            </div>{/* /body */}
          </div>{/* /invoice document */}
        </div>{/* /max-w */}
      </div>
    </>
  );
};

export default Invoice;
