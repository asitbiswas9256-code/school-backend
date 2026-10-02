const express = require('express');
const router = express.Router();
const { TeacherProfile, Lesson, User } = require('../models');
const { verifyToken } = require('../middleware/authMiddleware');

// ==========================================
// 1. TEACHER DIRECTORY & PROFILE ROUTES
// ==========================================

// POST: A Teacher sets up their Profile (Designation & Subjects)
router.post('/profile', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Teacher') {
            return res.status(403).json({ message: "Access denied. Only teachers can update this profile." });
        }

        const { designation, subjects } = req.body;
        let profile = await TeacherProfile.findOne({ teacherId: req.user.id });

        if (profile) {
            // Update existing profile
            profile.designation = designation || profile.designation;
            profile.subjects = subjects || profile.subjects;
            await profile.save();
        } else {
            // Create brand new profile
            profile = new TeacherProfile({
                teacherId: req.user.id,
                designation,
                subjects
            });
            await profile.save();
        }
        res.status(200).json({ message: "Teacher Profile updated successfully!", profile });
    } catch (error) {
        console.error("Profile Error:", error);
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// GET: Fetch the Global Teacher Directory (Everyone can see this)
router.get('/directory', verifyToken, async (req, res) => {
    try {
        // We use .populate() to pull the Teacher's full name from the main User database!
        const directory = await TeacherProfile.find().populate('teacherId', 'fullName userId');
        res.status(200).json(directory);
    } catch (error) {
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// ==========================================
// 2. DIGITAL CLASSROOM (LESSON POSTS)
// ==========================================

// POST: Teacher publishes a new lesson to the feed
router.post('/lessons', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Teacher') {
            return res.status(403).json({ message: "Only teachers can post lessons." });
        }

        const { subject, title, content, youtubeLink, fileUrl } = req.body;

        if (!subject || !title || !content) {
            return res.status(400).json({ message: "Subject, title, and content are required." });
        }

        const user = await User.findById(req.user.id);

        const newLesson = new Lesson({
            teacherId: user.userId,
            teacherName: user.fullName,
            subject,
            title,
            content,
            youtubeLink: youtubeLink || '',
            fileUrl: fileUrl || ''
        });

        await newLesson.save();
        res.status(201).json({ message: "Lesson successfully published to the Digital Classroom!" });
    } catch (error) {
        console.error("Lesson Post Error:", error);
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// GET: Fetch all lessons for the Digital Classroom feed (Newest first)
router.get('/lessons', verifyToken, async (req, res) => {
    try {
        const lessons = await Lesson.find().sort({ createdAt: -1 });
        res.status(200).json(lessons);
    } catch (error) {
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

// POST: Add a comment to a lesson (Both Students and Teachers can comment)
router.post('/lessons/:id/comment', verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "Comment text is required." });

        const user = await User.findById(req.user.id);
        const lesson = await Lesson.findById(req.params.id);

        if (!lesson) return res.status(404).json({ message: "Lesson not found." });

        // Push the new comment into the lesson's comment array
        lesson.comments.push({
            userId: user.userId,
            fullName: user.fullName,
            text
        });

        await lesson.save();
        res.status(201).json({ message: "Comment posted!" });
    } catch (error) {
        res.status(500).json({ message: `Database Error: ${error.message}` });
    }
});

module.exports = router;
