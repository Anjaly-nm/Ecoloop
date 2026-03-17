const mongoose = require('mongoose');
const GasData = require('./models/iot/GasData');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');
        const count = await GasData.countDocuments();
        console.log('Total GasData records:', count);
        const latest = await GasData.findOne().sort({ timestamp: -1 });
        console.log('Latest record:', JSON.stringify(latest, null, 2));
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
