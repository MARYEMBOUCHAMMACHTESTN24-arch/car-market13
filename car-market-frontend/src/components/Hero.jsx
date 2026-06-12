import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';

/** Full-bleed hero: luxury car with modern overlay */
const HERO_BG =
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1920&h=1080&fit=crop&q=90';

const Hero = ({ filters, onChange, onSubmit }) => {
  return (
    <section className="relative min-h-[calc(100vh-6.5rem)] overflow-hidden bg-black pt-24 sm:pt-28 pb-14 md:min-h-[640px] md:pb-20">
      {/* Background image */}
      <div
        className="absolute inset-0 scale-105 bg-cover bg-[center_30%] bg-no-repeat"
        style={{ backgroundImage: `url('${HERO_BG}')` }}
        aria-hidden
      />

      {/* Layered overlays — dramatic, high-contrast for modern look */}
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/60" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/30" aria-hidden />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[min(70vh,560px)] max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.42em] text-brand-red sm:text-[11px]">
            Welcome to CarMarket
          </p>
          <h1 className="mb-5 font-heading text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.9)] sm:text-5xl md:text-6xl lg:text-[3.35rem] xl:text-7xl">
            Find Your Dream Car <span className="text-brand-red">Today</span>
          </h1>
          <p className="mb-10 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            Search through thousands of vehicles and find the perfect match for your needs.
          </p>

          <div className="w-full max-w-5xl">
            <SearchBar filters={filters} onChange={onChange} onSubmit={onSubmit} />
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to="/cars"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(230,57,70,0.55)] transition hover:bg-[#d62f3c] hover:shadow-[0_6px_32px_rgba(230,57,70,0.65)]"
            >
              Browse Cars
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-neutral-900/55 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:border-white/40 hover:bg-neutral-800/70"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
