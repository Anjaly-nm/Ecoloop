const express = require("express");
const router = express.Router();
const Category = require("../models/admin/category");

// ------------------------------
// Add Category
// ------------------------------
router.post("/ad", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Category({ name, description });
    await newCategory.save();

    res.status(201).json({ message: "Category added", category: newCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding category", error: err.message });
  }
});

// ------------------------------
// Edit Category
// ------------------------------
router.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const updated = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category updated", category: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating category", error: err.message });
  }
});

// ------------------------------
// Delete Category
// ------------------------------
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting category", error: err.message });
  }
});

// ------------------------------
// Get All Categories
// ------------------------------
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching categories", error: err.message });
  }
});

module.exports = router;
