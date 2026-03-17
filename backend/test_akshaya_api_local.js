const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/user/users');

async function testApi() {
    try {
        const SECRET_KEY = 'your_jwt_secret_here';

        await mongoose.connect('mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        const akshaya = await User.findOne({ name: /Akshaya/i });

        const token = jwt.sign({ id: akshaya._id }, SECRET_KEY, { expiresIn: '1h' });

        console.log('Testing /api/collector/ with token for:', akshaya.name);

        const response = await axios.get('http://localhost:4321/api/collector/?filter=all', {
            headers: { token }
        });

        console.log('Response Status:', response.status);
        console.log('Number of pickups returned:', response.data.pickups.length);
        console.log('Pickups summary:', JSON.stringify(response.data.pickups.map(p => ({
            id: p._id,
            status: p.status,
            date: p.scheduled_date,
            user: p.user_id ? p.user_id.name : 'MISSING USER'
        })), null, 2));

        process.exit(0);
    } catch (err) {
        console.error('API Test Failed:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
        process.exit(1);
    }
}

testApi();
