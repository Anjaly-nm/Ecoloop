import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/category.css";

const API_URL = "http://localhost:4321/api/user/ad"; // replace with your backend URL

const CategoryFrontend = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Add category
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/ad`, { name, description });
      alert(res.data.message);
      setName("");
      setDescription("");
      fetchCategories();
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  // Edit category
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/edit/${editId}`, { name, description });
      alert(res.data.message);
      setName("");
      setDescription("");
      setEditId(null);
      fetchCategories();
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  const startEdit = (cat) => {
    setEditId(cat._id);
    setName(cat.name);
    setDescription(cat.description);
  };

  return (
    <div className="category-container">
      <h2>Categories</h2>
      
      <form onSubmit={editId ? handleEdit : handleAdd} className="category-form">
        <input
          type="text"
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">{editId ? "Update" : "Add"} Category</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setName(""); setDescription(""); }}>Cancel</button>}
      </form>

      <div className="category-cards">
        {categories.map((cat) => (
          <div key={cat._id} className="category-card">
            <h3>{cat.name}</h3>
            <p>{cat.description}</p>
            <button onClick={() => startEdit(cat)}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryFrontend;
