const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');

// Signup route
router.post(
    '/signup',
    [
        body('username', 'Username is required and must be at least 3 characters').notEmpty().isLength({ min: 3 }),
        body('email', 'Please include a valid email').isEmail(),
        body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, email, password } = req.body;

            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: 'Email already registered' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({ username, email, password: hashedPassword });
            await user.save();

            // Create JWT payload
            const payload = {
                userId: user._id,
            };

            // Sign token - JWT_SECRET must be in .env
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(201).json({ token, username: user.username, message: 'User created successfully' });

        } catch (err) {
            console.error("Signup Error:", err.message);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Login route
router.post(
    '/login',
    [
        body('email', 'Please include a valid email').isEmail(),
        body('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const payload = {
                userId: user._id,
            };

            // Sign token - JWT_SECRET must be in .env
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.json({ token, userId: user._id, username: user.username });
        } catch (err) {
            console.error("Login Error:",err.message);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

module.exports = router;