const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const Blog = require('../models/Blog');

// Create a new blog (protected)
router.post('/', auth, async(req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const newBlog = new Blog({
            title,
            content,
            author: req.user, // userId from auth middleware
        });

        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all blogs for logged-in user (protected)
router.get('/', auth, async(req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user }).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;