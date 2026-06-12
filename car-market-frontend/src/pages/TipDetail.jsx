import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBuyingTipImage } from '../utils/buyingTipImages';

const TipDetail = () => {
  const { slug } = useParams();
  const { t } = useTranslation();

  const allTips = {
    'history-report': {
      title: t('blog.tips.historyTitle'),
      explanation: t('blog.tips.historyLong'),
      image: getBuyingTipImage('history', 1200, 600),
    },
    'test-drive': {
      title: t('blog.tips.testDriveTitle'),
      explanation: t('blog.tips.testDriveLong'),
      image: getBuyingTipImage('testDrive', 1200, 600),
    },
    'inspect-paint': {
      title: t('blog.tips.paintTitle'),
      explanation: t('blog.tips.paintLong'),
      image: getBuyingTipImage('paint', 1200, 600),
    },
    'maintenance-records': {
      title: t('blog.tips.recordsTitle'),
      explanation: t('blog.tips.recordsLong'),
      image: getBuyingTipImage('records', 1200, 600),
    },
    'negotiate-price': {
      title: t('blog.tips.negotiateTitle'),
      explanation: t('blog.tips.negotiateLong'),
      image: getBuyingTipImage('negotiate', 1200, 600),
    },
    'mechanic-inspection': {
      title: t('blog.tips.mechanicTitle'),
      explanation: t('blog.tips.mechanicLong'),
      image: getBuyingTipImage('mechanic', 1200, 600),
    },
  };

  const tip = allTips[slug];

  if (!tip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-6">Tip not found.</p>
          <Link to="/blog" className="text-red-600 font-bold hover:underline">
            ← {t('blog.backToTips')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="w-full h-[55vh] relative overflow-hidden">
        <img
          src={tip.image}
          alt={tip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Content Card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-24 relative z-10 pb-24">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 sm:p-12">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-red-600 font-medium transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('blog.backToTips')}
          </Link>

          {/* Category label */}
          <span className="inline-block bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            {t('blog.expertAdvice')}
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight tracking-tight mb-8">
            {tip.title}
          </h1>

          {/* Divider */}
          <div className="w-16 h-1 bg-red-600 rounded-full mb-8 opacity-30" />

          {/* Explanation */}
          <p className="text-gray-600 text-lg leading-relaxed">
            {tip.explanation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TipDetail;
