import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const { axiosInstance } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, counselorsRes, sessionsRes, feedbacksRes] = await Promise.all([
          axiosInstance.get('/admin/users'),
          axiosInstance.get('/admin/counselors'),
          axiosInstance.get('/admin/sessions'),
          axiosInstance.get('/admin/feedbacks')
        ]);

        setUsers(usersRes.data);
        setCounselors(counselorsRes.data);
        setSessions(sessionsRes.data);
        setFeedbacks(feedbacksRes.data);
      } catch (error) {
        console.error('Error fetching admin data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [axiosInstance]);

  const handleApprove = async (id) => {
    try {
      await axiosInstance.patch(`/admin/counselors/${id}/approve`);
      setCounselors(prev =>
        prev.map(c => c.id === id ? { ...c, approved: true } : c)
      );
    } catch (err) {
      console.error('Approve failed', err);
    }
  };

  const handleDeny = async (id) => {
    try {
      await axiosInstance.patch(`/admin/counselors/${id}/deny`);
      setCounselors(prev =>
        prev.map(c => c.id === id ? { ...c, approved: false } : c)
      );
    } catch (err) {
      console.error('Deny failed', err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure to delete this user?')) return;
    try {
      await axiosInstance.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const renderUsersTable = () => (
    <section>
      <h4>Users ({users.length})</h4>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  const renderCounselorsTable = () => (
    <section>
      <h4>Counselors ({counselors.length})</h4>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Specialties</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {counselors.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.specialties.join(', ')}</td>
              <td>{c.approved ? 'Approved' : 'Pending'}</td>
              <td>
                {!c.approved ? (
                  <button className="btn btn-success btn-sm me-2" onClick={() => handleApprove(c.id)}>
                    Approve
                  </button>
                ) : (
                  <button className="btn btn-warning btn-sm" onClick={() => handleDeny(c.id)}>
                    Deny
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  const renderSessionsTable = () => (
    <section>
      <h4>Sessions ({sessions.length})</h4>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>ID</th><th>Client</th><th>Counselor</th><th>Status</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.client_name}</td>
              <td>{s.counselor_name}</td>
              <td>{s.status}</td>
              <td>{s.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  const renderFeedbacksTable = () => (
    <section>
      <h4>Feedbacks ({feedbacks.length})</h4>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>ID</th><th>From</th><th>Session ID</th><th>Rating</th><th>Comment</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map(fb => (
            <tr key={fb.id}>
              <td>{fb.id}</td>
              <td>{fb.user_name}</td>
              <td>{fb.session_id}</td>
              <td>{fb.rating}</td>
              <td>{fb.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid my-4">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 mb-4">
          <div className="list-group">
            <button onClick={() => setActiveTab('users')} className={`list-group-item list-group-item-action ${activeTab === 'users' && 'active'}`}>Users</button>
            <button onClick={() => setActiveTab('counselors')} className={`list-group-item list-group-item-action ${activeTab === 'counselors' && 'active'}`}>Counselors</button>
            <button onClick={() => setActiveTab('sessions')} className={`list-group-item list-group-item-action ${activeTab === 'sessions' && 'active'}`}>Sessions</button>
            <button onClick={() => setActiveTab('feedbacks')} className={`list-group-item list-group-item-action ${activeTab === 'feedbacks' && 'active'}`}>Feedbacks</button>
          </div>
        </div>

        {/* Content */}
        <div className="col-md-9">
          {activeTab === 'users' && renderUsersTable()}
          {activeTab === 'counselors' && renderCounselorsTable()}
          {activeTab === 'sessions' && renderSessionsTable()}
          {activeTab === 'feedbacks' && renderFeedbacksTable()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

