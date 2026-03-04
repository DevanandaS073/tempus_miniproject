const requireTenant = (req, res, next) => {
    // authMiddleware should have already run and attached req.user
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.company_id) {
        return res.status(403).json({
            error: 'Workspace Required',
            details: 'You must belong to a company/workspace to access this resource.'
        });
    }

    next();
};

module.exports = {
    requireTenant
};
