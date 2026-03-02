const axios = require('axios');
const jwt = require('jsonwebtoken');

// Config from .env and previous discovery
const API_URL = 'http://localhost:4321';
const JWT_SECRET = 'your_jwt_secret_here';
const SELLER_ID = '69413063828f9b916f0567f7'; // Verified seller ID from previous script

// Generate Token
const token = jwt.sign({ id: SELLER_ID, role: 'seller' }, JWT_SECRET, { expiresIn: '1h' });
console.log('Generated Test Token:', token);

const testEndpoint = async () => {
    try {
        console.log(`Testing GET ${API_URL}/api/orders/seller...`);
        const response = await axios.get(`${API_URL}/api/orders/seller`, {
            headers: { token: token }
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data.orders) {
            console.log(`\nSUCCESS: Received ${response.data.orders.length} orders.`);
        } else {
            console.log('\nWARNING: Received response but no orders array.');
        }

    } catch (error) {
        console.error('Error testing endpoint:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
};

testEndpoint();
