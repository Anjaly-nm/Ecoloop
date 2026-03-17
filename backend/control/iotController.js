const GasData = require('../models/iot/GasData');
const User = require('../models/user/users');
const { admin } = require('../firebaseAdmin');

exports.receiveGasData = async (req, res) => {
    try {
        console.log("📥 [IOT DEBUG] Incoming Data Payload:", JSON.stringify(req.body, null, 2));

        // Flexibly handle different naming conventions from ESP32
        const binId = req.body.binId || req.body.bin_id || req.body.binID;
        const gasLevel = req.body.gasLevel !== undefined ? req.body.gasLevel : (req.body.gas_level !== undefined ? req.body.gas_level : req.body.level);
        const timestamp = req.body.timestamp || req.body.time;

        if (!binId || gasLevel === undefined) {
            console.warn("⚠️ [IOT DEBUG] Rejected Payload: Missing required fields", { binId, gasLevel });
            return res.status(400).json({
                success: false,
                message: "Invalid data format. binId and gasLevel (PPM) are required.",
                received: req.body
            });
        }

        // Convert gasLevel to a number
        const numericLevel = Number(gasLevel);

        // Safety Classification Logic:
        // Normal < 400 | Moderate 400–800 | High > 800
        let status = 'Normal';
        if (numericLevel > 800) {
            status = 'High';
        } else if (numericLevel >= 400) {
            status = 'Moderate';
        }

        const newEntry = new GasData({
            binId,
            gasLevel: numericLevel,
            status,
            timestamp: timestamp || new Date()
        });

        await newEntry.save();
        console.log(`✅ [IOT DEBUG] Persistence Success: Bin ${binId} -> ${numericLevel} PPM [${status}]`);

        // Send Push Notification via Firebase Cloud Messaging if status is 'High'
        if (status === 'High' && admin) {
            try {
                // Find all Admins with valid fcmToken
                const admins = await User.find({ role: { $in: ['Admin', 'admin'] }, fcmToken: { $exists: true, $ne: '' } });
                const tokens = admins.map(a => a.fcmToken);

                if (tokens.length > 0) {
                    const message = {
                        notification: {
                            title: '⚠️ Gas Alert',
                            body: 'Dangerous gas level detected in the waste bin. Immediate ventilation or waste collection required.',
                        },
                        data: {
                            click_action: 'FLUTTER_NOTIFICATION_CLICK',
                            binId: String(binId),
                            gasLevel: String(numericLevel),
                        },
                        tokens: tokens,
                    };

                    const response = await admin.messaging().sendMulticast(message);
                    console.log(`🚀 [IOT FCM] Push Notifications sent! Success: ${response.successCount}, Failed: ${response.failureCount}`);
                } else {
                    console.log(`🔔 [IOT FCM] Status High, but no Admin devices with FCM tokens found.`);
                }
            } catch (fcmErr) {
                console.error("❌ [IOT FCM] Error sending FCM notification:", fcmErr);
            }
        }

        res.status(201).json({
            success: true,
            message: "Gas data recorded successfully",
            status: status,
            data: newEntry
        });

    } catch (err) {
        console.error("❌ [IOT DEBUG] Fatal Error during persistence:", err);
        res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
};

exports.getLatestGasData = async (req, res) => {
    try {
        const readings = await GasData.find().sort({ timestamp: -1 }).limit(20);
        console.log(`📡 [IOT DEBUG] Sending ${readings.length} records to frontend.`);

        res.status(200).json({
            success: true,
            count: readings.length,
            latest: readings[0] || null,
            history: readings
        });
    } catch (err) {
        console.error("❌ [IOT DEBUG] Fetch Error:", err);
        res.status(500).json({ success: false, message: "Error fetching registry data" });
    }
};
