import React from 'react';

const fieldClass =
  'h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.07] px-3.5 text-sm font-medium text-white shadow-inner shadow-black/20 backdrop-blur-sm transition placeholder:text-neutral-500 focus:border-brand-red/50 focus:outline-none focus:ring-2 focus:ring-brand-red/25';

const SearchBar = ({ filters, onChange, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="rounded-2xl border border-white/[0.12] bg-gradient-to-b from-zinc-900/85 to-zinc-950/90 p-3 shadow-[0_16px_48px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl sm:rounded-3xl sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-0 md:divide-x md:divide-white/10">
          {/* Brand */}
          <div className="min-w-0 flex-1 md:px-3 md:pr-4">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/75">
              Brand
            </label>
            <select name="brand" value={filters.brand} onChange={onChange} className={fieldClass}>
              <option value="" className="text-gray-900">
                Select Brand
              </option>
              {['Audi', 'BMW', 'Mercedes', 'Porsche', 'Tesla', 'Toyota', 'Honda', 'Ford'].map((b) => (
                <option key={b} value={b} className="text-gray-900">
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="min-w-0 flex-1 md:px-3">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/75">
              Type
            </label>
            <select name="type" value={filters.type} onChange={onChange} className={fieldClass}>
              <option value="" className="text-gray-900">
                SUV/Sedan/Coupe
              </option>
              {['Sedan', 'SUV', 'Coupe', 'Sport', 'Electric', 'Truck'].map((t) => (
                <option key={t} value={t} className="text-gray-900">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className="min-w-0 flex-1 md:px-3">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/75">
              City
            </label>
            <select name="city" value={filters.city} onChange={onChange} className={fieldClass}>
              <option value="" className="text-gray-900">
                Enter City
              </option>
              {['Tétouan', 'Tanger', 'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Agadir', 'Oujda'].map((c) => (
                <option key={c} value={c} className="text-gray-900">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div className="min-w-[200px] flex-1 md:px-3">
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/75">
                  Min $
                </label>
                <input
                  type="number"
                  name="minPrice"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={onChange}
                  className={fieldClass}
                />
              </div>
              <div className="min-w-0 flex-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/75">
                  Max $
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Any"
                  value={filters.maxPrice}
                  onChange={onChange}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex md:items-end md:pl-3 md:pr-1">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-6 text-sm font-bold uppercase tracking-wide text-white shadow-[0_4px_20px_rgba(230,57,70,0.45)] transition hover:bg-[#d62f3c] hover:shadow-[0_6px_28px_rgba(230,57,70,0.55)] md:h-11 md:min-w-[148px]"
            >
              <svg className="h-4 w-4 opacity-95" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Now
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
