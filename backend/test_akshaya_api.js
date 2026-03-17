const axios = require('axios');
const fs = require('fs');

async function test() {
    try {
        const token = fs.readFileSync('akshaya_token.txt', 'utf8').trim();
        const res = await axios.get('http://localhost:4321/api/collector/?filter=all', {
            headers: { token }
        });

        console.log('Pickups count:', res.data.pickups.length);
        console.log('First pickup (if any):', JSON.stringify(res.data.pickups[0], null, 2));

        process.exit(0);
    } catch (err) {
        console.error('API Error:', err.response?.data || err.message);
        process.exit(1);
    }
}
test();
