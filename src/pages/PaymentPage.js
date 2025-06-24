import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PaymentPage = () => {
  const { user, axiosInstance } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Assume session info and amount passed via location.state or fetch from backend
  const session = location.state?.session || null;
  const amount = session?.fee || 100; // default $100 if no data

  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return (
      <div className="alert alert-warning my-5 text-center">
        You must be logged in to make a payment.
      </div>
    );
  }

  if (!session) {
    return (
      <div className="alert alert-danger my-5 text-center">
        No session information found. Please select a session to pay for.
      </div>
    );
  }

  const validateCard = () => {
    // Basic validation for mockup
    if (paymentMethod === 'credit_card') {
      if (!cardNumber.match(/^\d{16}$/)) return 'Card number must be 16 digits.';
      if (!cardExpiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) return 'Expiry must be in MM/YY format.';
      if (!cardCVC.match(/^\d{3}$/)) return 'CVC must be 3 digits.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateCard();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!paymentMethod) {
      setError('Please select a payment method.');
      return;
    }

    setLoading(true);

    try {
      // Mock delay to simulate payment processing
      await new Promise((r) => setTimeout(r, 2000));

      // TODO: Replace this with real API call to backend payment endpoint
      // await axiosInstance.post('/payments/process', { sessionId: session.id, paymentMethod, ...cardData });

      setSuccess('Payment successful! Your session is confirmed.');
      // Optionally redirect to client dashboard or session page after delay
      setTimeout(() => navigate('/client/dashboard'), 2000);
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5" style={{ maxWidth: 600 }}>
      <h2 className="mb-4">Payment for Session with {session.counselorName}</h2>
      <p>
        <strong>Session Date:</strong> {new Date(session.date + 'T' + session.time_slot).toLocaleString()}
      </p>
      <p>
        <strong>Amount Due:</strong> ${amount.toFixed(2)}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Payment Method</label>
          <select
            className="form-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">Select payment method</option>
            <option value="credit_card">Credit Card</option>
            <option value="paypal">PayPal</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        {/* Show credit card form if selected */}
        {paymentMethod === 'credit_card' && (
          <>
            <div className="mb-3">
              <label htmlFor="cardNumber" className="form-label">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                className="form-control"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={16}
                required
              />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label htmlFor="cardExpiry" className="form-label">
                  Expiry (MM/YY)
                </label>
                <input
                  type="text"
                  id="cardExpiry"
                  className="form-control"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  maxLength={5}
                  required
                />
              </div>
              <div className="col-6">
                <label htmlFor="cardCVC" className="form-label">
                  CVC
                </label>
                <input
                  type="text"
                  id="cardCVC"
                  className="form-control"
                  placeholder="123"
                  value={cardCVC}
                  onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, ''))}
                  maxLength={3}
                  required
                />
              </div>
            </div>
          </>
        )}

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing Payment...
            </>
          ) : (
            'Pay Now'
          )}
        </button>
      </form>
    </div>
  );
};

export default PaymentPage;

