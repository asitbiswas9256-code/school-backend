const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User, PreApproved, StudentProfile, OTP } = require('../models');

// --- EMAIL TRANSPORTER SETUP ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// --- 1. REGISTER A NEW ACCOUNT ---
router.post('/register', async (req, res) => {
    try {
        const { userId, password, fullName, dob, bloodGroup, currentClass, rollNo } = req.body;
        const preApproved = await PreApproved.findOne({ userId });
        if (!preApproved) return res.status(403).json({ message: "This ID has not been authorized." });
        if (preApproved.isRegistered) return res.status(400).json({ message: "This ID is already registered." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ userId, password: hashedPassword, role: preApproved.role, fullName, dob, bloodGroup });
        await newUser.save();

        preApproved.isRegistered = true;
        await preApproved.save();

        if (preApproved.role === 'Student') {
            const newStudentProfile = new StudentProfile({ studentId: userId, currentClass: currentClass || 'Unassigned', rollNo: rollNo || 'N/A' });
            await newStudentProfile.save();
        }
        res.status(201).json({ message: "Registration successful!" });
    } catch (err) { res.status(500).json({ message: "Server error during registration." }); }
});

// --- 2. LOG IN ---
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found." });
        if (!user.isActive) return res.status(403).json({ message: "Account blocked." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password." });

        const token = jwt.sign(
            { id: user._id, userId: user.userId, role: user.role, fullName: user.fullName }, 
            process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '7d' }
        );

        res.status(200).json({ message: "Login successful", token, user: { userId: user.userId, role: user.role, fullName: user.fullName, email: user.email } });
    } catch (err) { res.status(500).json({ message: "Server error during login." }); }
});

// --- 3. REQUEST OTP (FORGOT PASSWORD) ---
router.post('/forgot-password', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User ID not found." });
        if (!user.email) return res.status(400).json({ message: "No email is linked to this account. Contact administration." });

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to Database
        await OTP.deleteMany({ userId }); // Clear old OTPs
        const newOtp = new OTP({ userId, otpCode });
        await newOtp.save();

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'School Portal - Password Reset OTP',
            text: `Your password reset OTP is: ${otpCode}\n\nThis code will expire in 5 minutes.`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "OTP sent to your registered email!" });
    } catch (err) { console.error(err); res.status(500).json({ message: "Failed to send email." }); }
});

// --- 4. VERIFY OTP & RESET PASSWORD ---
router.post('/reset-password', async (req, res) => {
    try {
        const { userId, otpCode, newPassword } = req.body;
        
        const validOtp = await OTP.findOne({ userId, otpCode });
        if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findOneAndUpdate({ userId }, { password: hashedPassword });
        await OTP.deleteMany({ userId }); // Clean up

        res.status(200).json({ message: "Password reset successfully! You can now log in." });
    } catch (err) { res.status(500).json({ message: "Failed to reset password." }); }
});

// --- 5. MASTER ADMIN GENERATOR (One-Time Use) ---
router.get('/setup-master', async (req, res) => {
    try {
        const masterId = "ADMIN-001";
        const exists = await PreApproved.findOne({ userId: masterId });
        if (exists) return res.send(`<h1>ID ${masterId} is already authorized!</h1>`);
        const newPreApp = new PreApproved({ userId: masterId, role: 'Headmaster' });
        await newPreApp.save();
        res.send(`<h1>Success!</h1><p>Your Master Admin ID is: <b>${masterId}</b></p>`);
    } catch (err) { res.status(500).send("Error generating ID."); }
});

module.exports = router;
