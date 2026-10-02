const express = require('express');
const router = express.Router();
const { Report, User } = require('../models'); 
const { verifyToken, adminOnly } = require('../middleware/authMiddleware'); 

// 1. POST: Submit a confidential report (Students & Teachers)
router.post('/submit', verifyToken, async (req, res) => {
    try {
        const { title, description, evidenceUrl } = req.body;
        
        // Smart Upgrade: Fetch their readable ID (e.g., 'stu01') instead of the hidden database ID
        const user = await User.findById(req.user.id);
        const readableId = user ? user.userId : req.user.id;

        const newReport = new Report({
            reporterId: readableId,
            reporterRole: req.user.role,
            title,
            description,
            evidenceUrl,
            status: 'Pending'
        });

        await newReport.save();
        res.status(201).json({ message: "Confidential report submitted successfully." });
    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ message: "Error submitting report." });
    }
});

// 2. GET: Admin views all reports (Headmaster & Assistant Headmaster)
router.get('/all', verifyToken, adminOnly, async (req, res) => {
    try {
        // Changed to createdAt (Mongoose's default timestamp) to properly sort newest to oldest
        const reports = await Report.find().sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        console.error("Fetch Reports Error:", error);
        res.status(500).json({ message: "Error fetching reports." });
    }
});

// 3. PUT: Admin updates the status of a report (Pending -> Reviewed -> Resolved)
router.put('/:id/status', verifyToken, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        const updatedReport = await Report.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        
        if (!updatedReport) {
            return res.status(404).json({ message: "Report not found." });
        }
        
        res.status(200).json({ message: `Report marked as ${status}!`, report: updatedReport });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ message: "Error updating report status." });
    }
});

// 4. GET: Student/Teacher views their own past reports (My Outbox)
router.get('/my-reports', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const readableId = user ? user.userId : req.user.id;

        const myReports = await Report.find({ reporterId: readableId }).sort({ createdAt: -1 });
        res.status(200).json(myReports);
    } catch (error) {
        console.error("Fetch My Reports Error:", error);
        res.status(500).json({ message: "Error fetching your reports." });
    }
});

module.exports = router;
