/**
 * tunnel.js — runs alongside NestJS dev server
 * Exposes port 3000 via localtunnel and writes the public URL to frontend .env
 *
 * Usage: called automatically by "start:dev" in package.json
 */

const path = require('path');
const fs = require('fs');

const PORT = 3000;
const FRONTEND_ENV = path.resolve(__dirname, '..', '.env');

async function startTunnel() {
    let localtunnel;
    try {
        localtunnel = require('localtunnel');
    } catch {
        console.warn('[tunnel] localtunnel not installed, skipping backend tunnel.');
        console.warn('[tunnel] Run: npm install --save-dev localtunnel');
        return;
    }

    console.log(`[tunnel] Opening public tunnel for backend port ${PORT}...`);

    try {
        const tunnel = await localtunnel({ port: PORT });
        const publicUrl = tunnel.url;

        console.log(`\n✅ [tunnel] Backend publicly accessible at: ${publicUrl}\n`);

        // Update frontend .env
        updateFrontendEnv(publicUrl);

        tunnel.on('close', () => {
            console.warn('[tunnel] Tunnel closed. Restart backend to re-establish.');
        });

        tunnel.on('error', (err) => {
            console.error('[tunnel] Tunnel error:', err.message);
        });
    } catch (err) {
        console.error('[tunnel] Failed to open tunnel:', err.message);
        console.warn('[tunnel] API calls will use local IP — make sure phone is on same WiFi.');
    }
}

function updateFrontendEnv(publicUrl) {
    try {
        let content = '';
        if (fs.existsSync(FRONTEND_ENV)) {
            content = fs.readFileSync(FRONTEND_ENV, 'utf8');
        }

        const newLine = `EXPO_PUBLIC_API_URL=${publicUrl}`;
        if (content.includes('EXPO_PUBLIC_API_URL=')) {
            content = content.replace(/EXPO_PUBLIC_API_URL=.+/g, newLine);
        } else {
            content = content.trim() + '\n' + newLine + '\n';
        }

        fs.writeFileSync(FRONTEND_ENV, content, 'utf8');
        console.log(`[tunnel] ✅ Updated frontend .env → ${newLine}`);
        console.log('[tunnel] ⚠️  Restart Expo (npx expo --tunnel) to pick up new URL\n');
    } catch (err) {
        console.error('[tunnel] Could not update frontend .env:', err.message);
        console.log(`[tunnel] Manually set: EXPO_PUBLIC_API_URL=${publicUrl}`);
    }
}

// Run
startTunnel();
