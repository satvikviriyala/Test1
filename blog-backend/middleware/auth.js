const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

function auth(req, res, next) {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Remove "Bearer " if token is sent as "Bearer <token>"
        const actualToken = token.startsWith('Bearer ') ? token.slice(7, token.length).trim() : token;

        const decoded = jwt.verify(actualToken, JWT_SECRET);
        req.user = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
}

module.exports = auth;