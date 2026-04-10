
import fetch from 'node-fetch'; // or built-in in Node 18+

const BASE_URL = 'http://localhost:3000/api';
let adminToken = '';
let agentToken = '';
let siteId = '';
let queueId = '';
let ticketId = '';

async function login(username, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username === 'admin' ? 'admin@sigfa.ci' : 'quai@sigfa.ci', password })
    });
    const data = await res.json();
    console.log('Login Response:', JSON.stringify(data));

    if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(data)}`);

    // Extract token from Set-Cookie header
    const cookies = res.headers.raw()['set-cookie'];
    if (!cookies) throw new Error('No cookies returned');

    const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
    if (!accessTokenCookie) throw new Error('No accessToken cookie found');

    const token = accessTokenCookie.split(';')[0].split('=')[1];
    return token;
}

async function getSite(token) {
    const res = await fetch(`${BASE_URL}/sites`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Get Sites failed: ${JSON.stringify(data)}`);
    return data[0]?.siteId;
}

async function createQueue(token, siteId) {
    // Try to find existing first
    const listRes = await fetch(`${BASE_URL}/queues?siteId=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const list = await listRes.json();
    const existing = list.find(q => q.name === 'TEST_WEIGHING_QUEUE');
    if (existing) return existing.queueId;

    const res = await fetch(`${BASE_URL}/queues`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            name: 'TEST_WEIGHING_QUEUE',
            siteId,
            priority: 10,
            isActive: true
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Create Queue failed: ${JSON.stringify(data)}`);
    return data.queueId;
}

async function createTicket(token, queueId, siteId) {
    const res = await fetch(`${BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            siteId,
            queueId,
            vehicleInfo: {
                licensePlate: 'TEST-999-AA',
                driverName: 'Test Driver'
            }
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Create Ticket failed: ${JSON.stringify(data)}`);
    return data.ticketId;
}

async function callTicket(token, ticketId) {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/call`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Call Ticket failed: ${JSON.stringify(data)}`);
    return data;
}

async function startTicket(token, ticketId) {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Start Ticket failed: ${JSON.stringify(data)}`);
    return data;
}

async function weighEntry(token, ticketId) {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/weighing/entry`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            grossWeight: 10000,
            observation: 'Entry Weighing Test'
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Weigh Entry failed: ${JSON.stringify(data)}`);
    return data;
}

async function weighExit(token, ticketId) {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/weighing/exit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            tareWeight: 4000,
            observation: 'Exit Weighing Test'
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Weigh Exit failed: ${JSON.stringify(data)}`);
    return data;
}

async function endTicket(token, ticketId) {
    const res = await fetch(`${BASE_URL}/tickets/${ticketId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`End Ticket failed: ${JSON.stringify(data)}`);
    return data;
}

async function run() {
    try {
        console.log('1. Admin Login...');
        adminToken = await login('admin', 'password123');
        console.log('   Admin logged in.');

        console.log('2. User (Agent) Login...');
        agentToken = await login('agentquai', 'password123');
        console.log('   Agent logged in.');

        console.log('3. Get Site...');
        siteId = await getSite(adminToken);
        console.log(`   Site ID: ${siteId}`);

        console.log('4. Create/Get Queue...');
        queueId = await createQueue(adminToken, siteId);
        console.log(`   Queue ID: ${queueId}`);

        console.log('5. Create Ticket...');
        ticketId = await createTicket(adminToken, queueId, siteId);
        console.log(`   Ticket ID: ${ticketId}`);

        console.log('6. Call Ticket (Agent)...');
        await callTicket(agentToken, ticketId);
        console.log('   Ticket called.');

        console.log('7. Start Ticket (Agent)...');
        await startTicket(agentToken, ticketId);
        console.log('   Ticket started.');

        console.log('8. Weighing Entry (Agent)...');
        const entryRes = await weighEntry(agentToken, ticketId);
        console.log('   Entry Weight recorded:', entryRes.logistic);

        console.log('9. Weighing Exit (Agent)...');
        const exitRes = await weighExit(agentToken, ticketId);
        console.log('   Exit Weight recorded:', exitRes.logistic);

        if (exitRes.logistic.netWeight === 6000) {
            console.log('   SUCCESS: Net Weight is correct (10000 - 4000 = 6000).');
        } else {
            console.error(`   FAILURE: Net Weight incorrect. Expected 6000, got ${exitRes.logistic.netWeight}`);
        }

        console.log('10. End Ticket (Agent)...');
        await endTicket(agentToken, ticketId);
        console.log('    Ticket ended.');

        console.log('--- VERIFICATION SUCCESSFUL ---');

    } catch (error) {
        console.error('--- VERIFICATION FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

run();
