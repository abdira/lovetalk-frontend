import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const SettingsPage = () => {
  const { user, axiosInstance, refreshUser } = useContext(AuthContext);

  // Local form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: false,
      sms: false,
      push: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load user profile and notification settings on mount
  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch profile (or use user from context)
        setFormData(prev => ({
          ...prev,
          name: user.name,
          email: user.email,
        }));

        // Fetch notification settings from API
        const res = await axiosInstance.get('/user/notifications');
        setFormData(prev => ({
          ...prev,
          notifications: res.data.notifications || {
            email: false,
            sms: false,
            push: false,
          },
        }));
      } catch (err) {
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, axiosInstance]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('notifications.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: checked,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Simple validation before submit
  const validate = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      return 'Name and email are required.';
    }
    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        return 'New password and confirmation do not match.';
      }
      if (!formData.currentPassword) {
        return 'Please enter your current password to change password.';
      }
      if (formData.newPassword.length < 6) {
        return 'New password must be at least 6 characters.';
      }
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      // Update profile info
      await axiosInstance.put('/user/profile', {
        name: formData.name,
        email: formData.email,
      });

      // Change password if requested
      if (formData.newPassword) {
        await axiosInstance.put('/user/password', {
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
        });
      }

      // Update notifications
      await axiosInstance.put('/user/notifications', {
        notifications: formData.notifications,
      });

      setSuccess('Settings updated successfully.');
      refreshUser(); // Refresh user context if needed
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="alert alert-warning my-5 text-center">
        Please log in to access settings.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status" aria-hidden="true"></div>
        <span className="visually-hidden">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="container my-5" style={{ maxWidth: 600 }}>
      <h2 className="mb-4">Settings</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <hr />

        <h5>Change Password</h5>

        <div className="mb-3">
          <label htmlFor="currentPassword" className="form-label">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            className="form-control"
            value={formData.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            className="form-control"
            value={formData.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="form-control"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        <hr />

        <h5>Notification Preferences</h5>
        <div className="form-check">
          <input
            type="checkbox"
            id="notifyEmail"
            name="notifications.email"
            className="form-check-input"
            checked={formData.notifications.email}
            onChange={handleChange}
          />
          <label htmlFor="notifyEmail" className="form-check-label">
            Email Notifications
          </label>
        </div>
        <div className="form-check">
          <input
            type="checkbox"
            id="notifySMS"
            name="notifications.sms"
            className="form-check-input"
            checked={formData.notifications.sms}
            onChange={handleChange}
          />
          <label htmlFor="notifySMS" className="form-check-label">
            SMS Notifications
          </label>
        </div>
        <div className="form-check mb-4">
          <input
            type="checkbox"
            id="notifyPush"
            name="notifications.push"
            className="form-check-input"
            checked={formData.notifications.push}
            onChange={handleChange}
          />
          <label htmlFor="notifyPush" className="form-check-label">
            Push Notifications
          </label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;

