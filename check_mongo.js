const mongoose = require('mongoose');

async function checkMongo() {
  console.log('Checking TCP 127.0.0.1:27017...');
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 2000 });
    console.log('MongoDB is running on 127.0.0.1:27017');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Failed to connect to 127.0.0.1:27017:', err.message);
    process.exit(1);
  }

  console.log('Checking test database URI...');
  try {
    await mongoose.connect('mongodb://localhost:27017/ir-section-controller-test', { serverSelectionTimeoutMS: 2000 });
    console.log('Test database connection successful');
    
    // Check if database can be accessed
    const collections = await mongoose.connection.db.collections();
    console.log('Collections in test DB:', collections.map(c => c.collectionName));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Failed to connect to test database:', err.message);
    process.exit(1);
  }
}

checkMongo();
