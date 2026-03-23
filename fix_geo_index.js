// Run with: mongosh whatsleft fix_geo_index.js
db = db.getSiblingDB('whatsleft');

// 1. Drop the old non-sparse 2dsphere index
try {
    db.profiles.dropIndex('location_2dsphere');
    print('✅ Old non-sparse 2dsphere index dropped');
} catch (e) {
    print('ℹ️  No old index to drop (or already dropped): ' + e.message);
}

// 2. Clean all corrupt location docs (coordinates: [])
const result = db.profiles.updateMany(
    { 'location.coordinates': { $size: 0 } },
    { $unset: { location: '' } }
);
print('✅ Cleaned corrupt location docs: ' + result.modifiedCount + ' updated');

// 3. Also clean any location that has no type field (partial/corrupt)
const result2 = db.profiles.updateMany(
    { location: { $exists: true }, 'location.type': { $exists: false } },
    { $unset: { location: '' } }
);
print('✅ Cleaned partial location docs: ' + result2.modifiedCount + ' updated');

// 4. Create the new sparse 2dsphere index
db.profiles.createIndex({ location: '2dsphere' }, { sparse: true, name: 'location_2dsphere_sparse' });
print('✅ New sparse 2dsphere index created');

print('Done! All profiles with corrupt location have been cleaned.');
