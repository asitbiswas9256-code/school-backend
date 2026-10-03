const express = require('express');
const router = express.Router();
const { User, StudentProfile, Leave, Report, Notice, AuditLog } = require('../models');

// Global Search
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);
        const users = await User.find({
            $or: [
                { fullName: { $regex: query, $options: 'i' } },
                { userId: { $regex: query, $options: 'i' } }
            ]
        }, 'userId fullName role email isActive');
        res.status(200).json(users);
    } catch (error) { res.status(500).json({ message: "Search failed." }); }
});

// Offline Attendance
router.put('/attendance/:studentId', async (req, res) => {
    try {
        const { percentage, currentClass, rollNo } = req.body;
        let profile = await StudentProfile.findOne({ studentId: req.params.studentId });
        if (!profile) {
            profile = new StudentProfile({ studentId: req.params.studentId, currentClass, rollNo, annualAttendancePercentage: percentage });
        } else {
            profile.annualAttendancePercentage = percentage;
        }
        await profile.save();
        res.status(200).json({ message: "Attendance updated!", profile });
    } catch (error) { res.status(500).json({ message: "Failed to update attendance." }); }
});

// Urgent Notices
router.post('/notices', async (req, res) => {
    try {
        const newNotice = new Notice(req.body);
        await newNotice.save();
        res.status(201).json(newNotice);
    } catch (error) { res.status(500).json({ message: "Failed to post notice." }); }
});

// Leave Management
router.post('/leaves', async (req, res) => {
    try {
        const newLeave = new Leave(req.body);
        await newLeave.save();
        res.status(201).json(newLeave);
    } catch (error) { res.status(500).json({ message: "Failed to apply for leave." }); }
});
router.put('/leaves/:id', async (req, res) => {
    try {
        const leave = await Leave.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.status(200).json(leave);
    } catch (error) { res.status(500).json({ message: "Failed to update leave status." }); }
});

// Incident Reports
router.post('/reports', async (req, res) => {
    try {
        const newReport = new Report(req.body);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (error) { res.status(500).json({ message: "Failed to submit report." }); }
});

module.exports = router;
