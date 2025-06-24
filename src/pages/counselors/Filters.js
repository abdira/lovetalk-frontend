import React, { useState, useEffect } from 'react';

const SPECIALTIES = [
  'Communication',
  'Conflict Resolution',
  'Infidelity',
  'Pre-Marital Counseling',
  'Parenting',
  'Divorce Recovery',
];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Arabic'];
const GENDERS = ['Male', 'Female', 'Other'];

const Filters = ({ filters, onChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Debounce search input to avoid too many requests
  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(localFilters);
    }, 500);
    return () => clearTimeout(timeout);
  }, [localFilters, onChange]);

  // Handle multi-select specialties and languages
  const toggleItem = (field, item) => {
    setLocalFilters(prev => {
      const arr = prev[field];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...arr, item] };
      }
    });
  };

  return (
    <form className="mb-4">
      <div className="row g-3 align-items-center">
        <div className="col-md-4">
          <label htmlFor="search" className="form-label">
            Search by name or keyword
          </label>
          <input
            type="search"
            id="search"
            className="form-control"
            placeholder="Search counselors"
            value={localFilters.search}
            onChange={e => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="col-md-8">
          <div className="row gy-2 gx-3 align-items-center">
            <div className="col-md-3">
              <label className="form-label d-block">Specialties</label>
              {SPECIALTIES.map(spec => (
                <div className="form-check" key={spec}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`spec-${spec}`}
                    checked={localFilters.specialties.includes(spec)}
                    onChange={() => toggleItem('specialties', spec)}
                  />
                  <label className="form-check-label" htmlFor={`spec-${spec}`}>
                    {spec}
                  </label>
                </div>
              ))}
            </div>

            <div className="col-md-2">
              <label htmlFor="gender" className="form-label">
                Gender
              </label>
              <select
                id="gender"
                className="form-select"
                value={localFilters.gender}
                onChange={e => setLocalFilters(prev => ({ ...prev, gender: e.target.value }))}
              >
                <option value="">Any</option>
                {GENDERS.map(g => (
                  <option key={g} value={g.toLowerCase()}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label htmlFor="minRating" className="form-label">
                Min Rating
              </label>
              <select
                id="minRating"
                className="form-select"
                value={localFilters.minRating}
                onChange={e =>
                  setLocalFilters(prev => ({
                    ...prev,
                    minRating: Number(e.target.value),
                  }))
                }
              >
                <option value={0}>Any</option>
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>
                    {r}+
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label d-block">Languages</label>
              {LANGUAGES.map(lang => (
                <div className="form-check form-check-inline" key={lang}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`lang-${lang}`}
                    checked={localFilters.languages.includes(lang)}
                    onChange={() => toggleItem('languages', lang)}
                  />
                  <label className="form-check-label" htmlFor={`lang-${lang}`}>
                    {lang}
                  </label>
                </div>
              ))}
            </div>

            <div className="col-md-1 d-flex align-items-center">
              <div className="form-check mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="availableNow"
                  checked={localFilters.availableNow}
                  onChange={e =>
                    setLocalFilters(prev => ({
                      ...prev,
                      availableNow: e.target.checked,
                    }))
                  }
                />
                <label className="form-check-label" htmlFor="availableNow">
                  Now
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Filters;

