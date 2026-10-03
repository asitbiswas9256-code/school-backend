const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, StudentProfile, PreApproved, Lesson } = require('../models');

// 1. UPDATE OWN PROFILE (Name, DOB, Blood Group)
router.put('/update', async (req, res) => {
    try {
        const { userId, fullName, dob, bloodGroup } = req.body;
        await User.findOneAndUpdate({ userId }, { fullName, dob, bloodGroup });
        res.json({ message: "Profile updated successfully!" });
    } catch (err) { res.status(500).json({ message: "Failed to update profile." }); }
});

// 2. CHANGE PASSWORD
router.put('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        const user = await User.findOne({ userId });
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password." });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        
        res.json({ message: "Password changed successfully!" });
    } catch (err) { res.status(500).json({ message: "Failed to change password." }); }
});

// 3. CHANGE ADMIN ID (Headmaster Only)
router.put('/change-admin-id', async (req, res) => {
    try {
        const { currentId, newId } = req.body;
        const exists = await User.findOne({ userId: newId });
        if (exists) return res.status(400).json({ message: "That ID is already taken by someone else." });

        // Update the ID everywhere in the database
        await User.findOneAndUpdate({ userId: currentId }, { userId: newId });
        await PreApproved.findOneAndUpdate({ userId: currentId }, { userId: newId });
        await Lesson.updateMany({ teacherId: currentId }, { teacherId: newId }); // Keeps your old videos linked!

        res.json({ message: "Admin ID changed successfully! You will be logged out to apply changes." });
    } catch (err) { res.status(500).json({ message: "Failed to change Admin ID." }); }
});

// 4. EDIT A STUDENT'S PROFILE (For Admins & Teachers)
router.put('/edit-student/:studentId', async (req, res) => {
    try {
        const { fullName, dob, bloodGroup, currentClass, rollNo } = req.body;
        
        // Update their main account
        await User.findOneAndUpdate({ userId: req.params.studentId }, { fullName, dob, bloodGroup });
        
        // Update their academic profile
        let profile = await StudentProfile.findOne({ studentId: req.params.studentId });
        if (profile) {
            profile.currentClass = currentClass;
            profile.rollNo = rollNo;
            await profile.save();
        } else {
            // If they registered before we built the academic profile, create it now!
            const newProfile = new StudentProfile({ studentId: req.params.studentId, currentClass, rollNo });
            await newProfile.save();
        }
        
        res.json({ message: "Student profile updated successfully!" });
    } catch (err) { res.status(500).json({ message: "Failed to update student." }); }
});

module.exports = router;
