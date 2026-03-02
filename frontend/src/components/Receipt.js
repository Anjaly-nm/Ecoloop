import React from "react";
import moment from "moment";
import { FaPrint, FaDownload } from "react-icons/fa";

const Receipt = ({ submission, subscription, user, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${submission.category}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { font-weight: bold; }
            .value { text-align: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${document.getElementById("receipt-content").innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Actions */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center no-print">
          <h2 className="text-2xl font-bold text-gray-800">📄 Receipt / Invoice</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <FaPrint /> Print
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FaDownload /> Download
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div id="receipt-content" className="p-8">
          {/* Company Header */}
          <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">EcoWaste</h1>
            <p className="text-gray-600">Waste Management & Recycling Service</p>
            <p className="text-sm text-gray-500 mt-2">Receipt / Invoice</p>
          </div>

          {/* Submission Details */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
              Waste Submission Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Submission ID</p>
                <p className="font-semibold text-gray-800">{submission._id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Category</p>
                <p className="font-semibold text-gray-800">{submission.category || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Submitted Date</p>
                <p className="font-semibold text-gray-800">
                  {moment(submission.scheduled_date).format("MMMM DD, YYYY h:mm A")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="font-semibold text-gray-800 capitalize">{submission.status || "N/A"}</p>
              </div>
              {submission.weight && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Weight (kg)</p>
                  <p className="font-semibold text-gray-800">{submission.weight} kg</p>
                </div>
              )}
              {submission.is_immediate && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pickup Type</p>
                  <p className="font-semibold text-gray-800">Immediate Pickup</p>
                </div>
              )}
            </div>
          </div>

          {/* User Details */}
          {user && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-semibold text-gray-800">{user.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-800">{user.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="font-semibold text-gray-800">{user.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="font-semibold text-gray-800">{user.address || "N/A"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          {subscription ? (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Subscription Plan</p>
                  <p className="font-semibold text-gray-800 capitalize">
                    {subscription.plan_type?.replace("_", " ") || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                  <p className="font-semibold text-green-600 text-lg">₹{subscription.amount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <p className="font-semibold text-gray-800 capitalize">{subscription.status || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment ID</p>
                  <p className="font-semibold text-gray-800 text-xs break-all">
                    {subscription.razorpay_payment_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order ID</p>
                  <p className="font-semibold text-gray-800 text-xs break-all">
                    {subscription.razorpay_order_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Date</p>
                  <p className="font-semibold text-gray-800">
                    {subscription.start_date
                      ? moment(subscription.start_date).format("MMMM DD, YYYY")
                      : "N/A"}
                  </p>
                </div>
                {subscription.end_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Subscription Valid Until</p>
                    <p className="font-semibold text-gray-800">
                      {moment(subscription.end_date).format("MMMM DD, YYYY")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Subscription Active</p>
                  <p className={`font-semibold ${subscription.is_active ? "text-green-600" : "text-red-600"}`}>
                    {subscription.is_active ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-semibold">⚠️ No Payment Information Available</p>
              <p className="text-sm text-yellow-700 mt-1">
                This submission was made without an active subscription or payment record.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
            <p className="font-semibold mb-2">Thank you for using EcoWaste services!</p>
            <p>For any queries, please contact our support team.</p>
            <p className="mt-4 text-xs">
              Generated on: {moment().format("MMMM DD, YYYY h:mm A")}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 20px;
          }
          .fixed {
            position: static !important;
            background: white !important;
          }
          .bg-black {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Receipt;






