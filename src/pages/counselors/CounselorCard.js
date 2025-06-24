import React from 'react';
import { Link } from 'react-router-dom';

const CounselorCard = ({ counselor }) => {
  const {
    id,
    name,
    photo_url,
    specialties,
    languages,
    rating,
    gender,
    bio,
  } = counselor;

  // Helper to render stars for rating
  const renderStars = (rating) => {
    const stars = [];
    for(let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`bi bi-star${i <= rating ? '-fill text-warning' : ''}`}
          aria-hidden="true"
          style={{marginRight: 2}}
        />
      );
    }
    return stars;
  };

  return (
    <div className="card h-100 shadow-sm">
      <img
        src={photo_url || '/default-avatar.png'}
        alt={`Photo of ${name}`}
        className="card-img-top"
        style={{ objectFit: 'cover', height: '220px' }}
      />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{name}</h5>
        <p className="mb-1">
          {renderStars(rating)} <small className="text-muted">({rating.toFixed(1)})</small>
        </p>
        <p className="mb-1 text-truncate" title={bio}>{bio}</p>
        <p className="mb-1">
          <strong>Specialties:</strong> {specialties.join(', ')}
        </p>
        <p className="mb-2">
          <strong>Languages:</strong> {languages.join(', ')}
        </p>
        <Link to={`/booking/${id}`} className="btn btn-primary mt-auto align-self-start">
          View Profile & Book
        </Link>
      </div>
    </div>
  );
};

export default CounselorCard;

