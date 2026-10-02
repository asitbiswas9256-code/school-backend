const express = require('express');
const router = express.Router();
const { Leave, User } = require('../models'); 
const { verifyToken, adminOnly } = require('../middleware/authMiddleware'); 

// 1. POST: Student or Teacher submits a leave application
router.post('/submit', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;

        if (!startDate || !endDate || !reason) {
            return res.status(400).json({ message: "Start date, end date, and reason are required." });
        }
        
        const user = await User.findById(req.user.id);
        const readableId = user ? user.userId : req.user.id;

        const newLeave = new Leave({
            applicantId: readableId,
            applicantRole: req.user.role,
            startDate,
            endDate,
            reason,
            status: 'Pending',
            adminFeedback: '' 
        });

        await newLeave.save();
        res.status(201).json({ message: "Leave application securely submitted to the Headmaster." });
    } catch (error) {
        console.error("Leave Submission Error:", error);
        // THE FIX: This will now send the exact database rejection reason to your screen!
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// 2. GET: Headmaster views the Global Leave Inbox
router.get('/all', verifyToken, adminOnly, async (req, res) => {
    try {
        const leaves = await Leave.find().sort({ createdAt: -1 });
        res.status(200).json(leaves);
    } catch (error) {
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// 3. PUT: Headmaster Approves or Rejects the application (with feedback)
router.put('/:id/status', verifyToken, adminOnly, async (req, res) => {
    try {
        const { status, adminFeedback } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status update." });
        }

        const updatedLeave = await Leave.findByIdAndUpdate(
            req.params.id, 
            { 
                status, 
                adminFeedback: adminFeedback || '' 
            }, 
            { new: true }
        );
        
        if (!updatedLeave) {
            return res.status(404).json({ message: "Leave application not found." });
        }
        
        res.status(200).json({ message: `Leave successfully marked as ${status}.`, leave: updatedLeave });
    } catch (error) {
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// 4. GET: Student/Teacher Notification Portal
router.get('/my-leaves', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const readableId = user ? user.userId : req.user.id;

        const myLeaves = await Leave.find({ applicantId: readableId }).sort({ createdAt: -1 });
        res.status(200).json(myLeaves);
    } catch (error) {
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

module.exports = router;
