/**
 * Script to create geospatial indexes for the map feature
 * Run this once to create the 2dsphere indexes needed for nearby user queries
 */

const mongoose = require('mongoose');

async function createGeospatialIndexes() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dating-app';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Get the profiles collection
        const db = mongoose.connection.db;
        const profilesCollection = db.collection('profiles');

        // Drop existing location indexes if any (to recreate them properly)
        try {
            await profilesCollection.dropIndex('location_2dsphere');
            console.log('🗑️  Dropped old location index');
        } catch (err) {
            console.log('ℹ️  No existing location index to drop');
        }

        // Create 2dsphere index on location field
        await profilesCollection.createIndex(
            { location: '2dsphere' },
            { name: 'location_2dsphere' }
        );
        console.log('✅ Created 2dsphere index on location field');

        // Create compound index for showOnMap + location
        await profilesCollection.createIndex(
            { showOnMap: 1, location: '2dsphere' },
            { name: 'showOnMap_location_2dsphere' }
        );
        console.log('✅ Created compound index on showOnMap + location');

        // Verify indexes were created
        const indexes = await profilesCollection.indexes();
        console.log('\n📋 All indexes on profiles collection:');
        indexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });

        console.log('\n🎉 Geospatial indexes created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
}

createGeospatialIndexes();
