const express = require('express');
const router = express.Router();
// Adjust these paths if your files are in different folders!
const { User, StudentProfile } = require('../models'); 
const { verifyToken } = require('../authMiddleware'); 

// POST: /api/teacher/update-student
router.post('/update-student', verifyToken, async (req, res) => {
    try {
        // 1. Security Guard: Only Teachers and Admins can update grades/fees
        if (req.user.role !== 'Teacher' && req.user.role !== 'Headmaster' && req.user.role !== 'Assistant Headmaster') {
            return res.status(403).json({ message: "Access Denied: Only authorized staff can update student records." });
        }

        const { studentUserId, currentClass, annualAttendancePercentage, behavioralRating, behavioralComments, totalAnnual, amountPaid, pendingDues } = req.body;

        // 2. Find the student by the ID the teacher typed in (e.g., 'stu01')
        const student = await User.findOne({ userId: studentUserId, role: 'Student' });
        if (!student) {
            return res.status(404).json({ message: "Student not found. Please check the ID and try again." });
        }

        // 3. Package the data exactly how your models.js blueprint requires it
        const profileData = {
            studentId: student._id, // MongoDB's hidden internal ID
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

        // 4. Upsert Magic: If a profile exists, update it. If not, create a brand new one.
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
