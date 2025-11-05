import React, { useEffect, useState } from "react";
import axios from "axios";

// Icon components (using Lucide React equivalents since we can't install packages)
const EditIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  </svg>
);

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [popup, setPopup] = useState({ show: false, message: "", type: "" });
  
  // State for Edit Modal
  const [editModal, setEditModal] = useState({
    show: false,
    id: null,
    name: "",
    description: ""
  });

  // State for Custom Delete Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    idToDelete: null,
    name: ""
  });

  const showPopup = (message, type = "success") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3000);
  };

  // Function to fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000'; 
        const res = await axios.get(`${baseUrl}/api/category/categories`);
        setCategories(res.data);
      } catch (err) {
        showPopup("Error fetching categories", "error");
      }
    };
    fetchCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const res = await axios.post(
        `${baseUrl}/api/category/ad`,
        { name, description }
      );
      showPopup(res.data.message, "success");
      setName("");
      setDescription("");
      const resCategories = await axios.get(`${baseUrl}/api/category/categories`);
      setCategories(resCategories.data);
    } catch (err) {
      showPopup(err.response?.data?.message || "Failed to add category", "error");
    }
  };

  // Open Delete Confirmation Modal
  const openDeleteConfirm = (category) => {
    setConfirmModal({
      show: true,
      idToDelete: category._id,
      name: category.name
    });
  };

  // Handle actual deletion (called from the custom modal)
  const handleDelete = async () => {
    const id = confirmModal.idToDelete;
    if (!id) return; 

    setConfirmModal({ show: false, idToDelete: null, name: "" }); 

    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const res = await axios.delete(`${baseUrl}/api/category/delete/${id}`);
      showPopup(res.data.message || "Category deleted successfully", "success");
      setCategories(categories.filter((c) => c._id !== id));
    } catch (err) {
      showPopup("Failed to delete category", "error");
    }
  };

  const openEditModal = (category) => {
    setEditModal({
      show: true,
      id: category._id,
      name: category.name,
      description: category.description
    });
  };

  const handleEdit = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const res = await axios.put(
        `${baseUrl}/api/category/edit/${editModal.id}`,
        { name: editModal.name, description: editModal.description }
      );
      showPopup(res.data.message, "success");
      setEditModal({ show: false, id: null, name: "", description: "" });
      const resCategories = await axios.get(`${baseUrl}/api/category/categories`);
      setCategories(resCategories.data);
    } catch (err) {
      showPopup(err.response?.data?.message || "Failed to edit category", "error");
    }
  };

  // Custom Confirmation Dialog Component (replaces window.confirm)
  const ConfirmationModal = ({ show, name, onConfirm, onClose }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
        <div className="bg-white text-gray-800 p-8 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
          <h3 className="text-xl font-bold mb-4 text-red-600">Confirm Deletion</h3>
          <p className="mb-6">
            Are you sure you want to delete the category: 
            <strong className="text-blue-600 ml-1">"{name}"</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition shadow-md"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    // Main Wrapper: Reduced horizontal padding (px-4 for mobile, px-6 for md+)
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen text-gray-800 font-sans">
      <h1 className="text-4xl font-extrabold mb-6 text-center text-blue-700"> {/* Reduced mb-8 to mb-6 */}
        Category Manager 🏷️
      </h1>

      {/* Add Category Form Card */}
      <div className="max-w-4xl mx-auto mb-8"> {/* Reduced mb-10 to mb-8 */}
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">Add New Category</h2> {/* Reduced mb-4 to mb-3 */}
        <form
          onSubmit={handleAdd}
          // Reduced vertical padding (py-4) and horizontal padding (px-5) for the form container
          className="flex flex-col md:flex-row gap-3 items-center bg-white p-4 md:p-5 rounded-xl shadow-lg border border-gray-100"
        >
          <input
            type="text"
            placeholder="Category Name (e.g., Electronics)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            // Adjusted py-2.5 for slightly less height
            className="border border-gray-300 rounded-lg px-3 py-2.5 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 transition"
            required
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            // Adjusted py-2.5 for slightly less height
            className="border border-gray-300 rounded-lg px-3 py-2.5 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 transition"
          />
          <button
            type="submit"
            // Adjusted py-2 and px-5 for the button
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow-md transition transform hover:scale-[1.01]"
          >
            Add Category
          </button>
        </form>
      </div>

      {/* Category Table */}
      <div className="max-w-4xl mx-auto mt-6 overflow-x-auto"> {/* Reduced mt-8 to mt-6 */}
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">Existing Categories</h2> {/* Reduced mb-4 to mb-3 */}
        <table className="min-w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <thead className="bg-blue-50 text-blue-800 border-b border-blue-200">
            <tr>
              {/* Reduced py-2.5 and px-4 for table headers */}
              <th className="py-2.5 px-4 text-left font-bold">Name</th>
              <th className="py-2.5 px-4 text-left font-bold">Description</th>
              <th className="py-2.5 px-4 text-center font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id} className="hover:bg-gray-100 transition duration-150">
                {/* Reduced py-3 and px-4 for table data cells */}
                <td className="py-3 px-4 font-medium">{cat.name}</td>
                <td className="py-3 px-4 text-gray-600">{cat.description || <em>No description</em>}</td>
                <td className="py-3 px-4 flex justify-center gap-2"> {/* Reduced gap-3 to gap-2 */}
                  <button
                    onClick={() => openEditModal(cat)}
                    // Reduced px-3 py-1.5 for buttons, adjusted text-sm
                    className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition transform hover:scale-105"
                    title="Edit Category"
                  >
                    <EditIcon /> Edit
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(cat)}
                    // Reduced px-3 py-1.5 for buttons, adjusted text-sm
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition transform hover:scale-105"
                    title="Delete Category"
                  >
                    <TrashIcon /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="3" className="py-6 px-4 text-center text-gray-500 italic"> {/* Reduced py-8 to py-6 */}
                  No categories found. Start by adding one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Popup Message (Toast) - No change needed here */}
      {popup.show && (
        <div
          className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-xl text-white font-medium transition-opacity duration-300 z-50 ${
            popup.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {popup.message}
        </div>
      )}

      {/* Edit Modal (White Theme) - Minor adjustments to padding and margins */}
      {editModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white text-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300"> {/* Reduced p-8 to p-6 */}
            <h3 className="text-2xl font-bold mb-5 text-gray-700">Edit Category</h3> {/* Reduced mb-6 to mb-5 */}
            <div className="space-y-3"> {/* Reduced space-y-4 to space-y-3 */}
              <input
                type="text"
                value={editModal.name}
                onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                placeholder="Category Name"
                className="border border-gray-300 rounded-lg px-4 py-2.5 w-full bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={editModal.description}
                onChange={(e) =>
                  setEditModal({ ...editModal, description: e.target.value })
                }
                placeholder="Description"
                className="border border-gray-300 rounded-lg px-4 py-2.5 w-full bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5"> {/* Reduced mt-6 to mt-5 */}
              <button
                onClick={() =>
                  setEditModal({ show: false, id: null, name: "", description: "" })
                }
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Confirmation Modal - Minor adjustments to padding and margins */}
      <ConfirmationModal
        show={confirmModal.show}
        name={confirmModal.name}
        onConfirm={handleDelete}
        onClose={() => setConfirmModal({ show: false, idToDelete: null, name: "" })}
      />
    </div>
  );
};

export default Category;
