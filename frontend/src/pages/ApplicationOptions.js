import React from 'react';
import { useNavigate } from 'react-router-dom';

const ApplicationOptions = () => {
  const navigate = useNavigate();

  const handleOptionSelect = (path) => {
    navigate(path);
  };

  const pageStyle = {
    fontFamily: "'Montserrat', sans-serif",
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)',
    color: '#333',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const headerStyle = {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
  };

  const titleStyle = {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#2c5282',
  };

  const backButtonStyle = {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#2c5282',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const backButtonHoverStyle = {
    backgroundColor: '#1a3c6c',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
  };

  const contentStyle = {
    width: '100%',
    maxWidth: '900px',
    textAlign: 'center',
  };

  const headingStyle = {
    fontSize: '2.2rem',
    marginBottom: '0.8rem',
    fontWeight: '800',
    color: '#2c5282',
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
  };

  const subtitleStyle = {
    fontSize: '1.1rem',
    marginBottom: '2rem',
    color: '#4a5568',
    fontWeight: '400',
  };

  const cardsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem',
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '1.5rem 1rem',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  };

  const cardHoverStyle = {
    transform: 'translateY(-6px)',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    boxShadow: '0 12px 25px rgba(0, 0, 0, 0.12)',
  };

  const cardIconStyle = {
    fontSize: '3rem',
    marginBottom: '1rem',
    color: '#3182ce',
  };

  const cardTitleStyle = {
    fontSize: '1.4rem',
    fontWeight: '700',
    marginBottom: '0.75rem',
    color: '#2c5282',
  };

  const cardDescriptionStyle = {
    fontSize: '0.95rem',
    color: '#4a5568',
    marginBottom: '1.25rem',
    lineHeight: '1.5',
  };

  const cardButtonStyle = {
    padding: '0.7rem 1.5rem',
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const cardButtonHoverStyle = {
    backgroundColor: '#2c5282',
    transform: 'translateY(-1px)',
    boxShadow: '0 5px 7px rgba(0, 0, 0, 0.12)',
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>ECOLOOP</div>
        <button
          style={backButtonStyle}
          onMouseOver={(e) => Object.assign(e.target.style, backButtonHoverStyle)}
          onMouseOut={(e) => Object.assign(e.target.style, backButtonStyle)}
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        <h1 style={headingStyle}>Join Our Community</h1>
        <p style={subtitleStyle}>
          Select the option that best describes your interest in ECOLOOP
        </p>

        <div style={cardsContainerStyle}>
          {/* Collector Apply Card */}
          <div
            style={cardStyle}
            onMouseOver={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
            onMouseOut={(e) => Object.assign(e.currentTarget.style, cardStyle)}
            onClick={() => handleOptionSelect('/CollectorApply')}
          >
            <div style={cardIconStyle}>🚛</div>
            <h2 style={cardTitleStyle}>Collector</h2>
            <p style={cardDescriptionStyle}>
              Apply to become a certified waste collector in your area
            </p>
            <button 
              style={cardButtonStyle}
              onMouseOver={(e) => Object.assign(e.target.style, cardButtonHoverStyle)}
              onMouseOut={(e) => Object.assign(e.target.style, cardButtonStyle)}
            >
              Apply Now
            </button>
          </div>

          {/* Seller Apply Card */}
          <div
            style={cardStyle}
            onMouseOver={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
            onMouseOut={(e) => Object.assign(e.currentTarget.style, cardStyle)}
            onClick={() => handleOptionSelect('/seller-apply')}
          >
            <div style={cardIconStyle}>🏪</div>
            <h2 style={cardTitleStyle}>Seller</h2>
            <p style={cardDescriptionStyle}>
              Offer products or services in our eco-friendly marketplace
            </p>
            <button 
              style={cardButtonStyle}
              onMouseOver={(e) => Object.assign(e.target.style, cardButtonHoverStyle)}
              onMouseOut={(e) => Object.assign(e.target.style, cardButtonStyle)}
            >
              Apply Now
            </button>
          </div>

          {/* Delivery Boy Apply Card */}
          <div
            style={cardStyle}
            onMouseOver={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
            onMouseOut={(e) => Object.assign(e.currentTarget.style, cardStyle)}
            onClick={() => handleOptionSelect('/delivery-boy-apply')}
          >
            <div style={cardIconStyle}>🚴‍♂️</div>
            <h2 style={cardTitleStyle}>Delivery Boy</h2>
            <p style={cardDescriptionStyle}>
              Join our delivery team and help us serve customers
            </p>
            <button 
              style={cardButtonStyle}
              onMouseOver={(e) => Object.assign(e.target.style, cardButtonHoverStyle)}
              onMouseOut={(e) => Object.assign(e.target.style, cardButtonStyle)}
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationOptions;