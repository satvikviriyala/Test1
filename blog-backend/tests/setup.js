const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Set a default JWT_SECRET for testing if not already set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
// Set a default PORT for supertest if not set by server.js an .env file
process.env.PORT = process.env.PORT || 5001; // Use a different port for tests

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri; // Set MONGO_URI for the application to use

    // It's important that mongoose connects *after* MONGO_URI is set
    // and *before* any tests try to use the models or app.
    // If your app auto-connects on import, this might need adjustment
    // or ensure server.js (and thus app) is imported after this setup.
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

beforeEach(async () => {
    // Clear all data from all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});
