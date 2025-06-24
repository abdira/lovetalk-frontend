import React, { useEffect, useState, useContext } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const CounselorProfile = () => {
  const { id } = useParams();
  const { user, axiosInstance } = useContext(AuthContext);

  const [counselor, setCounselor] = useState(null);
  const [loadingCounselor, setLoadingCounselor] = useState(true);
  const [error, setError] = useState('');

  // Booking states
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Redirect non-client users away from booking page
  if (user && user.role !== 'client') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchCounselor = async () => {
      setLoadingCounselor(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/counselors/${id}`);
        setCounselor(res.data);
      } catch (err) {
        setError('Failed to load counselor details.');
      } finally {
        setLoadingCounselor(false);
      }
    };
    fetchCounselor();
  }, [id, axiosInstance]);

  // Fetch available slots when selectedDate changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate) {
        setAvailableSlots([]);
        setSelectedSlot('');
        return;
      }
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const res = await axiosInstance.get(`/counselors/${id}/availability`, {
          params: { date: dateStr },
        });
        setAvailableSlots(res.data.slots || []);
        setSelectedSlot('');
      } catch {
        setAvailableSlots([]);
      }
    };
    fetchAvailableSlots();
  }, [selectedDate, id, axiosInstance]);

  const handleBooking = async () => {
    setBookingError('');
    setBookingSuccess('');
    if (!selectedDate || !selectedSlot) {
      setBookingError('Please select a date and time slot.');
      return;
    }

    setBookingLoading(true);
    try {
      await axiosInstance.post('/sessions', {
        counselor_id: id,
        date: selectedDate.toISOString().split('T')[0],
        time_slot: selectedSlot,
      });
      setBookingSuccess('Session booked successfully! You will receive a confirmation email.');
    } catch (err) {
      setBookingError(
        err.response?.data?.message || 'Failed to book session. Please try again later.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loadingCounselor) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status" aria-hidden="true"></div>
        <span className="visually-hidden">Loading counselor profile...</span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger my-5">{error}</div>;
  }

  if (!counselor) {
    return <div className="text-center my-5">Counselor not found.</div>;
  }

  return (
    <div className="container my-5">
      <div className="row g-4">
        <div className="col-md-4">
          <img
            src={counselor.photo_url || '/default-avatar.png'}
            alt={`Photo of ${counselor.name}`}
            className="img-fluid rounded shadow"
          />
          <h2 className="mt-3">{counselor.name}</h2>
          <p><strong>Gender:</strong> {counselor.gender}</p>
          <p><strong>Languages:</strong> {counselor.languages.join(', ')}</p>
          <p><strong>Specialties:</strong> {counselor.specialties.join(', ')}</p>
          <p><strong>Rating:</strong> {counselor.rating.toFixed(1)} / 5</p>
        </div>

        <div className="col-md-8">
          <h3>About Me</h3>
          <p>{counselor.bio}</p>

          <h3>Book a Session</h3>

          {!user && (
            <div className="alert alert-warning">
              You must <a href="/login">log in</a> as a client to book a session.
            </div>
          )}

          {user && user.role === 'client' && (
            <>
              <label htmlFor="calendar" className="form-label">
                Select a date:
              </label>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                minDate={new Date()}
                tileDisabled={({ date }) => date.getDay() === 0 || date.getDay() === 6} // disable weekends if needed
              />

              <div className="mt-3">
                <label htmlFor="timeSlot" className="form-label">
                  Select a time slot:
                </label>
                {availableSlots.length === 0 && (
                  <p className="text-muted">No available slots on this date.</p>
                )}
                <select
                  id="timeSlot"
                  className="form-select"
                  value={selectedSlot}
                  onChange={e => setSelectedSlot(e.target.value)}
                  disabled={availableSlots.length === 0}
                >
                  <option value="">-- Select a time slot --</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {bookingError && <div className="alert alert-danger mt-3">{bookingError}</div>}
              {bookingSuccess && <div className="alert alert-success mt-3">{bookingSuccess}</div>}

              <button
                className="btn btn-primary mt-3"
                onClick={handleBooking}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Booking...
                  </>
                ) : (
                  'Book Session'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounselorProfile;

