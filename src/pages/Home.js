import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <header className="hero-section text-white d-flex align-items-center justify-content-center">
        <div className="text-center bg-dark bg-opacity-50 p-5 rounded">
          <h1 className="display-4 fw-bold">Strengthen Your Marriage with Professional Counseling</h1>
          <p className="lead mt-3">Get matched with licensed counselors specializing in marriage therapy.</p>
          <button className="btn btn-light btn-lg mt-4" onClick={() => navigate('/signup')}>
            Get Started
          </button>
        </div>
      </header>

      {/* How It Works */}
      <section className="container py-5">
        <h2 className="text-center mb-4">How It Works</h2>
        <div className="row text-center">
          <div className="col-md-4">
            <h5>1. Sign Up</h5>
            <p>Create a free account in minutes.</p>
          </div>
          <div className="col-md-4">
            <h5>2. Choose a Counselor</h5>
            <p>View profiles and select based on your needs.</p>
          </div>
          <div className="col-md-4">
            <h5>3. Begin Counseling</h5>
            <p>Book sessions, chat, and grow together.</p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="text-center mb-4">Why Choose LoveTalk?</h2>
          <div className="row text-center">
            <div className="col-md-4">
              <h6>Licensed Experts</h6>
              <p>Certified professionals with marriage experience.</p>
            </div>
            <div className="col-md-4">
              <h6>Private & Secure</h6>
              <p>Your sessions and data are fully encrypted.</p>
            </div>
            <div className="col-md-4">
              <h6>Flexible Scheduling</h6>
              <p>Book your sessions at your convenience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-5">
        <h2 className="text-center mb-4">What Couples Are Saying</h2>
        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow-sm">
              <p>"We were on the edge... LoveTalk brought us closer than ever!"</p>
              <h6>- Sam & Lily</h6>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card p-3 shadow-sm">
              <p>"The best decision we made this year was signing up."</p>
              <h6>- Ahmed & Fatima</h6>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

