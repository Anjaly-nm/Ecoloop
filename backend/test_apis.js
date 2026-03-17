const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testApis() {
    const SECRET = 'your_jwt_secret_here';
    const collectorId = '68fb46a8895ba2c1a2de9938';
    const token = jwt.sign({ id: collectorId, role: 'collector' }, SECRET);

    const headers = { token };
    const urls = [
        'http://localhost:4321/api/collector/?filter=all',
        'http://localhost:4321/api/collector-dashboard/analytics',
        'http://localhost:4321/api/collector-dashboard/earnings',
        'http://localhost:4321/api/collector-dashboard/notifications'
    ];

    for (const url of urls) {
        console.log(`🔗 Testing: ${url}`);
        try {
            const res = await axios.get(url, { headers });
            console.log(`✅ Success! Status: ${res.status}`);
            console.log(`📦 Data Length: ${JSON.stringify(res.data).length} chars`);
        } catch (err) {
            console.error(`❌ Error Code: ${err.code || 'N/A'}`);
            console.error(`❌ Status: ${err.response?.status || 'N/A'}`);
            console.error(`❌ Message: ${err.response?.data?.message || err.message}`);
        }
    }
}
testApis();
