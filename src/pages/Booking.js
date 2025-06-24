import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';

const Booking = () => {
  const { counselorId } = useParams();
  const navigate = useNavigate();

  const [counselor, setCounselor] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState(null);

  // Fetch counselor details
  useEffect(() => {
    const fetchCounselor = async () => {
      try {
        const response = await axios.get(`/api/counselors/${counselorId}`);
        setCounselor(response.data);
      } catch (err) {
        setError('Failed to load counselor information.');
      } finally {
        setLoading(false);
      }
    };
    fetchCounselor();
  }, [counselorId]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axios.post('/api/sessions/book', {
        counselor_id: counselorId,
        date,
        time,
      });

      const newBookingId = response.data.booking_id; // backend must return this!
      setBookingId(newBookingId);
    } catch (err) {
      setError('Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner animation="border" className="mt-5" />;

  return (
    <div className="container py-5">
      {counselor && !bookingId && (
        <>
          <h2 className="mb-4">Book a Marriage Counseling Session with {counselor.name}</h2>
          <div className="card p-4 mb-4">
            <h5>Specialty: {counselor.specialty}</h5>
            <p>Experience: {counselor.experience} years</p>
            <p>Bio: {counselor.bio}</p>
          </div>

          <form onSubmit={handleBooking} className="card p-4">
            <div className="mb-3">
              <label htmlFor="date" className="form-label">Choose Date</label>
              <input
                type="date"
                className="form-control"
                id="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="time" className="form-label">Choose Time</label>
              <input
                type="time"
                className="form-control"
                id="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Booking...' : 'Book Session'}
            </button>
          </form>
        </>
      )}

      {bookingId && (
        <div className="alert alert-success mt-5 text-center">
          <h4 className="mb-3">✅ Booking Confirmed!</h4>
          <p>Your session has been booked successfully.</p>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <button
              onClick={() => navigate(`/session/${bookingId}/chat`)}
              className="btn btn-outline-primary"
            >
              Go to Chat
            </button>
            <button
              onClick={() => navigate(`/session/${bookingId}/video`)}
              className="btn btn-outline-success"
            >
              Join Video Call
            </button>
          </div>
        </div>
      )}

      {!counselor && !loading && (
        <div className="alert alert-warning mt-4">
          Counselor not found.
        </div>
      )}
    </div>
  );
};

export default Booking;

