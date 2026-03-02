import React from 'react';
import { useNavigate } from 'react-router-dom';

const EventManagement = () => {
  const navigate = useNavigate();

  const pageStyle = {
    fontFamily: "'Montserrat', sans-serif",
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1c5423 0%, #2f5233 100%)',
    color: '#fff',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const headerStyle = {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    marginBottom: '2rem',
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
  };

  const backButtonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#ffffff',
    color: '#1c5423',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  };

  const contentStyle = {
    width: '100%',
    maxWidth: '800px',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '3rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const headingStyle = {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    fontWeight: '800',
  };

  const textStyle = {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    color: '#e0e0e0',
  };

  const comingSoonStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#a0d468',
    marginTop: '2rem',
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>ECOLOOP</div>
        <button
          style={backButtonStyle}
          onClick={() => navigate('/application-options')}
        >
          ← Back to Options
        </button>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        <h1 style={headingStyle}>Event Management</h1>
        <p style={textStyle}>
          Thank you for your interest in organizing or participating in environmental events with ECOLOOP!
        </p>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📅</div>
        <p style={textStyle}>
          Our event management portal is currently under development. We're working to create a platform where communities can organize and participate in environmental cleanup events, educational workshops, and sustainability initiatives.
        </p>
        <p style={comingSoonStyle}>
          Coming Soon!
        </p>
        <p style={textStyle}>
          Please check back later or contact us for more information.
        </p>
      </div>
    </div>
  );
};

export default EventManagement;