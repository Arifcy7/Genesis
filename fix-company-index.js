// Script to fix the duplicate key error by dropping the old companyEmail index
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://parthsawant1298:Nalini2004@cluster0.upnon.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function fixIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const companiesCollection = db.collection('companies');

    // Get all indexes
    console.log('\n📋 Current indexes on companies collection:');
    const indexes = await companiesCollection.indexes();
    indexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.name);
    });

    // Drop the problematic companyEmail index if it exists
    try {
      console.log('\n🗑️  Attempting to drop companyEmail_1 index...');
      await companiesCollection.dropIndex('companyEmail_1');
      console.log('✅ Successfully dropped companyEmail_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  companyEmail_1 index does not exist (already dropped)');
      } else {
        console.error('⚠️  Error dropping index:', error.message);
      }
    }

    // Show final indexes
    console.log('\n📋 Final indexes on companies collection:');
    const finalIndexes = await companiesCollection.indexes();
    finalIndexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.name);
    });

    console.log('\n✅ Index fix complete! You can now register companies.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

fixIndex();
