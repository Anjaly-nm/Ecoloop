import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaCheck, FaTimes, FaEye, FaUser, FaTruck, FaStore } from 'react-icons/fa';

const Applications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState({
    seller: [],
    collector: [],
    deliveryBoy: [],
  });
  const [loading, setLoading] = useState({
    seller: true,
    collector: true,
    deliveryBoy: true,
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedApplicationType, setSelectedApplicationType] = useState('seller'); // seller, collector, delivery-boy
  const [activeTab, setActiveTab] = useState('all'); // all, seller, collector, delivery-boy

  useEffect(() => {
    fetchApplications('seller');
    fetchApplications('collector');
    fetchApplications('delivery-boy');
  }, []);

  const fetchApplications = async (type) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      let response;

      if (type === 'seller') {
        response = await axios.get('http://localhost:4321/api/seller/view-seller-applications');
      } else if (type === 'collector') {
        response = await axios.get('http://localhost:4321/api/user/view-applications');
      } else if (type === 'delivery-boy') {
        response = await axios.get('http://localhost:4321/api/user/view-delivery-applications');
      }

      setApplications(prev => ({
        ...prev,
        [type]: response.data
      }));
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleApprove = async (id, type) => {
    try {
      let response;
      if (type === 'seller') {
        response = await axios.post(`http://localhost:4321/api/seller/approve-seller/${id}`, {
          adminRemarks: 'Application approved by admin'
        });
      } else if (type === 'collector') {
        response = await axios.post(`http://localhost:4321/api/user/approve-collector/${id}`, {
          adminRemarks: 'Application approved by admin'
        });
      } else if (type === 'delivery-boy') {
        response = await axios.post(`http://localhost:4321/api/user/approve-delivery-boy/${id}`, {
          adminRemarks: 'Application approved by admin'
        });
      }

      alert(response.data.message);
      fetchApplications(type); // Refresh the list
    } catch (err) {
      alert('Failed to approve application: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id, type) => {
    const reason = prompt('Enter reason for rejection:');
    if (reason) {
      try {
        let response;
        if (type === 'seller') {
          response = await axios.post(`http://localhost:4321/api/seller/reject-seller/${id}`, {
            adminRemarks: reason
          });
        } else if (type === 'collector') {
          response = await axios.post(`http://localhost:4321/api/user/reject-collector/${id}`, {
            adminRemarks: reason
          });
        } else if (type === 'delivery-boy') {
          response = await axios.post(`http://localhost:4321/api/user/reject-delivery-boy/${id}`, {
            adminRemarks: reason
          });
        }

        alert(response.data.message);
        fetchApplications(type); // Refresh the list
      } catch (err) {
        alert('Failed to reject application: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationTypeName = (type) => {
    switch (type) {
      case 'seller':
        return 'Seller';
      case 'collector':
        return 'Collector';
      case 'delivery-boy':
        return 'Delivery Boy';
      default:
        return 'Application';
    }
  };

  const getApplicationIcon = (type) => {
    switch (type) {
      case 'seller':
        return <FaStore className="text-blue-500" />;
      case 'collector':
        return <FaUser className="text-green-500" />;
      case 'delivery-boy':
        return <FaTruck className="text-orange-500" />;
      default:
        return null;
    }
  };

  const getApplicationsByTab = () => {
    if (activeTab === 'all') {
      return [
        ...applications.seller.map(app => ({ ...app, type: 'seller' })),
        ...applications.collector.map(app => ({ ...app, type: 'collector' })),
        ...applications.deliveryBoy.map(app => ({ ...app, type: 'delivery-boy' })),
      ];
    } else {
      return applications[activeTab].map(app => ({ ...app, type: activeTab }));
    }
  };

  const getApplicationsCount = (type) => {
    if (type === 'all') {
      return applications.seller.length + applications.collector.length + applications.deliveryBoy.length;
    }
    return applications[type]?.length || 0;
  };

  const getPendingApplicationsCount = (type) => {
    if (type === 'all') {
      const allApps = [
        ...applications.seller,
        ...applications.collector,
        ...applications.deliveryBoy,
      ];
      return allApps.filter(app => app.status === 'Pending').length;
    }
    return applications[type]?.filter(app => app.status === 'Pending').length || 0;
  };

  if (selectedApplication) {
    const appType = selectedApplication.type || selectedApplicationType;
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
              <button
                onClick={() => setSelectedApplication(null)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                <FaArrowLeft /> Back to Applications
              </button>
            </div>
          </div>
        </div>

        {/* Application Details */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {appType === 'delivery-boy'
                      ? selectedApplication.name
                      : appType === 'collector'
                        ? selectedApplication.name
                        : selectedApplication.organizationName
                    }
                  </h2>
                  <p className="text-gray-600">{getApplicationTypeName(appType)} Application</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedApplication.status)}`}>
                    {selectedApplication.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Application Details based on type */}
              {appType === 'seller' && (
                <>
                  {/* Organization Details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Organization Name</p>
                        <p className="font-medium">{selectedApplication.organizationName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Organization Type</p>
                        <p className="font-medium">{selectedApplication.organizationType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Registration Number</p>
                        <p className="font-medium">{selectedApplication.registrationNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Year of Establishment</p>
                        <p className="font-medium">{selectedApplication.yearOfEstablishment}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <p className="font-medium">{selectedApplication.website || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Contact Person</p>
                        <p className="font-medium">{selectedApplication.contactPerson}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedApplication.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedApplication.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{selectedApplication.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Waste Processing Details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Processing Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Waste Types Processed</p>
                        <p className="font-medium">
                          {selectedApplication.wasteTypesProcessed?.join(', ') || 'None specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Processing Capacity</p>
                        <p className="font-medium">{selectedApplication.processingCapacity || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Waste Collection Service</p>
                        <p className="font-medium">
                          {selectedApplication.wasteCollectionService ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Government ID Details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Government ID Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">ID Type</p>
                        <p className="font-medium">{selectedApplication.governmentIdType || 'Not specified'}</p>
                      </div>
                      {selectedApplication.governmentIdType === 'Aadhar' && (
                        <div>
                          <p className="text-sm text-gray-500">Aadhar Number</p>
                          <p className="font-medium">{selectedApplication.aadharNumber || 'Not provided'}</p>
                        </div>
                      )}
                      {selectedApplication.governmentIdType === 'License' && (
                        <div>
                          <p className="text-sm text-gray-500">License Number</p>
                          <p className="font-medium">{selectedApplication.licenseNumber || 'Not provided'}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Verification Status</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedApplication.verificationStatus || '')} `}>
                          {selectedApplication.verificationStatus || 'N/A'}
                        </span>
                        {selectedApplication.verificationDetails && (
                          <p className="text-sm text-gray-600 mt-1">{selectedApplication.verificationDetails}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {appType === 'collector' && (
                <>
                  {/* Collector Details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Collector Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{selectedApplication.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedApplication.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedApplication.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{selectedApplication.address}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {appType === 'delivery-boy' && (
                <>
                  {/* Delivery Boy Details */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Boy Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{selectedApplication.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedApplication.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedApplication.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{selectedApplication.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Vehicle Type</p>
                        <p className="font-medium">{selectedApplication.vehicleType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Experience</p>
                        <p className="font-medium">{selectedApplication.experience || 'No experience specified'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Admin Actions */}
              {selectedApplication.status === 'Pending' && (
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(selectedApplication._id, appType)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    <FaCheck /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedApplication._id, appType)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    <FaTimes /> Reject
                  </button>
                </div>
              )}

              {/* Admin Remarks */}
              {selectedApplication.adminRemarks && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Remarks</h3>
                  <p className="text-gray-700">{selectedApplication.adminRemarks}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
                <p>Submitted on: {formatDate(selectedApplication.createdAt)}</p>
                <p>Last updated: {formatDate(selectedApplication.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <button
              onClick={() => navigate('/adminpage')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
            >
              <FaArrowLeft /> Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              All Applications
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {getApplicationsCount('all')}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`whitespace-nowrap flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'seller'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {getApplicationIcon('seller')} Seller
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {getApplicationsCount('seller')}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('collector')}
              className={`whitespace-nowrap flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'collector'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {getApplicationIcon('collector')} Collector
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {getApplicationsCount('collector')}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('delivery-boy')}
              className={`whitespace-nowrap flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'delivery-boy'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {getApplicationIcon('delivery-boy')} Delivery Boy
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {getApplicationsCount('delivery-boy')}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <FaStore className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{applications.seller.length}</h3>
                <p className="text-gray-600">Seller Applications</p>
                <p className="text-sm text-yellow-600">{getPendingApplicationsCount('seller')} pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <FaUser className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{applications.collector.length}</h3>
                <p className="text-gray-600">Collector Applications</p>
                <p className="text-sm text-yellow-600">{getPendingApplicationsCount('collector')} pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <FaTruck className="text-orange-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{applications.deliveryBoy.length}</h3>
                <p className="text-gray-600">Delivery Boy Applications</p>
                <p className="text-sm text-yellow-600">{getPendingApplicationsCount('delivery-boy')} pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {loading.seller && loading.collector && loading.deliveryBoy && activeTab === 'all' ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name / Organization
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getApplicationsByTab().length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    getApplicationsByTab().map((application) => (
                      <tr key={application._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getApplicationIcon(application.type)}
                            <div className="ml-2 text-sm text-gray-900 capitalize">{application.type.replace('-', ' ')}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {application.type === 'delivery-boy'
                              ? application.name
                              : application.type === 'collector'
                                ? application.name
                                : application.organizationName
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {application.type === 'delivery-boy' || application.type === 'collector'
                              ? application.email
                              : application.contactPerson}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.type === 'delivery-boy' || application.type === 'collector'
                              ? application.phone
                              : application.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(application.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(application.status)}`}>
                            {application.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedApplication(application);
                              setSelectedApplicationType(application.type);
                            }}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <FaEye /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;