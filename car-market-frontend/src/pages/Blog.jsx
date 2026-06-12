import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getBuyingTipImage } from '../utils/buyingTipImages';

const Blog = () => {
  const { t } = useTranslation();
  const [selectedTip, setSelectedTip] = useState(null);

  const tips = [
    {
      id: 1,
      title: t('blog.tips.historyTitle'),
      shortText: t('blog.tips.historyShort'),
      explanation: t('blog.tips.historyLong'),
      image: getBuyingTipImage('history', 600, 400),
    },
    {
      id: 2,
      title: t('blog.tips.testDriveTitle'),
      shortText: t('blog.tips.testDriveShort'),
      explanation: t('blog.tips.testDriveLong'),
      image: getBuyingTipImage('testDrive', 600, 400),
    },
    {
      id: 3,
      title: t('blog.tips.paintTitle'),
      shortText: t('blog.tips.paintShort'),
      explanation: t('blog.tips.paintLong'),
      image: getBuyingTipImage('paint', 600, 400),
    },
    {
      id: 4,
      title: t('blog.tips.recordsTitle'),
      shortText: t('blog.tips.recordsShort'),
      explanation: t('blog.tips.recordsLong'),
      image: getBuyingTipImage('records', 600, 400),
    },
    {
      id: 5,
      title: t('blog.tips.negotiateTitle'),
      shortText: t('blog.tips.negotiateShort'),
      explanation: t('blog.tips.negotiateLong'),
      image: getBuyingTipImage('negotiate', 600, 400),
    },
    {
      id: 6,
      title: t('blog.tips.mechanicTitle'),
      shortText: t('blog.tips.mechanicShort'),
      explanation: t('blog.tips.mechanicLong'),
      image: getBuyingTipImage('mechanic', 600, 400),
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-900 py-20">

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
          {t('blog.pageTitle')}
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          {t('blog.pageSubtitle')}
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="h-48 overflow-hidden relative group">
                <img
                  src={tip.image}
                  alt={tip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{tip.title}</h3>
                <p className="text-gray-500 mb-6 text-sm flex-1">{tip.shortText}</p>
                <button
                  onClick={() => setSelectedTip(tip)}
                  className="w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold py-3 px-6 rounded-xl transition-colors duration-300 text-sm"
                >
                  {t('blog.readTip')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {selectedTip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedTip(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
              <button
                onClick={() => setSelectedTip(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="h-64 sm:h-80 w-full shrink-0">
                <img src={selectedTip.image} alt={selectedTip.title} className="w-full h-full object-cover" />
              </div>

              <div className="p-8 overflow-y-auto">
                <p className="text-red-600 font-bold uppercase tracking-widest text-xs mb-3">
                  {t('blog.expertAdvice')}
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tight">
                  {selectedTip.title}
                </h3>
                <p className="text-gray-600 text-[1.1rem] leading-relaxed">
                  {selectedTip.explanation}
                </p>
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setSelectedTip(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-8 py-3 rounded-xl transition-colors"
                  >
                    {t('blog.close')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Blog;
