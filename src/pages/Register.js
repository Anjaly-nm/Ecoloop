import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/register.css';

// NOTE: Set your API URL here
const API_URL = 'http://localhost:4321/api/user/register';

// 🔑 HARDCODED DEFAULT ROLE
const DEFAULT_ROLE = 'user';

const Registration = () => {
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        // role, collectorId, houseNumber, and ward removed from state 
        // as they are no longer user-selectable or needed for other roles.
        houseNumber: '', 
        ward: '' // Sent as 'wardNumber' to the backend
    });
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Role change logic is now irrelevant, just update the state
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setProfilePictureFile(e.target.files[0]);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMsg(''); // Clear previous errors

        // --- VALIDATION ---
        const nameRegex = /^[A-Za-z\s]+$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$/;
        const passwordRegex = /^.{6,8}$/;

        // 🔑 Updated required fields check (role removed)
        if (!formData.name || !formData.username || !formData.email || !formData.password || !formData.phone || !formData.address || !formData.houseNumber.trim() || !formData.ward.trim()) {
            alert('Please fill all required fields, including House Number and Ward.');
            return;
        }

        if (!nameRegex.test(formData.name)) {
            alert('Name should contain only letters and spaces.');
            return;
        }

        if (!emailRegex.test(formData.email)) {
            alert('Please provide a valid email (gmail, yahoo, outlook).');
            return;
        }

        if (!passwordRegex.test(formData.password)) {
            alert('Password must be 6 to 8 characters long.');
            return;
        }
        
        // Conditional validation for 'collectorId' is removed, but the 'user' specific fields 
        // (houseNumber, ward) are still validated above as they are now always required.
        // --- END VALIDATION ---

        // 2. Prepare FormData for submission
        const data = new FormData();
        
        // Append all text fields
        for (const key in formData) {
            // Rename 'ward' to 'wardNumber' for the backend
            if (key === 'ward') {
                data.append('wardNumber', formData[key]); 
            } else {
                data.append(key, formData[key]);
            }
        }

        // 🔑 Append the hardcoded default role
        data.append('role', DEFAULT_ROLE);
        // 🔑 Remove collectorId append since the user is always a 'user'

        // Append the file
        if (profilePictureFile) {
            data.append('profilePicture', profilePictureFile);
        }

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: data, 
            });

            const responseData = await res.json();

            if (res.ok) {
                alert(`Registration successful! Your username is: ${responseData.username || formData.username}`);
                // Reset form fields
                setFormData({
                    name: '', username: '', email: '', password: '', phone: '', address: '',
                    houseNumber: '', ward: ''
                });
                setProfilePictureFile(null); // Reset file state
            } else {
                alert(responseData.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Error connecting to server:', err);
            alert('Error connecting to server. Please try again.');
        }
    };

    return (
        <div className="register-page">
            <div className="register-image">
                <img src="/images/y2.jpg" alt="EcoLoop" />
            </div>

            <div className="register-form-container">
                <form className="register-form" onSubmit={handleRegister}>
                    <h2>🌿 Join <span>EcoLoop</span></h2>
                    <p className="form-subtitle">Create your account to start your eco journey</p>

                    <div className="form-group">
                        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group">
                        <input 
                            type="text" 
                            name="username" 
                            placeholder="Username" 
                            value={formData.username} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <input type="password" name="password" placeholder="Password (6-8 characters)" value={formData.password} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
                    </div>

                    {/* Profile Picture Input */}
                    <div className="form-group">
                        <label htmlFor="profilePicture">Profile Picture (Optional)</label>
                        <input type="file" id="profilePicture" name="profilePicture" onChange={handleFileChange} accept="image/*" />
                    </div>

                    <div className="form-group">
                        <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} required />
                    </div>
                    
                    {/* 🔑 REMOVED: Role selection dropdown */}

                    {/* 🔑 The 'user' specific fields are now always required for this registration form */}
                    <div className="form-group">
                        <input type="text" name="houseNumber" placeholder="House Number" value={formData.houseNumber} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <input type="text" name="ward" placeholder="Ward" value={formData.ward} onChange={handleChange} required />
                    </div>

                    {errorMsg && <p className="error">{errorMsg}</p>}

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