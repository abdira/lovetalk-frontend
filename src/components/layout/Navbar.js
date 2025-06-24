import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">LoveTalk</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
          aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <NavLink className="nav-link" to="/counselors">Find Counselors</NavLink>
            </li>

            {!user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
                <li className="nav-item ms-2">
                  <NavLink className="btn btn-primary text-white" to="/signup">Sign Up</NavLink>
                </li>
              </>
            )}

            {user && (
              <>
                {user.role === 'client' && (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
                  </li>
                )}
                {user.role === 'counselor' && (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/counselor-dashboard">Counselor Dashboard</NavLink>
                  </li>
                )}
                {/* Add admin link if needed */}

                <li className="nav-item dropdown ms-3">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#!"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {user.name}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><NavLink className="dropdown-item" to="/settings">Settings</NavLink></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                  </ul>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

