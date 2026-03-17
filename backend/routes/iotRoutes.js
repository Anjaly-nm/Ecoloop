const express = require('express');
const router = express.Router();
const iotController = require('../control/iotController');

// ESP32 endpoint to send data
router.post('/gas-data', iotController.receiveGasData);

// GET handler for debugging/notice (Browser tests)
router.get('/gas-data', (req, res) => {
    res.status(200).json({
        message: "IoT Gas Data endpoint is active.",
        note: "Please use POST method to send sensor data from ESP32."
    });
});

// Dashboard endpoint to get latest readings
router.get('/latest-readings', iotController.getLatestGasData);

module.exports = router;
