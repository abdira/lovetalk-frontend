import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const CounselorDashboard = () => {
  const { user, axiosInstance } = useContext(AuthContext);

  // States
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Availability management
  const [availabilityDates, setAvailabilityDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newSlot, setNewSlot] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilitySuccess, setAvailabilitySuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'counselor') return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [sessionsRes, clientsRes, availabilityRes] = await Promise.all([
          axiosInstance.get('/sessions/upcoming-counselor'),
          axiosInstance.get('/clients/list'),
          axiosInstance.get('/counselors/availability'),
        ]);
        setSessions(sessionsRes.data);
        setClients(clientsRes.data);
        setAvailabilityDates(availabilityRes.data.dates || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, axiosInstance]);

  // Fetch slots for selected date
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }
    const fetchSlots = async () => {
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const res = await axiosInstance.get('/counselors/availability/slots', {
          params: { date: dateStr },
        });
        setAvailableSlots(res.data.slots || []);
      } catch {
        setAvailableSlots([]);
      }
    };
    fetchSlots();
  }, [selectedDate, axiosInstance]);

  // Manage availability: Add new slot
  const handleAddSlot = async () => {
    if (!selectedDate || !newSlot) return;
    setAvailabilityLoading(true);
    setAvailabilityError('');
    setAvailabilitySuccess('');
    try {
      await axiosInstance.post('/counselors/availability/slots', {
        date: selectedDate.toISOString().split('T')[0],
        time_slot: newSlot,
      });
      setAvailabilitySuccess('Time slot added successfully.');
      setNewSlot('');
      // Refresh slots and availability dates
      const [slotsRes, availabilityRes] = await Promise.all([
        axiosInstance.get('/counselors/availability/slots', { params: { date: selectedDate.toISOString().split('T')[0] } }),
        axiosInstance.get('/counselors/availability'),
      ]);
      setAvailableSlots(slotsRes.data.slots || []);
      setAvailabilityDates(availabilityRes.data.dates || []);
    } catch (err) {
      setAvailabilityError('Failed to add time slot.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Manage session status (confirm, cancel)
  const updateSessionStatus = async (sessionId, status) => {
    try {
      await axiosInstance.patch(`/sessions/${sessionId}`, { status });
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, status } : s))
      );
    } catch (err) {
      alert('Failed to update session status.');
    }
  };

  if (!user || user.role !== 'counselor') {
    return <div className="alert alert-warning my-5 text-center">Access denied. Please log in as a counselor.</div>;
  }

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status" aria-hidden="true"></div>
        <span className="visually-hidden">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger my-5 text-center">{error}</div>;
  }

  return (
    <div className="container my-5">
      <h1 className="mb-4">Welcome, {user.name}</h1>

      {/* Upcoming Sessions */}
      <section className="mb-5">
        <h2>Upcoming Sessions</h2>
        {sessions.length === 0 ? (
          <p>No upcoming sessions.</p>
        ) : (
          <div className="list-group">
            {sessions.map(session => (
              <div key={session.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                <div>
                  <strong>Client:</strong> {session.client.name} <br />
                  <strong>Date & Time:</strong> {new Date(session.date + 'T' + session.time_slot).toLocaleString()} <br />
                  <strong>Status:</strong> {session.status}
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  {(session.status === 'pending' || session.status === 'requested') && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => updateSessionStatus(session.id, 'confirmed')}
                      >
                        Confirm
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => updateSessionStatus(session.id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {session.status === 'confirmed' && (
                    <Link
                      to={`/chat/${session.id}`}
                      className="btn btn-outline-primary btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Chat
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Client List */}
      <section className="mb-5">
        <h2>Your Clients</h2>
        {clients.length === 0 ? (
          <p>No clients found.</p>
        ) : (
          <div className="list-group">
            {clients.map(client => (
              <div key={client.id} className="list-group-item">
                <strong>{client.name}</strong> — {client.email}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Availability Management */}
      <section className="mb-5">
        <h2>Manage Availability</h2>

        <label htmlFor="calendar" className="form-label">
          Select Date:
        </label>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          minDate={new Date()}
          tileClassName={({ date }) =>
            availabilityDates.includes(date.toISOString().split('T')[0])
              ? 'bg-success text-white rounded'
              : null
          }
        />

        {selectedDate && (
          <>
            <h5 className="mt-3">
              Available Slots on {selectedDate.toDateString()}
            </h5>
            {availabilityLoading && (
              <div className="spinner-border spinner-border-sm text-primary" role="status" />
            )}
            {availabilityError && (
              <div className="alert alert-danger">{availabilityError}</div>
            )}
            {availabilitySuccess && (
              <div className="alert alert-success">{availabilitySuccess}</div>
            )}

            {availableSlots.length === 0 ? (
              <p>No slots available for this date.</p>
            ) : (
              <ul className="list-group mb-3">
                {availableSlots.map((slot, idx) => (
                  <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                    {slot}
                    {/* TODO: Add delete slot feature if needed */}
                  </li>
                ))}
              </ul>
            )}

            <div className="input-group mb-3">
              <input
                type="time"
                className="form-control"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
              />
              <button
                className="btn btn-primary"
                onClick={handleAddSlot}
                disabled={availabilityLoading || !newSlot}
              >
                Add Slot
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default CounselorDashboard;

