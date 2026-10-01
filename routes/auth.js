const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, PreApproved } = require('../models');

const router = express.Router();

// 1. HEADMASTER REGISTRATION
router.post('/register-headmaster', async (req, res) => {
    try {
        const { userId, password, fullName, adminSecret } = req.body;
        if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
            return res.status(403).json({ message: "Unauthorized attempt." });
        }
        const existingUser = await User.findOne({ userId });
        if (existingUser) return res.status(400).json({ message: "Headmaster ID already exists." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newHeadmaster = new User({
            userId, password: hashedPassword, role: 'Headmaster', fullName
        });
        await newHeadmaster.save();
        res.status(201).json({ message: "Headmaster registered successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GATEKEPT STUDENT/TEACHER REGISTRATION
router.post('/register', async (req, res) => {
    try {
        const { userId, password, fullName } = req.body;
        const approvedId = await PreApproved.findOne({ userId });
        if (!approvedId) return res.status(401).json({ message: "Registration blocked: ID not found." });
        if (approvedId.isRegistered) return res.status(400).json({ message: "Account already exists." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            userId, password: hashedPassword, role: approvedId.role, fullName
        });
        await newUser.save();

        approvedId.isRegistered = true;
        await approvedId.save();

        res.status(201).json({ message: `${approvedId.role} registered successfully.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. UNIVERSAL LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

        const token = jwt.sign(
            { id: user._id, role: user.role, userId: user.userId },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({ token, role: user.role, fullName: user.fullName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
