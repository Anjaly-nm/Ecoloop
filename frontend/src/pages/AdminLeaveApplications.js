import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaCheck, FaTimes, FaFilter, FaSearch, FaInbox, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AdminLeaveApplications = () => {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Fetch actual leave applications from the database
  useEffect(() => {
    const fetchLeaveApplications = async () => {
      try {
        setLoading(true);

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // Make API call to fetch leave applications
        // const response = await fetch('http://localhost:4321/api/leave-applications', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // });

        // Make API call to fetch leave applications
        const response = await fetch('http://localhost:4321/api/leave-applications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Map _id to id for consistent access
          const applicationsWithId = (data.applications || []).map(app => ({
            ...app,
            id: app._id
          }));
          setLeaveApplications(applicationsWithId);
        } else {
          console.error('Failed to fetch leave applications');
          setLeaveApplications([]);
        }
      } catch (error) {
        console.error('Error fetching leave applications:', error);
        setLeaveApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveApplications();
  }, []);

  useEffect(() => {
    let filtered = leaveApplications;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [filterStatus, searchTerm, leaveApplications]);

  const updateApplicationStatus = async (id, newStatus) => {
    try {
      // Update the status in the local state immediately for better UX
      setLeaveApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );

      // Get token from localStorage
      const token = localStorage.getItem('token');

      // Make API call to update the application status
      const response = await fetch(`http://localhost:4321/api/leave-applications/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        // Revert the status if the API call fails
        setLeaveApplications(prev =>
          prev.map(app =>
            app.id === id ? { ...app, status: app.status } : app
          )
        );
        throw new Error('Failed to update application status');
      }

      // Update the filtered applications as well
      setFilteredApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error('Error updating application status:', error);
      // In a real app, you might want to show an error message to the user
      alert(`Error updating application status: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Rejected</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">Pending</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={goBack}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Go back"
                >
                  <FaArrowLeft className="text-gray-600 text-xl" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Leave Applications</h1>
                  <p className="text-gray-600 mt-1">Manage delivery boy leave requests</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading leave applications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={goBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Go back"
              >
                <FaArrowLeft className="text-gray-600 text-xl" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Leave Applications</h1>
                <p className="text-gray-600 mt-1">Manage delivery boy leave requests</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row - Different from card layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900">{leaveApplications.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaCalendarAlt className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900">
                  {leaveApplications.filter(app => app.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaClock className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-gray-900">
                  {leaveApplications.filter(app => app.status === 'approved').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheck className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-gray-900">
                  {leaveApplications.filter(app => app.status === 'rejected').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FaTimes className="text-red-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search - Unique layout */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80"
                />
              </div>

              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-48"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaFilter className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unique application list layout */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gray-100 rounded-full">
                  <FaInbox className="text-gray-400 text-4xl" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No leave applications found</h3>
              <p className="text-gray-500 mb-6">
                {leaveApplications.length === 0
                  ? "There are currently no leave applications to review."
                  : "No applications match your current filters."
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                          {application.employeeName.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {application.employeeName}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {application.employeeId}
                          </span>
                          {getStatusBadge(application.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <FaCalendarAlt className="mr-1 text-xs" />
                            {formatDate(application.startDate)} - {formatDate(application.endDate)} ({Math.ceil((new Date(application.endDate) - new Date(application.startDate)) / (1000 * 60 * 60 * 24)) + 1} days)
                          </span>
                          <span className="flex items-center">
                            <FaClock className="mr-1 text-xs" />
                            {formatDate(application.appliedDate)}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {application.leaveType}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-700">
                          <strong>Reason:</strong> {application.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {application.attachment && (
                      <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                        <FaDownload className="h-5 w-5" />
                      </button>
                    )}
                    {application.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'approved')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <FaCheck className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTimes className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => setSelectedApplication(null)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div
                className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white px-6 pt-5 pb-6 sm:p-8 sm:pb-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl leading-6 font-bold text-gray-900">
                          Leave Application Details
                        </h3>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => setSelectedApplication(null)}
                        >
                          <FaTimes className="h-6 w-6" />
                        </button>
                      </div>

                      <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                            <div className="text-lg text-gray-900 font-medium">{selectedApplication.employeeName}</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <div className="text-lg text-gray-900 font-medium">{selectedApplication.employeeId}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <div className="text-lg text-gray-900">{formatDate(selectedApplication.startDate)}</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <div className="text-lg text-gray-900">{formatDate(selectedApplication.endDate)}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                            <div className="text-lg text-gray-900">{selectedApplication.leaveType}</div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label>
                            <div className="text-lg text-gray-900">{formatDate(selectedApplication.appliedDate)}</div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                          <div className="text-lg text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedApplication.reason}</div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <div className="text-lg">{getStatusBadge(selectedApplication.status)}</div>
                        </div>

                        {selectedApplication.attachment && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                            <div className="flex items-center">
                              <button className="text-blue-600 hover:text-blue-800 underline flex items-center">
                                <FaDownload className="mr-2" />
                                {selectedApplication.attachment}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse">
                  {selectedApplication.status === 'pending' && (
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-3 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={async () => {
                          try {
                            await updateApplicationStatus(selectedApplication.id, 'approved');
                            setSelectedApplication(null);
                          } catch (error) {
                            console.error('Error approving application:', error);
                          }
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-3 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={async () => {
                          try {
                            await updateApplicationStatus(selectedApplication.id, 'rejected');
                            setSelectedApplication(null);
                          } catch (error) {
                            console.error('Error rejecting application:', error);
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setSelectedApplication(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeaveApplications;