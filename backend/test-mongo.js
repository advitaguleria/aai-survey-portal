const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Connection...');
console.log('Connection String:', process.env.MONGODB_URI);

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ SUCCESS: MongoDB Connected!');
        
        // List all databases
        const adminDb = mongoose.connection.db.admin();
        const result = await adminDb.listDatabases();
        
        console.log('\n📊 Available Databases:');
        result.databases.forEach(db => {
            console.log(`   - ${db.name}`);
        });
        
        // Create aai_survey database if not exists
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        if (collections.length === 0) {
            console.log('\n📝 Creating "aai_survey" database...');
            await db.createCollection('users');
            console.log('✅ Database created successfully!');
        } else {
            console.log('\n📁 Collections found:');
            collections.forEach(col => console.log(`   - ${col.name}`));
        }
        
        await mongoose.disconnect();
        console.log('\n🎉 MongoDB setup complete!');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.log('\n💡 TROUBLESHOOTING:');
        console.log('1. Make sure MongoDB service is running');
        console.log('2. Open MongoDB Compass and connect to mongodb://localhost:27017');
        console.log('3. Check if .env file is in backend folder');
    }
}

test();