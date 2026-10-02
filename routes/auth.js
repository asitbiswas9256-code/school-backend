const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, PreApproved, StudentProfile } = require('../models');

const hashPassword = async (password) => {
    try { const bcrypt = require('bcryptjs'); const salt = await bcrypt.genSalt(10); return await bcrypt.hash(password, salt); } 
    catch(e) { try { const bcrypt = require('bcrypt'); const salt = await bcrypt.genSalt(10); return await bcrypt.hash(password, salt); } catch(err) { return password; } }
};

const comparePassword = async (entered, saved) => {
    try { const bcrypt = require('bcryptjs'); return await bcrypt.compare(entered, saved); } 
    catch(e) { try { const bcrypt = require('bcrypt'); return await bcrypt.compare(entered, saved); } catch(err) { return entered === saved; } }
};

router.post('/login', async (req, res) => {
    try {
        const { userId, password, role } = req.body;
        const user = await User.findOne({ userId, role });
        if (!user) return res.status(404).json({ message: "User not found or incorrect role." });
        if (!user.isActive) return res.status(403).json({ message: "Account is disabled." });

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '1d' });
        res.status(200).json({ token, role: user.role, message: "Login successful" });
    } catch (error) { res.status(500).json({ message: `Server error: ${error.message}` }); }
});

// NEW: SELF-REGISTRATION / ACTIVATION
router.post('/activate', async (req, res) => {
    try {
        const { userId, role, fullName, email, password, dob, bloodGroup, currentClass, rollNo } = req.body;

        const preApp = await PreApproved.findOne({ userId, role });
        if (!preApp) return res.status(403).json({ message: "This ID has not been authorized by the Admin." });
        if (preApp.isRegistered) return res.status(400).json({ message: "This ID has already been activated!" });

        const hashedPassword = await hashPassword(password);
        const newUser = new User({ userId, password: hashedPassword, role, fullName, email, dob, bloodGroup });
        await newUser.save();

        if (role === 'Student') {
            const studentData = new StudentProfile({ studentId: newUser._id, currentClass, rollNo });
            await studentData.save();
        }

        preApp.isRegistered = true;
        await preApp.save();

        res.status(201).json({ message: "Account successfully activated! You can now log in." });
    } catch (error) {
        res.status(500).json({ message: `Activation Error: ${error.message}` });
    }
});

module.exports = router;
