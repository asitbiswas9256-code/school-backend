const express = require('express');
const router = express.Router();
const { User, StudentProfile } = require('../models'); 

// THE FIX: Pointing to the middleware folder so Render doesn't crash
const { verifyToken } = require('../middleware/authMiddleware'); 

// POST: /api/teacher/update-student
router.post('/update-student', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Teacher' && req.user.role !== 'Headmaster' && req.user.role !== 'Assistant Headmaster') {
            return res.status(403).json({ message: "Access Denied: Only authorized staff can update student records." });
        }

        const { studentUserId, currentClass, annualAttendancePercentage, behavioralRating, behavioralComments, totalAnnual, amountPaid, pendingDues } = req.body;

        const student = await User.findOne({ userId: studentUserId, role: 'Student' });
        if (!student) {
            return res.status(404).json({ message: "Student not found. Please check the ID and try again." });
        }

        const profileData = {
            studentId: student._id, 
            currentClass,
            annualAttendancePercentage,
            behavioralRating,
            behavioralComments,
            fees: {
                totalAnnual,
                amountPaid,
                pendingDues
            }
        };

        const updatedProfile = await StudentProfile.findOneAndUpdate(
            { studentId: student._id },
            { $set: profileData },
            { new: true, upsert: true }
        );

        res.status(200).json({ message: "Student profile updated successfully!", profile: updatedProfile });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ message: "Server error while saving student data." });
    }
});

module.exports = router;
