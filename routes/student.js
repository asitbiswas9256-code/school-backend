const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User, StudentProfile } = require('../models'); 
const { verifyToken } = require('../authMiddleware'); 

// GET: /api/student/profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        // 1. Security Check: Only Students can access this specific door
        if (req.user.role !== 'Student') {
            return res.status(403).json({ message: "Access Denied: Student Portal Only." });
        }

        // 2. Safely find who is logged in based on their digital badge (JWT)
        let student;
        if (mongoose.Types.ObjectId.isValid(req.user.id)) {
            student = await User.findById(req.user.id);
        } else {
            student = await User.findOne({ userId: req.user.id || req.user.userId });
        }

        if (!student) {
            return res.status(404).json({ message: "Student account not found." });
        }

        // 3. Find their specific grades and fees
        const profile = await StudentProfile.findOne({ studentId: student._id });
        
        if (!profile) {
            return res.status(404).json({ message: "Your profile is empty. A teacher has not updated your records yet." });
        }

        // 4. Send the data back to the frontend
        res.status(200).json({ fullName: student.fullName, profile });

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ message: "Server error while fetching student data." });
    }
});

module.exports = router;
