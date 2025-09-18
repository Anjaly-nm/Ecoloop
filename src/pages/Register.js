// Registration.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/register.css';

const Registration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: '',
    collectorId: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation Regex
    const nameRegex = /^[A-Za-z\s]+$/; // Only letters and spaces
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$/;
    const passwordRegex = /^.{6,8}$/; // 6-8 characters

    // Basic required fields check
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.address || !formData.role) {
      alert('Please fill all required fields');
      return;
    }

    // Name validation
    if (!nameRegex.test(formData.name)) {
      alert('Name should contain only letters and spaces');
      return;
    }

    // Email validation
    if (!emailRegex.test(formData.email)) {
      alert('Please provide a valid email (gmail, yahoo, outlook)');
      return;
    }

    // Password validation
    if (!passwordRegex.test(formData.password)) {
      alert('Password must be 6 to 8 characters long');
      return;
    }

    // Collector ID required if role is Collector
    if (formData.role === 'Collector' && !formData.collectorId.trim()) {
      alert('Collector ID is required for collectors');
      return;
    }

    try {
      const res = await fetch('http://localhost:4321/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert('Registration successful!');
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          address: '',
          role: '',
          collectorId: ''
        });
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  return (
    <div className="register-page">
      {/* Left Side Image */}
      <div className="register-image">
        <img src="/images/y2.jpg" alt="EcoLoop" />
      </div>

      {/* Right Side Form */}
      <div className="register-form-container">
        <form className="register-form" onSubmit={handleRegister}>
          <h2>🌿 Join <span>EcoLoop</span></h2>
          <p className="form-subtitle">Create your account to start your eco journey</p>

          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password (6-8 characters)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select Role</option>
              <option value="Seller">Seller</option>
              <option value="Collector">Collector</option>
              <option value="User">User</option>
            </select>
          </div>

          {/* Collector ID: only show if role is Collector */}
          {formData.role === 'Collector' && (
            <div className="form-group">
              <input
                type="text"
                name="collectorId"
                placeholder="Collector ID"
                value={formData.collectorId}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-register">Register</button>

          <p className="login-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Registration;
