import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SellerApply = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Organization details
    organizationName: '',
    organizationType: '',
    registrationNumber: '',
    yearOfEstablishment: '',
    website: '',
    
    // Contact details
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    
    // Waste processing details
    wasteTypesProcessed: [],
    processingCapacity: '',
    wasteCollectionService: false,
    
    // Fertilizer product details
    fertilizerProducts: [{ productName: '', description: '', certification: '' }],
    
    // Government ID details
    aadharNumber: '', // ✅ Changed from gstNumber to aadharNumber
    licenseNumber: '',
    governmentIdType: ''
  });
  
  // Add state for Aadhar validation (moved to correct position)
  const [aadharValid, setAadharValid] = useState(null); // null = not checked, true = valid, false = invalid
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Helper function to validate Aadhar format
  const validateAadharFormat = (aadharNumber) => {
    // Basic Aadhar format validation (12 digits)
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(aadharNumber);
  };

  // Function to check Aadhar validity in real-time
  const checkAadharValidity = (value) => {
    if (value.length === 0) {
      setAadharValid(null);
    } else if (value.length === 12 && validateAadharFormat(value)) {
      setAadharValid(true);
    } else {
      setAadharValid(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Real-time Aadhar validation
    if (name === 'aadharNumber') {
      checkAadharValidity(value);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleArrayChange = (index, field, value, arrayName) => {
    const newArray = [...formData[arrayName]];
    newArray[index][field] = value;
    setFormData({
      ...formData,
      [arrayName]: newArray
    });
  };

  const addFertilizerProduct = () => {
    setFormData({
      ...formData,
      fertilizerProducts: [...formData.fertilizerProducts, { productName: '', description: '', certification: '' }]
    });
  };

  const removeFertilizerProduct = (index) => {
    if (formData.fertilizerProducts.length > 1) {
      const newArray = [...formData.fertilizerProducts];
      newArray.splice(index, 1);
      setFormData({
        ...formData,
        fertilizerProducts: newArray
      });
    }
  };

  const validateStep = (stepNum) => {
    const newErrors = {};
    
    if (stepNum === 1) {
      if (!formData.organizationName) newErrors.organizationName = 'Organization name is required';
      if (!formData.organizationType) newErrors.organizationType = 'Organization type is required';
      if (!formData.registrationNumber) newErrors.registrationNumber = 'Registration number is required';
      if (!formData.yearOfEstablishment) newErrors.yearOfEstablishment = 'Year of establishment is required';
      if (!formData.contactPerson) newErrors.contactPerson = 'Contact person is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone is required';
      if (!formData.address) newErrors.address = 'Address is required';
    }
    
    if (stepNum === 2) {
      if (formData.wasteTypesProcessed.length === 0) newErrors.wasteTypesProcessed = 'At least one waste type is required';
      if (!formData.processingCapacity) newErrors.processingCapacity = 'Processing capacity is required';
    }
    
    if (stepNum === 3) {
      if (formData.governmentIdType === 'Aadhar' && !formData.aadharNumber) {
        newErrors.aadharNumber = 'Aadhar number is required';
      }
      if (formData.governmentIdType === 'License' && !formData.licenseNumber) {
        newErrors.licenseNumber = 'License number is required';
      }
      if (!formData.governmentIdType) newErrors.governmentIdType = 'Government ID type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('http://localhost:4321/api/seller/apply-seller', formData);
      setSubmissionResult({
        success: true,
        message: response.data.message,
        verificationStatus: response.data.verificationStatus,
        verificationDetails: response.data.verificationDetails
      });
    } catch (error) {
      setSubmissionResult({
        success: false,
        message: error.response?.data?.message || 'An error occurred while submitting the application'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageStyle = {
    fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f5f3ff 100%)',
    color: '#334155',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const headerStyle = {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    marginBottom: '2rem',
    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
  };

  const titleStyle = {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#8b5cf6',
    letterSpacing: '-0.025em',
  };

  const backButtonStyle = {
    padding: '0.75rem 1.75rem',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const backButtonHoverStyle = {
    backgroundColor: '#7c3aed',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 15px rgba(139, 92, 246, 0.3)',
  };

  const headingStyle = {
    fontSize: '2.25rem',
    marginBottom: '1.5rem',
    fontWeight: '800',
    color: '#5b21b6',
    lineHeight: '1.2',
    letterSpacing: '-0.025em',
  };

  const subtitleStyle = {
    fontSize: '1.125rem',
    color: '#64748b',
    marginBottom: '2.5rem',
    maxWidth: '700px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: '1.6',
  };

  const contentStyle = {
    width: '100%',
    maxWidth: '900px',
    textAlign: 'center',
  };

  const formContainerStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '2.5rem',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(10px)',
  };

  const stepIndicatorStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
  };

  const stepStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    margin: '0 10px',
    transition: 'all 0.3s ease',
  };

  const activeStepStyle = {
    ...stepStyle,
    backgroundColor: '#8b5cf6',
    color: 'white',
    borderColor: '#8b5cf6',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
    transform: 'scale(1.1)',
  };

  const completedStepStyle = {
    ...stepStyle,
    backgroundColor: '#22c55e',
    color: 'white',
    borderColor: '#22c55e',
  };

  const formGroupStyle = {
    marginBottom: '1.5rem',
    textAlign: 'left',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#4a5568',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1.125rem',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8fafc',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  };

  const inputFocusStyle = {
    borderColor: '#8b5cf6',
    boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.2)',
    backgroundColor: '#ffffff',
  };

  const errorStyle = {
    color: '#e53e3e',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
  };

  const buttonStyle = {
    padding: '0.875rem 1.75rem',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)',
    minWidth: '140px',
  };

  const buttonHoverStyle = {
    backgroundColor: '#7c3aed',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 15px rgba(139, 92, 246, 0.3)',
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#94a3b8',
    boxShadow: '0 4px 6px rgba(148, 163, 184, 0.2)',
  };

  const secondaryButtonHoverStyle = {
    backgroundColor: '#64748b',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 15px rgba(148, 163, 184, 0.3)',
  };

  const sectionHeadingStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#5b21b6',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #ede9fe',
    textAlign: 'left',
  };

  const checkboxInputStyle = {
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '6px',
    border: '2px solid #cbd5e1',
    accentColor: '#8b5cf6',
    cursor: 'pointer',
  };

  const addButtonStyle = {
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.25rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1rem',
  };

  const removeButtonStyle = {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginLeft: '1rem',
  };

  const productCardStyle = {
    backgroundColor: '#f5f3ff',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #ddd6fe',
  };

  const noteBoxStyle = {
    backgroundColor: '#f3e8ff',
    padding: '1.5rem',
    borderRadius: '12px',
    marginTop: '2.5rem',
    border: '1px solid #e9d5ff',
    boxShadow: '0 4px 6px rgba(139, 92, 246, 0.1)',
  };

  const noteTitleStyle = {
    margin: '0 0 1rem 0',
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: '1.125rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const successMessageStyle = {
    backgroundColor: '#c6f6d5',
    color: '#22543d',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid #9ae6b4',
  };

  const errorMessageStyle = {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '2rem',
    borderRadius: '16px',
    marginBottom: '1.5rem',
    border: '1px solid #fecaca',
    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15)',
  };

  if (submissionResult) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div style={titleStyle}>ECOLOOP</div>
          <button
            style={backButtonStyle}
            onMouseOver={(e) => Object.assign(e.target.style, backButtonHoverStyle)}
            onMouseOut={(e) => Object.assign(e.target.style, backButtonStyle)}
            onClick={() => navigate('/application-options')}
          >
            ← Back to Options
          </button>
        </div>
        
        <div style={contentStyle}>
          <div style={formContainerStyle}>
            <h1 style={headingStyle}>Application Submitted</h1>
            
            {submissionResult.success ? (
              <div style={successMessageStyle}>
                <h2>✅ Success!</h2>
                <p>{submissionResult.message}</p>
                <p><strong>Verification Status:</strong> {submissionResult.verificationStatus}</p>
                {submissionResult.verificationDetails && (
                  <p><strong>Details:</strong> {submissionResult.verificationDetails}</p>
                )}
                <p>We'll review your application and contact you shortly.</p>
              </div>
            ) : (
              <div style={errorMessageStyle}>
                <h2>❌ Error</h2>
                <p>{submissionResult.message}</p>
                <button
                  style={buttonStyle}
                  onClick={() => setSubmissionResult(null)}
                >
                  Try Again
                </button>
              </div>
            )}
            
            <button
              style={buttonStyle}
              onClick={() => navigate('/application-options')}
            >
              Back to Options
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>ECOLOOP</div>
        <button
          style={backButtonStyle}
          onMouseOver={(e) => Object.assign(e.target.style, backButtonHoverStyle)}
          onMouseOut={(e) => Object.assign(e.target.style, backButtonStyle)}
          onClick={() => navigate('/application-options')}
        >
          ← Back to Options
        </button>
      </div>
      
      <div style={contentStyle}>
        <h1 style={headingStyle}>Seller Application</h1>
        <p style={subtitleStyle}>
          Thank you for choosing ECOLOOP to sell your fertilizer products. Please fill out the form below to apply as a seller.
        </p>
        
        <div style={formContainerStyle}>
          {/* Step Indicator */}
          <div style={stepIndicatorStyle}>
            {[1, 2, 3].map((num) => (
              <div 
                key={num} 
                style={num === step ? activeStepStyle : num < step ? completedStepStyle : stepStyle}
              >
                {num}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Step 1: Organization & Contact Details */}
            {step === 1 && (
              <div>
                <h2 style={sectionHeadingStyle}>
                  Organization & Contact Details
                </h2>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Organization Name *</label>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter organization name"
                  />
                  {errors.organizationName && <div style={errorStyle}>{errors.organizationName}</div>}
                </div>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Organization Type *</label>
                  <select
                    name="organizationType"
                    value={formData.organizationType}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="">Select organization type</option>
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                    <option value="NGO">NGO</option>
                    <option value="Cooperative">Cooperative</option>
                  </select>
                  {errors.organizationType && <div style={errorStyle}>{errors.organizationType}</div>}
                </div>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Registration Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter registration number"
                  />
                  {errors.registrationNumber && <div style={errorStyle}>{errors.registrationNumber}</div>}
                </div>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Year of Establishment *</label>
                  <input
                    type="number"
                    name="yearOfEstablishment"
                    value={formData.yearOfEstablishment}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter year of establishment"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                  {errors.yearOfEstablishment && <div style={errorStyle}>{errors.yearOfEstablishment}</div>}
                </div>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Website (Optional)</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="https://www.example.com"
                  />
                </div>
                
                <h3 style={sectionHeadingStyle}>
                  Contact Person
                </h3>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter full name"
                  />
                  {errors.contactPerson && <div style={errorStyle}>{errors.contactPerson}</div>}
                </div>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter email address"
                  />
                  {errors.email && <div style={errorStyle}>{errors.email}</div>}
                </div>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
                </div>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                    placeholder="Enter full address"
                  />
                  {errors.address && <div style={errorStyle}>{errors.address}</div>}
                </div>
              </div>
            )}
            
            {/* Step 2: Waste Processing Details */}
            {step === 2 && (
              <div>
                <h2 style={sectionHeadingStyle}>
                  Waste Processing Details
                </h2>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Waste Types Processed *</label>
                  <select
                    multiple
                    value={formData.wasteTypesProcessed}
                    onChange={(e) => {
                      const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({
                        ...formData,
                        wasteTypesProcessed: selectedValues
                      });
                    }}
                    style={{ ...inputStyle, minHeight: '120px' }}
                  >
                    <option value="Organic">Organic Waste</option>
                    <option value="Plastic">Plastic Waste</option>
                    <option value="Paper">Paper Waste</option>
                    <option value="Metal">Metal Waste</option>
                    <option value="Glass">Glass Waste</option>
                    <option value="Electronic">Electronic Waste</option>
                    <option value="Textile">Textile Waste</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.wasteTypesProcessed && <div style={errorStyle}>{errors.wasteTypesProcessed}</div>}
                  <small>Select multiple options by holding Ctrl (Windows) or Cmd (Mac)</small>
                </div>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Processing Capacity (per day) *</label>
                  <input
                    type="text"
                    name="processingCapacity"
                    value={formData.processingCapacity}
                    onChange={handleInputChange}
                    style={inputStyle}
                    placeholder="e.g., 100 kg/day, 5 tons/month"
                  />
                  {errors.processingCapacity && <div style={errorStyle}>{errors.processingCapacity}</div>}
                </div>
                
                <div style={formGroupStyle}>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      name="wasteCollectionService"
                      checked={formData.wasteCollectionService}
                      onChange={handleInputChange}
                      style={checkboxInputStyle}
                    />
                    Do you provide waste collection services?
                  </label>
                </div>
                
                <h3 style={sectionHeadingStyle}>
                  Fertilizer Products
                </h3>
                
                {formData.fertilizerProducts.map((product, index) => (
                  <div key={index} style={productCardStyle}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Product #{index + 1}</h4>
                    
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Product Name</label>
                      <input
                        type="text"
                        value={product.productName}
                        onChange={(e) => handleArrayChange(index, 'productName', e.target.value, 'fertilizerProducts')}
                        style={inputStyle}
                        placeholder="Enter product name"
                      />
                    </div>
                    
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Description</label>
                      <textarea
                        value={product.description}
                        onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'fertilizerProducts')}
                        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        placeholder="Enter product description"
                      />
                    </div>
                    
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Certification</label>
                      <input
                        type="text"
                        value={product.certification}
                        onChange={(e) => handleArrayChange(index, 'certification', e.target.value, 'fertilizerProducts')}
                        style={inputStyle}
                        placeholder="Enter certification details"
                      />
                    </div>
                    
                    {formData.fertilizerProducts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFertilizerProduct(index)}
                        style={removeButtonStyle}
                      >
                        Remove Product
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addFertilizerProduct}
                  style={addButtonStyle}
                >
                  + Add Another Product
                </button>
              </div>
            )}
            
            {/* Step 3: Government ID Details */}
            {step === 3 && (
              <div>
                <h2 style={sectionHeadingStyle}>
                  Government ID Details
                </h2>
                
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Government ID Type *</label>
                  <select
                    name="governmentIdType"
                    value={formData.governmentIdType}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="">Select ID type</option>
                    <option value="Aadhar">Aadhar Number</option>
                    <option value="License">Business License</option>
                  </select>
                  {errors.governmentIdType && <div style={errorStyle}>{errors.governmentIdType}</div>}
                </div>
                
                {formData.governmentIdType === 'Aadhar' && (
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Aadhar Number *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        name="aadharNumber"
                        value={formData.aadharNumber}
                        onChange={handleInputChange}
                        style={{
                          ...inputStyle,
                          paddingRight: '40px' // Space for the validation icon
                        }}
                        placeholder="Enter Aadhar number"
                        maxLength="12"
                      />
                      {aadharValid !== null && (
                        <div style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '1.2rem'
                        }}>
                          {aadharValid ? (
                            <span style={{ color: '#48bb78' }}>✓</span> // Green tick
                          ) : (
                            <span style={{ color: '#e53e3e' }}>✗</span> // Red cross
                          )}
                        </div>
                      )}
                    </div>
                    {errors.aadharNumber && <div style={errorStyle}>{errors.aadharNumber}</div>}
                    <small>Format: 12 digits (e.g., 123456789012)</small>
                  </div>
                )}
                
                {formData.governmentIdType === 'License' && (
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="Enter license number"
                    />
                    {errors.licenseNumber && <div style={errorStyle}>{errors.licenseNumber}</div>}
                  </div>
                )}
                
                <div style={noteBoxStyle}>
                  <h3 style={noteTitleStyle}>📝 Note</h3>
                  <p>Your government ID will be automatically verified for format compliance. Our team will manually verify the authenticity of the documents after submission.</p>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div style={buttonContainerStyle}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  style={secondaryButtonStyle}
                  onMouseOver={(e) => Object.assign(e.target.style, secondaryButtonHoverStyle)}
                  onMouseOut={(e) => Object.assign(e.target.style, secondaryButtonStyle)}
                >
                  ← Previous
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  style={buttonStyle}
                  onMouseOver={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                  onMouseOut={(e) => Object.assign(e.target.style, buttonStyle)}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ ...buttonStyle, opacity: isSubmitting ? 0.7 : 1 }}
                  onMouseOver={(e) => Object.assign(e.target.style, buttonHoverStyle)}
                  onMouseOut={(e) => Object.assign(e.target.style, buttonStyle)}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerApply;
