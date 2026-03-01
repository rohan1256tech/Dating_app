/**
 * Create geo indexes on the TEST database (which NestJS is using)
 */

const mongoose = require('mongoose');

async function createIndexesOnTestDB() {
    try {
        // Connect to the same URI as NestJS - it defaults to 'test' database
        const mongoUri = 'mongodb+srv://rohansabale521_db_user:2LByYhWlTTav10hb@cluster0.tjgryhg.mongodb.net/test?appName=Cluster0';
        await mongoose.connect(mongoUri);

        const db = mongoose.connection.db;
        console.log(`✅ Connected to database: ${db.databaseName}`);

        const profilesCollection = db.collection('profiles');

        // Drop old indexes
        try {
            await profilesCollection.dropIndex('location_2dsphere');
            console.log('🗑️  Dropped old index');
        } catch (e) {
            console.log('ℹ️  No old index to drop');
        }

        // Create 2dsphere index
        await profilesCollection.createIndex(
            { location: '2dsphere' },
            { name: 'location_2dsphere' }
        );
        console.log('✅ Created location_2dsphere index');

        // Create compound index
        await profilesCollection.createIndex(
            { showOnMap: 1, location: '2dsphere' },
            { name: 'showOnMap_location_2dsphere' }
        );
        console.log('✅ Created showOnMap_location_2dsphere index');

        // Verify
        const indexes = await profilesCollection.indexes();
        console.log('\n📋 All indexes:');
        indexes.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

        console.log('\n🎉 Indexes created on TEST database!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createIndexesOnTestDB();
