/**
 * Verification script to check database connection and indexes
 */

const mongoose = require('mongoose');

async function verifyIndexes() {
    try {
        // Use the same connection string as NestJS
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dating-app';
        await mongoose.connect(mongoUri);

        const db = mongoose.connection.db;
        const dbName = db.databaseName;

        console.log(`\n📊 Connected to database: ${dbName}`);
        console.log(`📍 Connection string: ${mongoUri}\n`);

        // Get profiles collection
        const profilesCollection = db.collection('profiles');

        // List all indexes
        const indexes = await profilesCollection.indexes();
        console.log(`📋 Current indexes on profiles collection:`);
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`);
            console.log(`    Keys: ${JSON.stringify(index.key)}`);
            if (index['2dsphereIndexVersion']) {
                console.log(`    2dsphere version: ${index['2dsphereIndexVersion']}`);
            }
        });

        // Check if we have 2dsphere index
        const has2dsphere = indexes.some(idx =>
            idx.key.location === '2dsphere' || idx['2dsphereIndexVersion']
        );

        if (has2dsphere) {
            console.log(`\n✅ 2dsphere index EXISTS`);
        } else {
            console.log(`\n❌ 2dsphere index MISSING - creating now...`);

            // Create the index
            await profilesCollection.createIndex(
                { location: '2dsphere' }
            );
            console.log(`✅ Created 2dsphere index`);
        }

        // Sample a profile to see location format
        const sampleProfile = await profilesCollection.findOne({});
        if (sampleProfile) {
            console.log(`\n📝 Sample profile location format:`);
            console.log(`  User ID: ${sampleProfile.userId}`);
            console.log(`  Location: ${JSON.stringify(sampleProfile.location, null, 2)}`);
            console.log(`  ShowOnMap: ${sampleProfile.showOnMap}`);
        }

        // Test a geospatial query
        console.log(`\n🧪 Testing geospatial query...`);
        try {
            const testResults = await profilesCollection.find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [73.8567, 18.5204] // Pune coordinates
                        },
                        $maxDistance: 10000
                    }
                }
            }).limit(5).toArray();

            console.log(`✅ Geospatial query WORKS! Found ${testResults.length} profiles`);
        } catch (err) {
            console.log(`❌ Geospatial query FAILED: ${err.message}`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyIndexes();
