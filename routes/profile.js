const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { User, StudentProfile, PreApproved, Lesson, OTP } = require('../models');

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// 1. UPDATE OWN PROFILE (Name, DOB, Blood Group)
router.put('/update', async (req, res) => {
    try {
        const { userId, fullName, dob, bloodGroup } = req.body;
        await User.findOneAndUpdate({ userId }, { fullName, dob, bloodGroup });
        res.json({ message: "Profile updated successfully!" });
    } catch (err) { res.status(500).json({ message: "Failed to update profile." }); }
});

// 2. UPDATE EMAIL (FIXED!)
router.put('/update-email', async (req, res) => {
    try {
        const { userId, email } = req.body;
        await User.findOneAndUpdate({ userId }, { email });
        res.json({ message: "Email updated successfully!" });
    } catch (err) { res.status(500).json({ message: "Failed to update email." }); }
});

// 3. STEP ONE: REQUEST PASSWORD CHANGE (SENDS OTP)
router.post('/request-password-change', async (req, res) => {
    try {
        const { userId, currentPassword } = req.body;
        const user = await User.findOne({ userId });
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password." });

        if (!user.email) return res.status(400).json({ message: "No recovery email found! Please save your email first." });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await OTP.deleteMany({ userId }); // Clear old OTPs
        await new OTP({ userId, otpCode }).save();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Security Alert: Password Change Request',
            text: `You requested to change your password.\n\nYour security OTP is: ${otpCode}\n\nDo not share this code with anyone.`
        };
        await transporter.sendMail(mailOptions);

        res.json({ message: "OTP sent to your email!" });
    } catch (err) { res.status(500).json({ message: "Failed to send OTP." }); }
});

// 4. STEP TWO: VERIFY OTP & CHANGE PASSWORD
router.put('/verify-password-change', async (req, res) => {
    try {
        const { userId, otpCode, newPassword } = req.body;
        const validOtp = await OTP.findOne({ userId, otpCode });
        if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await User.findOneAndUpdate({ userId }, { password: hashedPassword });
        await OTP.deleteMany({ userId });

        res.json({ message: "Password changed successfully!" });
    } catch (err) { res.status(500).json({ message: "Failed to change password." }); }
});

// 5. CHANGE ADMIN ID (Headmaster Only)
router.put('/change-admin-id', async (req, res) => {
    try {
        const { currentId, newId } = req.body;
        const exists = await User.findOne({ userId: newId });
        if (exists) return res.status(400).json({ message: "That ID is already taken." });

        await User.findOneAndUpdate({ userId: currentId }, { userId: newId });
        await PreApproved.findOneAndUpdate({ userId: currentId }, { userId: newId });
        await Lesson.updateMany({ teacherId: currentId }, { teacherId: newId });

        res.json({ message: "Admin ID changed successfully! You will be logged out." });
    } catch (err) { res.status(500).json({ message: "Failed to change Admin ID." }); }
});

// 6. EDIT A STUDENT'S PROFILE
router.put('/edit-student/:studentId', async (req, res) => {
    try {
        const { fullName, dob, bloodGroup, currentClass, rollNo } = req.body;
        await User.findOneAndUpdate({ userId: req.params.studentId }, { fullName, dob, bloodGroup });
        
        let profile = await StudentProfile.findOne({ studentId: req.params.studentId });
        if (profile) {
            profile.currentClass = currentClass;
            profile.rollNo = rollNo;
            await profile.save();
        } else {
            const newProfile = new StudentProfile({ studentId: req.params.studentId, currentClass, rollNo });
            await newProfile.save();
        }
        res.json({ message: "Student profile updated successfully!" });
    } catch (err) { res.status(500).json({ message: "Failed to update student." }); }
});

module.exports = router;
