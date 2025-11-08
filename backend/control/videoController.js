const asyncHandler = require('express-async-handler'); 
const Video = require('../models/admin/video');

const getPublishedVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find({ is_published: true }).sort({ order_index: 1 });
    res.status(200).json({
        message: "✅ Published video lessons fetched successfully",
        videos,
    });
});

const getAllVideosAdmin = asyncHandler(async (req, res) => {
    const videos = await Video.find().sort({ date_added: -1 }); 
    res.status(200).json({
        message: "✅ All videos (admin view) fetched successfully",
        videos,
    });
});

const addVideo = asyncHandler(async (req, res) => {
    const { title, description, url, category, is_published, order_index } = req.body;

    if (!title || !description || !url) {
        res.status(400);
        throw new Error('❌ Please include a title, URL, and description.');
    }

    const video = await Video.create({
        title,
        description,
        url,
        category: category || 'General',
        is_published: is_published !== undefined ? is_published : true,
        order_index: order_index || 0,
    });

    res.status(201).json({
        message: "✅ Video lesson added successfully",
        video,
    });
});

const updateVideo = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id);

    if (!video) {
        res.status(404);
        throw new Error('❌ Video not found');
    }

    const updatedVideo = await Video.findByIdAndUpdate(req.params.id, req.body, {
        new: true, 
        runValidators: true,
    });

    res.status(200).json({
        message: "✅ Video lesson updated successfully",
        updatedVideo,
    });
});

const deleteVideo = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params.id);

    if (!video) {
        res.status(404);
        throw new Error('❌ Video not found');
    }

    await video.deleteOne();

    res.status(200).json({ 
        message: '✅ Video lesson removed successfully',
        id: req.params.id 
    });
});

module.exports = {
    getPublishedVideos,
    getAllVideosAdmin,
    addVideo,
    updateVideo,
    deleteVideo,
};
