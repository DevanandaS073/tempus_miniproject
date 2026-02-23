const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: requires admin role' });
    }
    next();
};

const isWorker = (req, res, next) => {
    if (!req.user || req.user.role !== 'user') { // Note: DB role is 'user', frontend displays as 'Worker'
        return res.status(403).json({ error: 'Access denied: requires worker role' });
    }
    next();
};

module.exports = { isAdmin, isWorker };
