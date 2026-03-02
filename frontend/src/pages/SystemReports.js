import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaChartLine, FaCalendarAlt, FaRecycle, FaTrashAlt, FaBox, FaUsers, FaDollarSign, FaArrowLeft, FaDownload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const SystemReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [monthlyWasteData, setMonthlyWasteData] = useState([]);
  const [wasteByCategory, setWasteByCategory] = useState([]);
  const [wasteByWard, setWasteByWard] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Function to download the monthly waste report as PDF
  const downloadMonthlyReport = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Monthly Waste Collection Report', 20, 20);
    
    // Add report generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add summary stats
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, 45);
    
    const totalCollected = monthlyWasteData.reduce((sum, month) => sum + month.collected, 0);
    const totalRecycled = monthlyWasteData.reduce((sum, month) => sum + month.recycled, 0);
    const totalDisposed = monthlyWasteData.reduce((sum, month) => sum + month.disposed, 0);
    
    doc.setFontSize(12);
    doc.text(`Total Collected: ${totalCollected.toLocaleString()} kg`, 20, 55);
    doc.text(`Total Recycled: ${totalRecycled.toLocaleString()} kg`, 20, 65);
    doc.text(`Total Disposed: ${totalDisposed.toLocaleString()} kg`, 20, 75);
    
    // Add monthly data table
    doc.setFontSize(14);
    doc.text('Monthly Waste Data', 20, 90);
    
    const tableColumn = ["Month", "Collected (kg)", "Recycled (kg)", "Disposed (kg)"];
    const tableRows = monthlyWasteData.map(item => [
      item.month,
      item.collected.toLocaleString(),
      item.recycled.toLocaleString(),
      item.disposed.toLocaleString()
    ]);
    
    // Add table to the PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 100,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [59, 130, 246], // blue-500
      },
    });
    
    // Add waste by category chart
    doc.setFontSize(14);
    doc.text('Waste Distribution by Category', 20, doc.lastAutoTable.finalY + 15);
    
    const categoryColumn = ["Category", "Percentage"];
    const categoryRows = wasteByCategory.map(item => [
      item.name,
      `${item.value}%`
    ]);
    
    autoTable(doc, {
      head: [categoryColumn],
      body: categoryRows,
      startY: doc.lastAutoTable.finalY + 25,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [16, 185, 129], // green-500
      },
    });
    
    // Add waste by ward chart
    doc.setFontSize(14);
    doc.text('Waste Collection by Ward', 20, doc.lastAutoTable.finalY + 15);
    
    const wardColumn = ["Ward", "Collected (kg)"];
    const wardRows = wasteByWard.map(item => [
      item.ward,
      item.collected.toLocaleString()
    ]);
    
    autoTable(doc, {
      head: [wardColumn],
      body: wardRows,
      startY: doc.lastAutoTable.finalY + 25,
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [139, 92, 246], // purple-500
      },
    });
    
    // Add footer
    doc.setFontSize(10);
    doc.text('EcoLoop Waste Management System', 20, doc.lastAutoTable.finalY + 20);
    
    // Save the PDF
    doc.save(`Monthly-Waste-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Fetch real data from the backend
  useEffect(() => {
    const fetchWasteData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Fetch waste submissions data
        const response = await axios.get('http://localhost:4321/api/pickups', {
          headers: { token }
        });
        
        // Process the data to group by month
        const processedData = processWasteData(response.data.pickups);
        
        setMonthlyWasteData(processedData.monthlyData);
        setWasteByCategory(processedData.categoryData);
        setWasteByWard(processedData.wardData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching waste data:', error);
        
        // Fallback to dummy data if API call fails
        setMonthlyWasteData([
          { month: 'Jan', collected: 1200, recycled: 800, disposed: 400 },
          { month: 'Feb', collected: 1900, recycled: 1200, disposed: 700 },
          { month: 'Mar', collected: 1500, recycled: 1000, disposed: 500 },
          { month: 'Apr', collected: 2100, recycled: 1400, disposed: 700 },
          { month: 'May', collected: 1800, recycled: 1200, disposed: 600 },
          { month: 'Jun', collected: 2400, recycled: 1600, disposed: 800 },
          { month: 'Jul', collected: 2200, recycled: 1500, disposed: 700 },
          { month: 'Aug', collected: 2600, recycled: 1800, disposed: 800 },
          { month: 'Sep', collected: 2000, recycled: 1400, disposed: 600 },
          { month: 'Oct', collected: 2300, recycled: 1600, disposed: 700 },
          { month: 'Nov', collected: 1900, recycled: 1300, disposed: 600 },
          { month: 'Dec', collected: 2500, recycled: 1700, disposed: 800 },
        ]);

        setWasteByCategory([
          { name: 'Plastic', value: 35 },
          { name: 'Paper', value: 25 },
          { name: 'Metal', value: 15 },
          { name: 'Organic', value: 15 },
          { name: 'Glass', value: 10 },
        ]);

        setWasteByWard([
          { ward: 'Ward 1', collected: 450 },
          { ward: 'Ward 2', collected: 380 },
          { ward: 'Ward 3', collected: 520 },
          { ward: 'Ward 4', collected: 410 },
          { ward: 'Ward 5', collected: 390 },
          { ward: 'Ward 6', collected: 470 },
          { ward: 'Ward 7', collected: 510 },
          { ward: 'Ward 8', collected: 430 },
        ]);
        
        setLoading(false);
      }
    };
    
    fetchWasteData();
  }, []);
  
  // Function to process raw waste data into monthly/ward/category aggregations
  const processWasteData = (rawData) => {
    // Group by month
    const monthlyMap = {};
    const categoryMap = {};
    const wardMap = {};
    
    rawData.forEach(submission => {
      // Parse the submission date
      const date = new Date(submission.createdAt || submission.date || submission.scheduled_date);
      const month = date.toLocaleString('default', { month: 'short' });
      
      // Initialize monthly data
      if (!monthlyMap[month]) {
        monthlyMap[month] = { collected: 0, recycled: 0, disposed: 0 };
      }
      
      // Calculate weight based on the submission
      const weight = parseFloat(submission.weight) || 0;
      monthlyMap[month].collected += weight;
      
      // Calculate recycled/disposed based on status
      if (submission.status === 'processed') {
        monthlyMap[month].recycled += weight * 0.7; // Assume 70% gets recycled
        monthlyMap[month].disposed += weight * 0.3; // Remaining 30% disposed
      } else {
        monthlyMap[month].recycled += weight * 0.3; // Lower percentage if not processed
        monthlyMap[month].disposed += weight * 0.7;
      }
      
      // Aggregate by category
      const category = submission.category || 'Uncategorized';
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += weight;
      
      // Aggregate by ward
      const ward = submission.ward || 'Ward Unknown';
      if (!wardMap[ward]) {
        wardMap[ward] = 0;
      }
      wardMap[ward] += weight;
    });
    
    // Convert monthly map to array
    const monthlyData = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      collected: Math.round(data.collected),
      recycled: Math.round(data.recycled),
      disposed: Math.round(data.disposed)
    }));
    
    // Convert category map to array with percentages
    const totalWeight = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: totalWeight > 0 ? Math.round((value / totalWeight) * 100) : 0
    }));
    
    // Convert ward map to array
    const wardData = Object.entries(wardMap).map(([ward, collected]) => ({
      ward,
      collected: Math.round(collected)
    }));
    
    return { monthlyData, categoryData, wardData };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const totalCollected = monthlyWasteData.reduce((sum, month) => sum + month.collected, 0);
  const totalRecycled = monthlyWasteData.reduce((sum, month) => sum + month.recycled, 0);
  const totalDisposed = monthlyWasteData.reduce((sum, month) => sum + month.disposed, 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-gray-50 rounded-2xl">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Loading system reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleBack} 
                className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                title="Back to Dashboard"
              >
                <FaArrowLeft className="text-lg" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
                <p className="text-gray-600 mt-1">Monthly waste collection and recycling analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={downloadMonthlyReport}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 shadow-md text-sm"
              >
                <FaDownload className="mr-2" />
                Download Report
              </button>
              <span className="hidden sm:inline-block text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                Admin Panel
              </span>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl shadow-md p-4 text-gray-800 border border-blue-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FaTrashAlt className="text-white text-xl" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-600">Total Collected</h3>
                <p className="text-xl font-bold text-blue-700">{totalCollected.toLocaleString()} kg</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl shadow-md p-4 text-gray-800 border border-green-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <FaRecycle className="text-white text-xl" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-600">Total Recycled</h3>
                <p className="text-xl font-bold text-green-700">{totalRecycled.toLocaleString()} kg</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow-md p-4 text-gray-800 border border-yellow-100">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <FaBox className="text-white text-xl" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-600">Total Disposed</h3>
                <p className="text-xl font-bold text-yellow-700">{totalDisposed.toLocaleString()} kg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 md:flex-none py-4 px-5 text-center font-medium text-sm transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-center">
                  <FaChartLine className="mr-2 text-base" />
                  <span className="font-medium">Overview</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`flex-1 md:flex-none py-4 px-5 text-center font-medium text-sm transition-all duration-200 ${
                  activeTab === 'monthly'
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-center">
                  <FaCalendarAlt className="mr-2 text-base" />
                  <span className="font-medium">Monthly Trends</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`flex-1 md:flex-none py-4 px-5 text-center font-medium text-sm transition-all duration-200 ${
                  activeTab === 'categories'
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-center">
                  <FaBox className="mr-2 text-base" />
                  <span className="font-medium">Categories</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Waste Collection Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyWasteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="collected" name="Total Collected (kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recycled" name="Recycled (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Distribution by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={wasteByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {wasteByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Percentage']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Collection by Ward</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={wasteByWard}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="ward" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="collected" name="Collected (kg)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Waste Collection Trend</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyWasteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ddd', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="collected" 
                  name="Total Collected (kg)" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="recycled" 
                  name="Recycled (kg)" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="disposed" 
                  name="Disposed (kg)" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Distribution by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={wasteByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {wasteByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Percentage']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste by Category - Detailed</h3>
              <div className="space-y-4">
                {wasteByCategory.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium text-gray-700">{category.name}</span>
                    </div>
                    <span className="text-gray-900 font-semibold">{category.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemReports;