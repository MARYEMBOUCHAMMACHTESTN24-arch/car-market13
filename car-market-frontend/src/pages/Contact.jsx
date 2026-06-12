import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { contactAPI } from '../services/api';

const contactLinks = {
  map: 'https://maps.google.com/?q=Avenue+Mohammed+V,+Hay+Al+Matar,+Nador+62000,+Morocco',
  mapEmbed: 'https://www.google.com/maps?q=Avenue+Mohammed+V,+Hay+Al+Matar,+Nador+62000,+Morocco&output=embed',
  phone: 'tel:+212661421873',
  email: 'mailto:contact@automarket.ma',
};

const Contact = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const contactItems = [
    {
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
      sub: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      title: t('footer.contactUs'),
      text: t('footer.address'),
      href: contactLinks.map,
      external: true,
    },
    {
      icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
      title: t('common.phone'),
      text: t('footer.phone'),
      href: contactLinks.phone,
    },
    {
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      title: t('common.email'),
      text: t('footer.email'),
      href: contactLinks.email,
    },
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await contactAPI.send(form);
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Failed to send message:', err);
      if (err.response?.status === 422) {
        // Validation error
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        setError(firstError);
      } else {
        setError(err.response?.data?.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans selection:bg-red-600/20 selection:text-red-900">
      {/* Premium Hero Section */}
      <div 
        className="relative h-[320px] flex items-center justify-center lg:justify-start bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop')" }}
      >
        {/* Dark overlay 40% */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 relative z-10 w-full pt-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">{t('contact.title')}</h1>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
            <Link to="/" className="hover:text-white transition-colors duration-300">{t('navbar.home')}</Link>
            <span className="w-1 h-1 rounded-full bg-red-500 mx-1"></span>
            <span className="text-white">{t('navbar.contact')}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Single Premium Information Panel */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#ECECEC] p-8 lg:p-10 h-full">
              <div className="mb-10">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Get in Touch</h2>
                <p className="text-slate-500 text-base leading-relaxed">
                  {t('contact.subtitle')}
                </p>
              </div>

              <div className="space-y-8 flex-grow">
                {contactItems.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noreferrer' : undefined}
                    className="flex items-start gap-5 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:bg-red-50 group-hover:scale-110">
                      <svg className="w-5 h-5 text-slate-700 group-hover:text-red-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                        {item.sub && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.sub} />}
                      </svg>
                    </div>
                    <div className="pt-1">
                      <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-1.5">{item.title}</h3>
                      <p className="text-base text-slate-600 font-medium group-hover:text-red-600 transition-colors">{item.text}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Premium Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[28px] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-[#ECECEC] p-8 sm:p-12 h-full relative overflow-hidden">
              {submitted ? (
                <div className="text-center py-20 relative z-10 flex flex-col items-center justify-center h-full">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 mb-3">{t('contact.successMessage')}</h3>
                  <p className="text-slate-500 text-lg mb-8 max-w-md">{t('contact.subtitle')}</p>
                  <button 
                    onClick={() => setSubmitted(false)} 
                    className="h-[60px] px-8 rounded-2xl bg-slate-900 text-white font-bold transition-all duration-300 hover:bg-red-600 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div className="relative z-10">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-8">{t('contact.title')}</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700 ml-1">{t('contact.nameLabel')} <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          name="name" 
                          value={form.name} 
                          onChange={handleChange} 
                          required 
                          className="w-full h-[60px] bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl px-5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all duration-300 shadow-sm" 
                          placeholder={t('contact.namePlaceholder')} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700 ml-1">{t('contact.emailLabel')} <span className="text-red-500">*</span></label>
                        <input 
                          type="email" 
                          name="email" 
                          value={form.email} 
                          onChange={handleChange} 
                          required 
                          className="w-full h-[60px] bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl px-5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all duration-300 shadow-sm" 
                          placeholder={t('contact.emailPlaceholder')} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">{t('contact.subjectLabel')}</label>
                      <input 
                        type="text" 
                        name="subject" 
                        value={form.subject} 
                        onChange={handleChange} 
                        className="w-full h-[60px] bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl px-5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all duration-300 shadow-sm" 
                        placeholder={t('contact.subjectPlaceholder')} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 ml-1">{t('contact.messageLabel')} <span className="text-red-500">*</span></label>
                      <textarea 
                        name="message" 
                        value={form.message} 
                        onChange={handleChange} 
                        required 
                        rows={4} 
                        className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all duration-300 shadow-sm resize-none" 
                        placeholder={t('contact.messagePlaceholder')} 
                      />
                    </div>
                    
                    
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </div>
                    )}

                    <div className="pt-4">
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full sm:w-auto h-[60px] inline-flex items-center justify-center gap-3 px-10 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-600/30 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>{t('contact.sendButton')}</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Modern Google Map Section */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 pb-16 lg:pb-20">
        <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#ECECEC] p-3 h-[450px] overflow-hidden">
          <iframe 
            src={contactLinks.mapEmbed}
            width="100%" 
            height="100%" 
            style={{ border: 0, borderRadius: '20px' }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="AutoMarket Nador Location"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default Contact;
