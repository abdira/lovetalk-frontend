import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const { user, axiosInstance } = useContext(AuthContext);

  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackForm, setFeedbackForm] = useState({
    sessionId: null,
    rating: 5,
    comments: '',
    submitting: false,
    submitError: '',
    submitSuccess: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'client') return;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [sessionsRes, paymentsRes] = await Promise.all([
          axiosInstance.get('/sessions/upcoming'),
          axiosInstance.get('/payments/history'),
        ]);
        setSessions(sessionsRes.data);
        setPayments(paymentsRes.data);

        // Load existing feedbacks for sessions if available
        const feedbackMap = {};
        sessionsRes.data.forEach(session => {
          if (session.feedback) feedbackMap[session.id] = session.feedback;
        });
        setFeedbacks(feedbackMap);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, axiosInstance]);

  // Feedback form handlers
  const openFeedbackForm = (sessionId) => {
    setFeedbackForm({
      sessionId,
      rating: 5,
      comments: '',
      submitting: false,
      submitError: '',
      submitSuccess: '',
    });
  };

  const closeFeedbackForm = () => {
    setFeedbackForm({
      sessionId: null,
      rating: 5,
      comments: '',
      submitting: false,
      submitError: '',
      submitSuccess: '',
    });
  };

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({ ...prev, [name]: value }));
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackForm(prev => ({ ...prev, submitting: true, submitError: '', submitSuccess: '' }));

    try {
      await axiosInstance.post('/feedback', {
        session_id: feedbackForm.sessionId,
        rating: Number(feedbackForm.rating),
        comments: feedbackForm.comments,
      });
      setFeedbackForm(prev => ({
        ...prev,
        submitting: false,
        submitSuccess: 'Feedback submitted successfully!',
      }));

      // Update local feedbacks state
      setFeedbacks(prev => ({
        ...prev,
        [feedbackForm.sessionId]: {
          rating: feedbackForm.rating,
          comments: feedbackForm.comments,
        },
      }));
    } catch (err) {
      setFeedbackForm(prev => ({
        ...prev,
        submitting: false,
        submitError: err.response?.data?.message || 'Failed to submit feedback.',
      }));
    }
  };

  if (!user || user.role !== 'client') {
    return <div className="alert alert-warning my-5 text-center">Access denied. Please log in as a client.</div>;
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
      <h1 className="mb-4">Welcome back, {user.name}!</h1>

      {/* Upcoming Sessions */}
      <section className="mb-5">
        <h2>Upcoming Sessions</h2>
        {sessions.length === 0 ? (
          <p>No upcoming sessions scheduled.</p>
        ) : (
          <div className="list-group">
            {sessions.map(session => (
              <div key={session.id} className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                <div>
                  <strong>Counselor:</strong> {session.counselor.name} <br />
                  <strong>Date & Time:</strong> {new Date(session.date + 'T' + session.time_slot).toLocaleString()} <br />
                  <strong>Status:</strong> {session.status}
                </div>
                <div className="d-flex gap-2">
                  {session.status === 'confirmed' && (
                    <Link
                      to={`/chat/${session.id}`}
                      className="btn btn-outline-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Chat
                    </Link>
                  )}
                  {!feedbacks[session.id] && session.status === 'completed' && (
                    <button
                      className="btn btn-outline-success"
                      onClick={() => openFeedbackForm(session.id)}
                    >
                      Give Feedback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Payment History */}
      <section className="mb-5">
        <h2>Payment History</h2>
        {payments.length === 0 ? (
          <p>No payment records found.</p>
        ) : (
          <table className="table table-striped table-bordered">
            <thead>
              <tr>
                <th>Session</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid On</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>{payment.session.counselor.name}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td>{payment.status}</td>
                  <td>{new Date(payment.paid_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Feedback Submission Modal */}
      {feedbackForm.sessionId && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedbackModalLabel"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={submitFeedback}>
                <div className="modal-header">
                  <h5 className="modal-title" id="feedbackModalLabel">Submit Feedback</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeFeedbackForm}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  {feedbackForm.submitError && (
                    <div className="alert alert-danger">{feedbackForm.submitError}</div>
                  )}
                  {feedbackForm.submitSuccess && (
                    <div className="alert alert-success">{feedbackForm.submitSuccess}</div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="rating" className="form-label">
                      Rating
                    </label>
                    <select
                      id="rating"
                      name="rating"
                      className="form-select"
                      value={feedbackForm.rating}
                      onChange={handleFeedbackChange}
                      required
                    >
                      {[5,4,3,2,1].map(r => (
                        <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="comments" className="form-label">
                      Comments
                    </label>
                    <textarea
                      id="comments"
                      name="comments"
                      className="form-control"
                      rows="4"
                      value={feedbackForm.comments}
                      onChange={handleFeedbackChange}
                      placeholder="Write your feedback here..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeFeedbackForm}
                    disabled={feedbackForm.submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={feedbackForm.submitting}
                  >
                    {feedbackForm.submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;

