import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion as Motion } from 'framer-motion';

const IMG = {
  hero: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop',
  about: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=2115&auto=format&fit=crop',
};

const iconPaths = {
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  deal: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const About = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith('ar');

  const stats = [
    {
      num: t('about.statsCertifiedNum'),
      sub: t('about.statsCertifiedSub'),
      icon: "M5 11l1.5-4.5h11L19 11M3 11v6h2v2h2v-2h10v2h2v-2h2v-6H3zm3.5 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
    },
    {
      num: t('about.statsClientsNum'),
      sub: t('about.statsClientsSub'),
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    },
    {
      num: t('about.statsYearsNum'),
      sub: t('about.statsYearsSub'),
      icon: "M5 3v4m14-4v4M5 7h14M8 11v1a4 4 0 108 0v-1M12 16v5m-3 0h6"
    },
    {
      num: t('about.statsBrandsNum'),
      sub: t('about.statsBrandsSub'),
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    },
  ];

  const proofPoints = [
    t('about.proofInspection'),
    t('about.proofTransparent'),
    t('about.proofSupport'),
    t('about.proofDelivery'),
  ];

  const values = [
    {
      icon: iconPaths.shield,
      title: t('about.valueQualityTitle'),
      desc: t('about.valueQualityDesc'),
    },
    {
      icon: iconPaths.deal,
      title: t('about.valueOffersTitle'),
      desc: t('about.valueOffersDesc'),
    },
    {
      icon: iconPaths.bolt,
      title: t('about.valueFastTitle'),
      desc: t('about.valueFastDesc'),
    },
  ];

  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-red-600/20 selection:text-red-900" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-8 lg:pt-16 lg:pb-10 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <Motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className={`max-w-xl ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <Motion.div variants={fadeUp} className="flex items-center gap-4 mb-4">
                <span className="h-[2px] w-10 bg-red-600" />
                <span className="text-red-600 text-[11px] font-bold uppercase tracking-widest">
                  {t('about.ourStory')}
                </span>
              </Motion.div>

              <Motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15] tracking-tight mb-5">
                {t('about.heroTitle')}
              </Motion.h1>

              <Motion.p variants={fadeUp} className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-lg mb-8 font-medium">
                {t('about.heroSubtitle')}
              </Motion.p>

              <Motion.div variants={fadeUp} className={`flex flex-wrap gap-3 ${isRtl ? 'justify-end lg:justify-start' : ''}`}>
                <Link
                  to="/cars"
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/20"
                >
                  <span className="relative z-10">{t('about.primaryCta')}</span>
                  <svg className={`relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-slate-900 text-sm font-bold shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5"
                >
                  {t('about.secondaryCta')}
                </Link>
              </Motion.div>
            </Motion.div>

            <Motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeUp}
              className="relative lg:h-[400px] w-full max-w-[500px] mx-auto lg:ml-auto rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50"
            >
              <img
                src={IMG.about}
                alt={t('about.heroImageAlt')}
                className="w-full h-full object-cover"
              />
            </Motion.div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="pt-10 pb-16 lg:pt-12 lg:pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6"
          >
            {stats.map((s, idx) => (
              <Motion.div
                key={idx}
                variants={fadeUp}
                className="bg-white rounded-[20px] py-6 px-6 lg:py-8 lg:px-6 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#ECECEC] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgb(0,0,0,0.06)] group"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-transform duration-300 group-hover:scale-110">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
                  </svg>
                </div>
                <div className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-1.5 tracking-tight">
                  {s.num}
                </div>
                <div className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  {s.sub}
                </div>
              </Motion.div>
            ))}
          </Motion.div>
        </div>
      </section>

      {/* WHO WE ARE SECTION */}
      <section className="py-16 lg:py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={fadeUp}
              className="order-2 lg:order-1 relative rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50"
            >
              <div className="aspect-[4/3] lg:aspect-[4/5]">
                <img
                  src={IMG.about}
                  alt={t('about.aboutImageAlt')}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths.shield} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-0.5">{t('about.imageLabel')}</p>
                    <p className="text-sm font-bold text-slate-900">{t('about.imageSubLabel')}</p>
                  </div>
                </div>
              </div>
            </Motion.div>

            <div className="order-1 lg:order-2">
              <Motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={staggerContainer}
              >
                <Motion.span variants={fadeUp} className="text-red-600 text-xs font-bold uppercase tracking-widest">
                  {t('about.whoEyebrow')}
                </Motion.span>
                <Motion.h2 variants={fadeUp} className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
                  {t('about.whoTitle')}
                </Motion.h2>

                <Motion.div variants={fadeUp} className="space-y-4 text-slate-600 text-base leading-relaxed mb-8">
                  <p>{t('about.whoP1')}</p>
                  <p>{t('about.whoP2')}</p>
                </Motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {proofPoints.map((item, idx) => (
                    <Motion.div key={idx} variants={fadeUp} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 mt-1 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{item}</span>
                    </Motion.div>
                  ))}
                </div>
              </Motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION/VISION SECTION */}
      <section className="py-16 lg:py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <span className="text-red-600 text-xs font-bold uppercase tracking-widest">{t('about.directionEyebrow')}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{t('about.directionTitle')}</h2>
          </Motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: t('about.ourMission'), text: t('about.missionText'), path: iconPaths.bolt },
              { title: t('about.visionTitle'), text: t('about.visionText'), path: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            ].map((card, idx) => (
              <Motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={fadeUp}
                className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg shadow-slate-200/40 transition-transform hover:-translate-y-1 duration-500"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.path} />
                    {card.title === t('about.visionTitle') && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-4">{card.title}</h3>
                <p className="text-slate-600 text-base leading-relaxed">{card.text}</p>
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <span className="text-red-600 text-xs font-bold uppercase tracking-widest">{t('about.differenceEyebrow')}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{t('about.differenceTitle')}</h2>
          </Motion.div>

          <Motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {values.map((v, idx) => (
              <Motion.div
                key={idx}
                variants={fadeUp}
                className="group"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={v.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{v.title}</h3>
                <p className="text-slate-600 leading-relaxed text-base">{v.desc}</p>
              </Motion.div>
            ))}
          </Motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
