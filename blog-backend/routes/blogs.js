const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose'); // For ObjectId validation

const Blog = require('../models/Blog');

// Create a new blog (protected)
router.post(
    '/',
    auth,
    [
        body('title', 'Title is required').notEmpty(),
        body('content', 'Content is required').notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, content } = req.body;
            const newBlog = new Blog({
                title,
                content,
                author: req.user, // userId from auth middleware
            });

            await newBlog.save();
            res.status(201).json(newBlog);
        } catch (err) {
            console.error("Create Blog Error:", err.message);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Get all blogs (public - or change to protected if needed)
// For this refactor, let's assume fetching all blogs is public
// To get blogs for the logged-in user, a new route like /my-blogs or query param can be used.
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'username').sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        console.error("Get All Blogs Error:", err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single blog by ID (public)
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Blog ID format' });
        }
        const blog = await Blog.findById(req.params.id).populate('author', 'username');
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(blog);
    } catch (err) {
        console.error("Get Single Blog Error:", err.message);
        if (err.kind === 'ObjectId') { // Should be caught by isValid check, but as a fallback
            return res.status(400).json({ message: 'Invalid Blog ID format' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a blog (protected)
router.put(
    '/:id',
    auth,
    [
        body('title', 'Title cannot be empty if provided').optional().notEmpty(),
        body('content', 'Content cannot be empty if provided').optional().notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Blog ID format' });
        }

        try {
            const { title, content } = req.body;
            const blog = await Blog.findById(req.params.id);

            if (!blog) {
                return res.status(404).json({ message: 'Blog not found' });
            }

            // Authorization: Check if the logged-in user is the author
            if (blog.author.toString() !== req.user) {
                return res.status(403).json({ message: 'User not authorized to update this blog' });
            }

            // Update fields if provided
            if (title) blog.title = title;
            if (content) blog.content = content;

            // Ensure at least one field is being updated if validation is optional for presence
            if (!title && !content) {
                 return res.status(400).json({ message: 'No update fields provided. Title or content must be provided.' });
            }

            const updatedBlog = await blog.save();
            res.json(updatedBlog);
        } catch (err) {
            console.error("Update Blog Error:", err.message);
            if (err.kind === 'ObjectId') {
                 return res.status(400).json({ message: 'Invalid Blog ID format' });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Delete a blog (protected)
router.delete('/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid Blog ID format' });
    }
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Authorization: Check if the logged-in user is the author
        if (blog.author.toString() !== req.user) {
            return res.status(403).json({ message: 'User not authorized to delete this blog' });
        }

        await Blog.findByIdAndDelete(req.params.id); // Use findByIdAndDelete

        res.json({ message: 'Blog deleted successfully' });
        // Or res.status(204).send(); for No Content response
    } catch (err) {
        console.error("Delete Blog Error:", err.message);
         if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Blog ID format' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;