import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaComments, FaPaperPlane, FaArrowLeft, FaHome, FaInfoCircle, FaUpload } from 'react-icons/fa';

const LeaveApplication = () => {
  const navigate = useNavigate();
  const [leaveData, setLeaveData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'personal',
    reason: '',
    attachment: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    setLeaveData(prev => ({
      ...prev,
      attachment: e.target.files[0]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!leaveData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!leaveData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (leaveData.startDate && leaveData.endDate && new Date(leaveData.startDate) > new Date(leaveData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!leaveData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (leaveData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('startDate', leaveData.startDate);
      formData.append('endDate', leaveData.endDate);
      formData.append('leaveType', leaveData.leaveType);
      formData.append('reason', leaveData.reason);
      
      // Get user token and user data from localStorage
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Add user ID to the form data
      formData.append('userId', user.id || user._id);

      if (leaveData.attachment) {
        formData.append('attachment', leaveData.attachment);
      }

      // Send leave application to backend
      const response = await fetch('http://localhost:4321/api/leave-applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Leave application submitted successfully!');
        setLeaveData({
          startDate: '',
          endDate: '',
          leaveType: 'personal',
          reason: '',
          attachment: null
        });
        navigate('/delivery-dashboard');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting leave application:', error);
      alert(`Error submitting leave application: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    navigate('/delivery-dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leave Application</h1>
              <p className="text-gray-600 mt-1">Submit your leave request for approval</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={goBack}
                className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate('/delivery-dashboard')}
                className="flex items-center px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 rounded-lg transition-colors font-medium"
              >
                <FaHome className="mr-2" />
                Home
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg">
                <FaCalendarAlt className="text-white text-xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">Apply for Leave</h2>
                <p className="text-gray-600">Fill out the form below to request time off</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Start Date */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  Start Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="startDate"
                    value={leaveData.startDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 transition-all ${
                      errors.startDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-gray-400 text-lg" />
                  </div>
                </div>
                {errors.startDate && (
                  <p className="mt-2 text-red-600 font-medium">{errors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-3">
                  End Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="endDate"
                    value={leaveData.endDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 transition-all ${
                      errors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-gray-400 text-lg" />
                  </div>
                </div>
                {errors.endDate && (
                  <p className="mt-2 text-red-600 font-medium">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Leave Type */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Leave Type
              </label>
              <select
                name="leaveType"
                value={leaveData.leaveType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
              >
                <option value="personal">Personal Leave</option>
                <option value="medical">Medical Leave</option>
                <option value="emergency">Emergency Leave</option>
                <option value="vacation">Vacation Leave</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Reason for Leave *
              </label>
              <textarea
                name="reason"
                value={leaveData.reason}
                onChange={handleInputChange}
                rows={5}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 transition-all resize-none ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Please provide a detailed explanation for your leave request..."
              />
              {errors.reason && (
                <p className="mt-2 text-red-600 font-medium">{errors.reason}</p>
              )}
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Supporting Document (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <FaUpload className="text-gray-400 text-3xl mb-4" />
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mb-4">PDF, DOC, DOCX (MAX. 5MB)</p>
                  <input 
                    type="file" 
                    name="attachment" 
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  <label className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg cursor-pointer hover:from-blue-600 hover:to-emerald-600 transition-all font-medium">
                    Choose File
                  </label>
                </div>
                {leaveData.attachment && (
                  <p className="mt-4 text-gray-700 font-medium">
                    Selected: {leaveData.attachment.name}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-6 pt-6">
              <button
                type="button"
                onClick={goBack}
                className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-20 font-medium text-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl hover:from-blue-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-all flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-3" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-2xl p-8">
          <div className="flex items-start">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg text-white">
              <FaInfoCircle className="text-xl" />
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Leave Application Guidelines</h3>
              <ul className="text-gray-700 space-y-2 text-lg">
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">•</span>
                  Submit your leave request at least 3 days in advance
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">•</span>
                  Medical leaves require supporting documents
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">•</span>
                  Emergency leaves can be submitted with short notice
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">•</span>
                  Leave applications are subject to admin approval
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">•</span>
                  You will be notified once your application is reviewed
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplication;