import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import CounselorCard from '../pages/counselors/CounselorCard';
import Filters from '../pages/counselors/Filters.js';

const COUNSELORS_PER_PAGE = 10;

const Counselors = () => {
  const { axiosInstance } = useContext(AuthContext);

  // State for counselors list and filters
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    specialties: [],
    gender: '',
    minRating: 0,
    languages: [],
    availableNow: false,
  });
  const [page, setPage] = useState(1);
  const [totalCounselors, setTotalCounselors] = useState(0);

  // Fetch counselors from backend API with filters & pagination
  const fetchCounselors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        per_page: COUNSELORS_PER_PAGE,
        search: filters.search || undefined,
        specialties: filters.specialties.length ? filters.specialties.join(',') : undefined,
        gender: filters.gender || undefined,
        min_rating: filters.minRating || undefined,
        languages: filters.languages.length ? filters.languages.join(',') : undefined,
        available_now: filters.availableNow ? '1' : undefined,
      };

      const res = await axiosInstance.get('/counselors', { params });
      setCounselors(res.data.data);
      setTotalCounselors(res.data.total);
    } catch (err) {
      setError('Failed to load counselors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch counselors on filters or page change
  useEffect(() => {
    fetchCounselors();
  }, [filters, page]);

  // Handler for filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page on filters change
  };

  // Pagination controls
  const totalPages = Math.ceil(totalCounselors / COUNSELORS_PER_PAGE);

  return (
    <div className="container my-5">
      <h1 className="mb-4">Find a Marriage Counselor</h1>
      <Filters filters={filters} onChange={handleFilterChange} />

      {loading && (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" aria-hidden="true"></div>
          <span className="visually-hidden">Loading counselors...</span>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && counselors.length === 0 && (
        <p className="text-muted text-center my-5">No counselors found matching your criteria.</p>
      )}

      <div className="row g-4">
        {counselors.map(counselor => (
          <div key={counselor.id} className="col-md-6 col-lg-4">
            <CounselorCard counselor={counselor} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Counselor list pagination" className="mt-4 d-flex justify-content-center">
          <ul className="pagination">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
                disabled={page === 1}
              >
                &laquo;
              </button>
            </li>

            {[...Array(totalPages)].map((_, i) => (
              <li
                key={i}
                className={`page-item ${page === i + 1 ? 'active' : ''}`}
              >
                <button
                  className="page-link"
                  onClick={() => setPage(i + 1)}
                  aria-current={page === i + 1 ? 'page' : undefined}
                >
                  {i + 1}
                </button>
              </li>
            ))}

            <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
                disabled={page === totalPages}
              >
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default Counselors;

