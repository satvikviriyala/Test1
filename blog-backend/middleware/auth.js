const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const tokenParts = authHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Token format is "Bearer <token>"' });
    }

    const token = tokenParts[1];

    try {
        // JWT_SECRET should be set in environment variables
        // If process.env.JWT_SECRET is undefined, jwt.verify will throw an error
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.userId; // Assuming your JWT payload has userId
        next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
}

module.exports = auth;