const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, PreApproved, StudentProfile } = require('../models');

// --- 1. REGISTER A NEW ACCOUNT ---
router.post('/register', async (req, res) => {
    try {
        const { userId, password, fullName, dob, bloodGroup, currentClass, rollNo } = req.body;

        // A. Check if the Headmaster authorized this ID
        const preApproved = await PreApproved.findOne({ userId });
        if (!preApproved) return res.status(403).json({ message: "This ID has not been authorized by the administration." });
        if (preApproved.isRegistered) return res.status(400).json({ message: "This ID is already registered." });

        // B. Securely scramble (hash) the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // C. Create the Master User Account
        const newUser = new User({
            userId, password: hashedPassword, role: preApproved.role, fullName, dob, bloodGroup
        });
        await newUser.save();

        // D. Mark ID as used
        preApproved.isRegistered = true;
        await preApproved.save();

        // E. Auto-generate a Student Profile if they are a student
        if (preApproved.role === 'Student') {
            const newStudentProfile = new StudentProfile({ 
                studentId: userId, currentClass: currentClass || 'Unassigned', rollNo: rollNo || 'N/A' 
            });
            await newStudentProfile.save();
        }

        res.status(201).json({ message: "Registration successful! You can now log in." });
    } catch (err) { res.status(500).json({ message: "Server error during registration." }); }
});


// --- 2. LOG IN ---
router.post('/login', async (req, res) => {
    try {
        const { userId, password } = req.body;

        // A. Find the user
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found." });

        // B. God-Mode Check: Is this user blocked?
        if (!user.isActive) return res.status(403).json({ message: "Your account has been blocked. Contact the Headmaster." });

        // C. Verify the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password." });

        // D. Generate a secure Digital Token (JWT)
        const token = jwt.sign(
            { id: user._id, userId: user.userId, role: user.role, fullName: user.fullName }, 
            process.env.JWT_SECRET || 'supersecretkey123', 
            { expiresIn: '7d' } // Keeps them logged in for 7 days
        );

        res.status(200).json({ 
            message: "Login successful", 
            token, 
            user: { userId: user.userId, role: user.role, fullName: user.fullName, email: user.email } 
        });
    } catch (err) { res.status(500).json({ message: "Server error during login." }); }
});

module.exports = router;
