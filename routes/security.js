const express = require('express');
const router = express.Router();
const { User, OTP } = require('../models');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');

// Set up the Email Sender using your Render Environment Variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Safety fallback for password hashing
const hashPassword = async (password) => {
    try {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch(e) {
        try {
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(password, salt);
        } catch(err) {
            return password; // Fallback
        }
    }
};

// 1. ADMIN ONLY: Force Reset ANY User's Password
router.put('/admin-reset', verifyToken, adminOnly, async (req, res) => {
    try {
        const { targetUserId, newPassword } = req.body;
        if (!targetUserId || !newPassword) return res.status(400).json({ message: "Missing ID or password." });
        
        const hashed = await hashPassword(newPassword);
        const user = await User.findOneAndUpdate({ userId: targetUserId }, { password: hashed });
        
        if (!user) return res.status(404).json({ message: "User ID not found." });
        res.status(200).json({ message: `Success: Password reset for ${targetUserId}.` });
    } catch (error) {
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// 2. ALL AUTHORIZED USERS: Change their OWN password
router.put('/change-my-password', verifyToken, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: "New password required." });

        const hashed = await hashPassword(newPassword);
        await User.findByIdAndUpdate(req.user.id, { password: hashed });
        
        res.status(200).json({ message: "Your personal password has been securely updated." });
    } catch (error) {
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// 3. NEW: Generate and Send OTP via Email
router.post('/send-otp', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: "User ID is required." });

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User ID not found." });
        if (!user.email) return res.status(400).json({ message: "No email linked to this account. Please contact the Headmaster." });

        // Generate a random 6-digit code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save it to the database (it deletes itself after 5 mins)
        await OTP.findOneAndDelete({ userId }); // Remove old OTPs just in case
        const newOtp = new OTP({ userId, otpCode });
        await newOtp.save();

        // Email the code to the user
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'School Portal - Password Reset Code',
            text: `Hello ${user.fullName},\n\nYour password reset OTP is: ${otpCode}\n\nThis code is valid for 5 minutes. Do not share it with anyone.`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "OTP sent successfully to your registered email!" });
    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ message: "Failed to send email. Check backend configuration." });
    }
});

// 4. NEW: Verify OTP and Reset Password
router.post('/reset-with-otp', async (req, res) => {
    try {
        const { userId, otpCode, newPassword } = req.body;
        if (!userId || !otpCode || !newPassword) return res.status(400).json({ message: "Please fill all fields." });

        // Verify the OTP exists and matches
        const validOtp = await OTP.findOne({ userId, otpCode });
        if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP." });

        // Update the password
        const hashed = await hashPassword(newPassword);
        await User.findOneAndUpdate({ userId }, { password: hashed });

        // Delete the used OTP so it can't be used again
        await OTP.findOneAndDelete({ userId, otpCode });

        res.status(200).json({ message: "Password reset successful! You can now log in." });
    } catch (error) {
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

module.exports = router;
