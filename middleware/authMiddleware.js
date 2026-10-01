const jwt = require('jsonwebtoken');

// 1. The Front Door Guard: Checks if the user is logged in at all
const protect = (req, res, next) => {
    // Look for the ID badge in the request header
    const token = req.header('Authorization');
    
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No ID badge found.' });
    }

    try {
        // Verify the badge is real using your JWT_SECRET from Render
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach their profile (and role) to the request
        next(); // Let them pass
    } catch (err) {
        res.status(401).json({ message: 'Access Denied: Fake or expired ID badge.' });
    }
};

// 2. The Supreme Guard: Only lets the Headmaster through
const headmasterOnly = (req, res, next) => {
    if (req.user && req.user.role === 'Headmaster') {
        next(); // Let them pass
    } else {
        res.status(403).json({ message: 'Supreme Access Denied: Headmaster rank required.' });
    }
};

// 3. The High Guard: Lets Headmaster AND Assistant Headmaster through
const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'Headmaster' || req.user.role === 'Assistant Headmaster')) {
        next(); // Let them pass
    } else {
        res.status(403).json({ message: 'High Access Denied: Admin rank required.' });
    }
};

module.exports = { protect, headmasterOnly, adminOnly };
