import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const wasteImages = [
    { src: "images/waste1.jpg", alt: "Plastic waste" },
    { src: "images/waste2.jpg", alt: "Electronic waste" },
    { src: "images/waste3.jpg", alt: "Landfill site" },
    { src: "images/waste4.jpg", alt: "Ocean pollution" },
    { src: "images/waste5.jpg", alt: "Burned waste" },
    { src: "images/waste6.jpg", alt: "Food waste" },
    { src: "images/waste7.jpg", alt: "Recycling plant" },
    { src: "images/waste8.jpg", alt: "Trash in streets" },
  ];

  const pageStyle = {
    fontFamily: "'Montserrat', sans-serif",
    margin: 0,
    padding: 0,
    overflowX: 'hidden',
    color: '#fff',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 3rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    zIndex: 2,
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    letterSpacing: '1px',
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '12px',
  };

  const buttonStyle = {
    padding: '10px 18px',
    backgroundColor: '#ffffff',
    color: '#1c5423ff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  };

  const buttonHoverStyle = {
    backgroundColor: '#2f5233',
    color: '#fff',
  };

  const heroStyle = {
    minHeight: '100vh',
    backgroundImage: 'url("images/ka.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '0 2rem',
    zIndex: 2,
  };

  const headingStyle = {
    fontSize: '3rem',
    fontWeight: '800',
    marginBottom: '1rem',
    maxWidth: '800px',
    lineHeight: '1.2',
  };

  const subTextStyle = {
    fontSize: '1.2rem',
    maxWidth: '600px',
    marginBottom: '2rem',
    color: '#e0e0e0',
  };

  const ctaButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ffffff',
    color: '#2f5233',
    borderRadius: '50px',
    padding: '12px 24px',
    fontSize: '1.1rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  };

  const quoteSectionStyle = {
    position: 'relative',
    zIndex: 2,
    padding: '4rem 2rem',
    backgroundColor: 'rgba(135, 19, 19, 0.1)',
    backdropFilter: 'blur(6px)',
    color: '#090303ff',
    textAlign: 'center',
  };

  const quoteHeadingStyle = {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '2rem',
  };

  const quoteTextStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    fontSize: '1.2rem',
    lineHeight: '1.6',
  };

  const gallerySectionStyle = {
    minHeight: '100vh',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    color: '#333',
    padding: '4rem 2rem',
    textAlign: 'center',
  };

  const galleryHeadingStyle = {
    fontSize: '2.5rem',
    marginBottom: '2rem',
  };

  const imageGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    width: '90%',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const imageStyle = {
    width: '100%',
    height: '250px',
    objectFit: 'cover',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  };

  // ✅ Footer styles
  const footerStyle = {
    backgroundColor: '#1c5423',
    color: '#fff',
    padding: '2rem 1rem',
    textAlign: 'center',
  };

  const footerLinksStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    margin: '1rem 0',
  };

  const footerLinkStyle = {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.3s',
  };

  const footerLinkHover = {
    color: '#a0d468',
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>ECOLOOP</div>
        <div style={buttonGroupStyle}>
          <button
            style={buttonStyle}
            onMouseOver={e => Object.assign(e.target.style, buttonHoverStyle)}
            onMouseOut={e => Object.assign(e.target.style, buttonStyle)}
            onClick={() => navigate('/login')}
          >
            Signin
          </button>
          <button
            style={buttonStyle}
            onMouseOver={e => Object.assign(e.target.style, buttonHoverStyle)}
            onMouseOut={e => Object.assign(e.target.style, buttonStyle)}
            onClick={() => navigate('/register')}
          >
             Register
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div style={heroStyle}>
        <h1 style={headingStyle}>Revolutionize Waste Management</h1>
        <p style={subTextStyle}>
          Join ECOLOOP to track, reduce, and recycle waste with transparency and purpose.
        </p>
        <button
          style={ctaButtonStyle}
          onClick={() => navigate('/about')}
        >
          🌿 More About ECOLOOP
        </button>
      </div>

      {/* Quotes Section */}
      <div style={quoteSectionStyle}>
        <h2 style={quoteHeadingStyle}>♻️</h2>
        <div style={quoteTextStyle}>
          <p>“Waste isn’t waste until we waste it.” – Will.I.Am</p>
          <p>“The greatest threat to our planet is the belief that someone else will save it.” – Robert Swan</p>
          <p>“Reduce what you buy, reuse what you can, recycle what you must.”</p>
          <p>“Every piece of trash you pick up is a step toward a cleaner world.”</p>
        </div>
      </div>

      {/* Waste Image Gallery Section */}
      <div style={gallerySectionStyle}>
        <h2 style={galleryHeadingStyle}>The Waste We Leave Behind</h2>
        <div style={imageGridStyle}>
          {wasteImages.map((img, index) => (
            <img key={index} src={img.src} alt={img.alt} style={imageStyle} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <h3>ECOLOOP</h3>
        <div style={footerLinksStyle}>
          <a
            href="/about"
            style={footerLinkStyle}
            onMouseOver={e => Object.assign(e.target.style, footerLinkHover)}
            onMouseOut={e => Object.assign(e.target.style, footerLinkStyle)}
          >
            About
          </a>
          <a
            href="/contact"
            style={footerLinkStyle}
            onMouseOver={e => Object.assign(e.target.style, footerLinkHover)}
            onMouseOut={e => Object.assign(e.target.style, footerLinkStyle)}
          >
            Contact
          </a>
          <a
            href="/privacy"
            style={footerLinkStyle}
            onMouseOver={e => Object.assign(e.target.style, footerLinkHover)}
            onMouseOut={e => Object.assign(e.target.style, footerLinkStyle)}
          >
            Privacy Policy
          </a>
        </div>
        <p>© {new Date().getFullYear()} ECOLOOP. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Home;
