const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path as necessary
// Import app *after* setup has run and environment variables are set
const app = require('../server'); // Adjust path to your Express app

describe('Auth Routes (/api/auth)', () => {
    let server;

    beforeAll(done => {
        // Ensure the server starts on the test port defined in setup.js
        // The app should use process.env.PORT
        server = app.listen(process.env.PORT, done);
    });

    afterAll(done => {
        mongoose.connection.close(() => {
            server.close(done);
        });
    });

    // Test /api/auth/signup
    describe('POST /api/auth/signup', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('username', 'testuser');
            expect(res.body).toHaveProperty('message', 'User created successfully');

            // Check if user is in the database
            const user = await User.findOne({ email: 'test@example.com' });
            expect(user).not.toBeNull();
            expect(user.username).toBe('testuser');
        });

        it('should fail if email already exists', async () => {
            // First, create a user
            await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser1',
                    email: 'existing@example.com',
                    password: 'password123',
                });

            // Try to register again with the same email
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser2',
                    email: 'existing@example.com',
                    password: 'password456',
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Email already registered');
        });

        it('should fail with invalid data (short password)', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser',
                    email: 'invalidpass@example.com',
                    password: '123', // Too short
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('errors');
            const passwordError = res.body.errors.find(err => err.path === 'password');
            expect(passwordError).toBeDefined();
            expect(passwordError.msg).toBe('Password must be at least 6 characters');
        });

        it('should fail with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser',
                    email: 'invalidemail',
                    password: 'password123',
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('errors');
            const emailError = res.body.errors.find(err => err.path === 'email');
            expect(emailError).toBeDefined();
            expect(emailError.msg).toBe('Please include a valid email');
        });
         it('should fail if username is missing', async () => {
            const res = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: 'nousername@example.com',
                    password: 'password123',
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('errors');
            const usernameError = res.body.errors.find(err => err.path === 'username');
            expect(usernameError).toBeDefined();
        });
    });

    // Test /api/auth/login
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a user to login with
            await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'loginuser',
                    email: 'login@example.com',
                    password: 'password123',
                });
        });

        it('should login an existing user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123',
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('username', 'loginuser');
            expect(res.body).toHaveProperty('userId');
        });

        it('should fail with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword',
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });

        it('should fail if user does not exist', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });

        it('should fail with invalid email format during login', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalidemail',
                    password: 'password123',
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('errors');
            const emailError = res.body.errors.find(err => err.path === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if password is not provided during login', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('errors');
            const passwordError = res.body.errors.find(err => err.path === 'password');
            expect(passwordError).toBeDefined();
        });
    });
});
