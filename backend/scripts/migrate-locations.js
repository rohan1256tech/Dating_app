/**
 * Migration script to convert legacy location data to GeoJSON format
 * This updates all existing user profiles to use the GeoJSON location format
 */

const mongoose = require('mongoose');

async function migrateLocationData() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dating-app';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const profilesCollection = db.collection('profiles');

        // Find all profiles with legacy location format
        const profilesWithLegacyLocation = await profilesCollection.find({
            $or: [
                { 'location.latitude': { $exists: true } },
                { location: { $exists: false } }
            ]
        }).toArray();

        console.log(`\n📊 Found ${profilesWithLegacyLocation.length} profiles to migrate`);

        let migrated = 0;
        let skipped = 0;

        for (const profile of profilesWithLegacyLocation) {
            // Check if profile has legacy location
            if (profile.location?.latitude && profile.location?.longitude) {
                const { latitude, longitude, city } = profile.location;

                // Update to GeoJSON format
                await profilesCollection.updateOne(
                    { _id: profile._id },
                    {
                        $set: {
                            location: {
                                type: 'Point',
                                coordinates: [longitude, latitude] // GeoJSON is [lng, lat]
                            },
                            legacyLocation: {
                                latitude,
                                longitude,
                                city
                            },
                            showOnMap: false // Default to Ghost Mode
                        }
                    }
                );

                migrated++;
                console.log(`✅ Migrated profile ${profile._id}: (${latitude}, ${longitude}) → GeoJSON`);
            } else {
                skipped++;
            }
        }

        console.log(`\n📈 Migration complete:`);
        console.log(`  ✅ Migrated: ${migrated} profiles`);
        console.log(`  ⏭️  Skipped: ${skipped} profiles`);

        // Verify some documents
        const sampleWithGeoJSON = await profilesCollection.findOne({
            'location.type': 'Point'
        });

        if (sampleWithGeoJSON) {
            console.log(`\n✅ Sample GeoJSON location:`);
            console.log(`  Coordinates: ${JSON.stringify(sampleWithGeoJSON.location.coordinates)}`);
            console.log(`  Show on map: ${sampleWithGeoJSON.showOnMap}`);
        }

        console.log('\n🎉 Location data migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error migrating location data:', error);
        process.exit(1);
    }
}

migrateLocationData();
