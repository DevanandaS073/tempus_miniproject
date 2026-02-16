const jwt = require('jsonwebtoken');

<<<<<<< HEAD
=======
const JWT_SECRET = process.env.JWT_SECRET || 'tempus-secret-key';

>>>>>>> origin/GouthamSanthosh
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

<<<<<<< HEAD
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
=======
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
>>>>>>> origin/GouthamSanthosh
        req.user = user;
        next();
    });
}

module.exports = { authenticateToken };
<<<<<<< HEAD
=======

>>>>>>> origin/GouthamSanthosh
