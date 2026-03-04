/**
 * Dynamically generates a middleware that checks if the user's JWT
 * contains the required feature string (e.g., 'admin:manage_users').
 */
const requireFeature = (featureCode) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userFeatures = req.user.features || [];

        if (!userFeatures.includes(featureCode)) {
            return res.status(403).json({
                error: 'Permission Denied',
                details: `Your current role lacks the required clearance: ${featureCode}`
            });
        }

        next();
    };
};

module.exports = {
    requireFeature
};
