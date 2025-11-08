const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middlewares/middleware");

const {
    getPublishedVideos,
    getAllVideosAdmin,
    addVideo,
    updateVideo,
    deleteVideo
} = require('../control/videoController');

router.get("/", getPublishedVideos);

router.get("/admin", isAdmin, getAllVideosAdmin);
router.post("/admin", isAdmin, addVideo);
router.put("/admin/:id", isAdmin, updateVideo);
router.delete("/admin/:id", isAdmin, deleteVideo);

module.exports = router;
