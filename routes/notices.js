const express = require('express');
const router = express.Router();
const { Notice, User } = require('../models');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

// 1. POST: Headmaster or Assistant publishes an alert
router.post('/publish', verifyToken, adminOnly, async (req, res) => {
    try {
        const { title, content, type } = req.body;

        if (!title || !content || !type) {
            return res.status(400).json({ message: "Title, content, and type are required." });
        }

        const user = await User.findById(req.user.id);
        
        const newNotice = new Notice({
            title,
            content,
            type, // Must be 'Notice' or 'Logistics'
            authorId: user.userId,
            authorRole: req.user.role
        });

        await newNotice.save();
        res.status(201).json({ message: "Announcement published successfully!" });
    } catch (error) {
        console.error("Publish Error:", error);
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// 2. GET: Everyone (Students, Teachers, Admins) views the board
router.get('/all', verifyToken, async (req, res) => {
    try {
        // Fetches all notices, newest first
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.status(200).json(notices);
    } catch (error) {
        console.error("Fetch Notices Error:", error);
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

module.exports = router;
