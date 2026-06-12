import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const contactLinks = {
  map: 'https://maps.google.com/?q=Avenue+Mohammed+V,+Hay+Al+Matar,+Nador+62000,+Morocco',
  phone: 'tel:+212661421873',
  email: 'mailto:contact@automarket.ma',
};

const usefulLinks = [
  { labelKey: 'navbar.aboutUs', path: '/about' },
  { labelKey: 'footer.inventory', path: '/cars' },
  { labelKey: 'footer.offers', path: '/offers' },
  { labelKey: 'navbar.contact', path: '/contact' },
];

const vehicleLinks = [
  { labelKey: 'footer.allVehicles', path: '/cars' },
  { labelKey: 'footer.suvs', path: '/cars?category=SUV' },
  { labelKey: 'footer.sedans', path: '/cars?category=Sedan' },
  { labelKey: 'footer.coupes', path: '/cars?category=Coupe' },
];

const legalLinks = [
  { labelKey: 'navbar.contact', path: '/contact' },
  { labelKey: 'footer.blog', path: '/blog' },
];

const Footer = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const contact = {
    address: t('footer.address'),
    phone: t('footer.phone'),
    email: t('footer.email'),
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmail('');
    alert(t('footer.thankYouSubscribe'));
  };

  return (
    <footer className="bg-gray-950 text-white pt-12 pb-6 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          
          {/* Brand & Description */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center">
              <img src="/logo/logo-horizontal-dark.svg" alt="AutoMarket Logo" className="h-8" />
            </Link>
            <p className="text-gray-400 text-xs leading-relaxed pr-4">
              {t('footer.brandDescription')}
            </p>
          </div>

          {/* Useful Links */}
          <div className="lg:ml-auto">
            <h4 className="text-sm font-bold text-white mb-4">
              {t('footer.usefulLinks')}
            </h4>
            <ul className="space-y-2">
              {usefulLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-gray-400 hover:text-red-500 font-medium transition-colors text-xs">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vehicles Type */}
          <div className="lg:ml-auto">
            <h4 className="text-sm font-bold text-white mb-4">
              {t('footer.vehiclesType')}
            </h4>
            <ul className="space-y-2">
              {vehicleLinks.map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-gray-400 hover:text-red-500 font-medium transition-colors text-xs">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div className="lg:ml-auto">
            <h4 className="text-sm font-bold text-white mb-4">
              {t('footer.contactUs')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <a href={contactLinks.map} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-red-500 font-medium text-xs leading-relaxed transition-colors">
                  {contact.address}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <a href={contactLinks.phone} className="text-gray-400 hover:text-red-500 font-medium text-xs transition-colors">{contact.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <a href={contactLinks.email} className="text-gray-400 hover:text-red-500 font-medium text-xs truncate transition-colors">{contact.email}</a>
              </li>
            </ul>
          </div>

          {/* Subscribe Us */}
          <div className="lg:col-span-1 space-y-3">
            <h4 className="text-sm font-bold text-white mb-4">
              {t('footer.subscribeUs')}
            </h4>
            <p className="text-gray-400 font-medium text-xs leading-relaxed">
              {t('footer.subscribeDescription')}
            </p>
            <form onSubmit={handleSubscribe} className="flex mt-3 items-stretch">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('footer.emailPlaceholder')}
                required
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors rounded-l-md"
              />
              <button type="submit" className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors whitespace-nowrap rounded-r-md shadow-lg">
                {t('footer.subscribe')}
              </button>
            </form>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs font-medium">
            Copyright &copy; {new Date().getFullYear()} <span className="text-white font-bold">AutoMarket</span>. {t('footer.allRightsReserved')}
          </p>
          <div className="flex gap-6 text-xs font-medium text-gray-500">
            {legalLinks.map(link => (
              <Link key={link.path} to={link.path} className="hover:text-red-500 transition-colors">{t(link.labelKey)}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
