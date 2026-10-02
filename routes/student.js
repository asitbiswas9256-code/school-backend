const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User, StudentProfile } = require('../models'); 

// THE FIX: Pointing to the middleware folder so Render doesn't crash
const { verifyToken } = require('../middleware/authMiddleware'); 

// GET: /api/student/profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({ message: "Access Denied: Student Portal Only." });
        }

        let student;
        if (mongoose.Types.ObjectId.isValid(req.user.id)) {
            student = await User.findById(req.user.id);
        } else {
            student = await User.findOne({ userId: req.user.id || req.user.userId });
        }

        if (!student) {
            return res.status(404).json({ message: "Student account not found." });
        }

        const profile = await StudentProfile.findOne({ studentId: student._id });
        
        if (!profile) {
            return res.status(404).json({ message: "Your profile is empty. A teacher has not updated your records yet." });
        }

        res.status(200).json({ fullName: student.fullName, profile });

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ message: "Server error while fetching student data." });
    }
});

module.exports = router;
