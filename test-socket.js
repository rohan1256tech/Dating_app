const { io } = require('socket.io-client');

const API_BASE_URL = 'https://detto-backend-53328021014.us-central1.run.app';

console.log(`🔌 Attempting to connect to ${API_BASE_URL}...`);

const socket = io(API_BASE_URL, {
    path: '/socket.io',
    transports: ['websocket'],
    auth: { token: 'dummy-token-for-testing' }
});

socket.on('connect', () => {
    console.log('✅ CONNECTED SUCCESSFULLY!');
    console.log('Socket ID:', socket.id);
    process.exit(0);
});

socket.on('connect_error', (error) => {
    console.error('❌ CONNECTION ERROR:', error.message);
    if (error.message.includes('404')) {
        console.error('The 404 issue is STILL PRESENT.');
    } else {
        console.log('Got a connection error, but it is NOT a 404. This means the server is reachable!');
    }
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log('⚠️ DISCONNECTED:', reason);
    // If it disconnected due to unauthorized, that's actually a SUCCESS for our test
    // because it proves it reached the Socket.io server and ran our auth middleware!
    if (reason === 'io server disconnect') {
        process.exit(0);
    }
});

// Timeout after 5 seconds just in case
setTimeout(() => {
    console.log('⏱️ Connection attempt timed out');
    process.exit(1);
}, 5000);
