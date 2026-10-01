const express = require('express');
const { PreApproved } = require('../models');
const { protect, headmasterOnly, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// 1. HEADMASTER ONLY: Can add Assistant Headmasters
router.post('/add-assistant', protect, headmasterOnly, async (req, res) => {
    try {
        const { userId } = req.body;
        const newStaff = new PreApproved({ userId, role: 'Assistant Headmaster' });
        await newStaff.save();
        res.status(201).json({ message: `Assistant Headmaster ID (${userId}) created.` });
    } catch (error) {
        res.status(400).json({ message: "Error: That ID might already exist." });
    }
});

// 2. HIGH ADMINS ONLY (Headmaster & Assistant): Can add Teachers and Students
router.post('/add-user', protect, adminOnly, async (req, res) => {
    try {
        const { userId, role } = req.body;
        
        // Prevent lower admins from creating supreme accounts
        if (role === 'Headmaster' || role === 'Assistant Headmaster') {
            return res.status(403).json({ message: "Not authorized to create admin levels here." });
        }
        
        const newUser = new PreApproved({ userId, role });
        await newUser.save();
        res.status(201).json({ message: `${role} ID (${userId}) created successfully.` });
    } catch (error) {
        res.status(400).json({ message: "Error: That ID might already exist." });
    }
});

module.exports = router;
