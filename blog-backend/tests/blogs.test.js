const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust as necessary
const Blog = require('../models/Blog');   // Adjust as necessary
// Import app *after* setup has run and environment variables are set
const app = require('../server');     // Adjust path to your Express app

describe('Blog Routes (/api/blogs)', () => {
    let server;
    let tokenUser1;
    let userIdUser1;
    let tokenUser2;
    // let userIdUser2; // Not strictly needed if we only check tokenUser2's inability to modify user1's blogs

    const user1Credentials = {
        username: 'userone',
        email: 'userone@example.com',
        password: 'password123',
    };
    const user2Credentials = {
        username: 'usertwo',
        email: 'usertwo@example.com',
        password: 'password456',
    };

    beforeAll(async (done) => {
        server = app.listen(process.env.PORT, async () => {
            // Register and login User 1
            await request(app).post('/api/auth/signup').send(user1Credentials);
            let res = await request(app).post('/api/auth/login').send({
                email: user1Credentials.email,
                password: user1Credentials.password,
            });
            tokenUser1 = res.body.token;
            userIdUser1 = res.body.userId;

            // Register and login User 2
            await request(app).post('/api/auth/signup').send(user2Credentials);
            res = await request(app).post('/api/auth/login').send({
                email: user2Credentials.email,
                password: user2Credentials.password,
            });
            tokenUser2 = res.body.token;
            // userIdUser2 = res.body.userId;
            done();
        });
    });

    afterAll(done => {
        mongoose.connection.close(() => {
            server.close(done);
        });
    });


    let sampleBlogId;

    // Test POST /api/blogs (Create Blog)
    describe('POST /api/blogs', () => {
        it('should create a new blog successfully with a valid token', async () => {
            const res = await request(app)
                .post('/api/blogs')
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ title: 'My First Blog', content: 'This is the content.' });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', 'My First Blog');
            expect(res.body).toHaveProperty('author'); // Author field should exist
            expect(res.body.author.toString()).toEqual(userIdUser1);
            sampleBlogId = res.body._id; // Save for later tests
        });

        it('should fail to create a blog with missing title', async () => {
            const res = await request(app)
                .post('/api/blogs')
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ content: 'This is the content.' });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('errors');
        });

        it('should fail to create a blog without a token', async () => {
            const res = await request(app)
                .post('/api/blogs')
                .send({ title: 'No Token Blog', content: 'Content here.' });
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('message', 'No token, authorization denied');
        });
    });

    // Test GET /api/blogs (Get All Blogs)
    describe('GET /api/blogs', () => {
        it('should return an array of blogs (publicly accessible)', async () => {
            // Create a blog first if one doesn't exist from previous tests
            if (!sampleBlogId) {
                 const blogRes = await request(app)
                    .post('/api/blogs')
                    .set('Authorization', `Bearer ${tokenUser1}`)
                    .send({ title: 'Blog for GET all', content: 'Content.' });
                expect(blogRes.statusCode).toEqual(201);
            }

            const res = await request(app).get('/api/blogs');
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('title');
            expect(res.body[0]).toHaveProperty('author');
            expect(res.body[0].author).toHaveProperty('username'); // Check populated author
        });
    });

    // Test GET /api/blogs/:id (Get Single Blog)
    describe('GET /api/blogs/:id', () => {
        it('should retrieve an existing blog by ID', async () => {
            expect(sampleBlogId).toBeDefined(); // Ensure blog was created
            const res = await request(app).get(`/api/blogs/${sampleBlogId}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('_id', sampleBlogId);
            expect(res.body).toHaveProperty('title', 'My First Blog'); // Or the title used if created in 'GET all'
            expect(res.body).toHaveProperty('author');
            expect(res.body.author).toHaveProperty('username', user1Credentials.username);
        });

        it('should return 404 for a non-existent blog ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/blogs/${nonExistentId}`);
            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('message', 'Blog not found');
        });

        it('should return 400 for an invalid blog ID format', async () => {
            const res = await request(app).get('/api/blogs/invalidIdFormat');
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'Invalid Blog ID format');
        });
    });

    // Test PUT /api/blogs/:id (Update Blog)
    describe('PUT /api/blogs/:id', () => {
        it('should update a blog successfully by its author', async () => {
            const res = await request(app)
                .put(`/api/blogs/${sampleBlogId}`)
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ title: 'Updated Title', content: 'Updated content.' });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('title', 'Updated Title');
            expect(res.body).toHaveProperty('content', 'Updated content.');
        });

        it('should fail to update if user is not the author', async () => {
            const res = await request(app)
                .put(`/api/blogs/${sampleBlogId}`)
                .set('Authorization', `Bearer ${tokenUser2}`) // Use token from a different user
                .send({ title: 'Unauthorized Update' });
            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty('message', 'User not authorized to update this blog');
        });

        it('should return 404 when trying to update a non-existent blog', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/blogs/${nonExistentId}`)
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ title: 'Trying to update non-existent' });
            expect(res.statusCode).toEqual(404);
        });

        it('should fail to update without a token', async () => {
            const res = await request(app)
                .put(`/api/blogs/${sampleBlogId}`)
                .send({ title: 'No Token Update' });
            expect(res.statusCode).toEqual(401);
        });
         it('should fail to update with empty title if provided', async () => {
            const res = await request(app)
                .put(`/api/blogs/${sampleBlogId}`)
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ title: '' });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('errors');
        });
    });

    // Test DELETE /api/blogs/:id (Delete Blog)
    describe('DELETE /api/blogs/:id', () => {
        let blogToDeleteId;
        beforeEach(async () => { // Create a new blog for each delete test to avoid interference
            const blog = await request(app)
                .post('/api/blogs')
                .set('Authorization', `Bearer ${tokenUser1}`)
                .send({ title: 'Blog To Delete', content: 'Delete me.' });
            blogToDeleteId = blog.body._id;
        });

        it('should delete a blog successfully by its author', async () => {
            const res = await request(app)
                .delete(`/api/blogs/${blogToDeleteId}`)
                .set('Authorization', `Bearer ${tokenUser1}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Blog deleted successfully');

            // Verify it's actually deleted
            const getRes = await request(app).get(`/api/blogs/${blogToDeleteId}`);
            expect(getRes.statusCode).toEqual(404);
        });

        it('should fail to delete if user is not the author', async () => {
            const res = await request(app)
                .delete(`/api/blogs/${blogToDeleteId}`)
                .set('Authorization', `Bearer ${tokenUser2}`); // Use token from a different user
            expect(res.statusCode).toEqual(403);
            expect(res.body).toHaveProperty('message', 'User not authorized to delete this blog');
        });

        it('should return 404 when trying to delete a non-existent blog', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .delete(`/api/blogs/${nonExistentId}`)
                .set('Authorization', `Bearer ${tokenUser1}`);
            expect(res.statusCode).toEqual(404);
        });

        it('should fail to delete without a token', async () => {
            const res = await request(app).delete(`/api/blogs/${blogToDeleteId}`);
            expect(res.statusCode).toEqual(401);
        });
    });
});
