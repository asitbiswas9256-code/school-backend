const express = require('express');
const router = express.Router();
const { Report } = require('../models'); 
const { verifyToken, adminOnly } = require('../middleware/authMiddleware'); 

// POST: Submit a confidential report (Students & Teachers)
router.post('/submit', verifyToken, async (req, res) => {
    try {
        const { title, description, evidenceUrl } = req.body;
        
        const newReport = new Report({
            reporterId: req.user.id,
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

// GET: Admin views all reports (Headmaster & Assistant Headmaster)
router.get('/all', verifyToken, adminOnly, async (req, res) => {
    try {
        const reports = await Report.find().sort({ submittedAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        console.error("Fetch Reports Error:", error);
        res.status(500).json({ message: "Error fetching reports." });
    }
});

module.exports = router;
