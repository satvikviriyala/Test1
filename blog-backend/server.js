require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// These handle the actual endpoints (login, signup, blog CRUD).
const authRoutes = require('./routes/auth'); // it loads auth.js 
const blogRoutes = require('./routes/blogs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // this tells to go to auth.js
app.use('/api/blogs', blogRoutes);

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error(err));