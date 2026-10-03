const express = require('express');
const router = express.Router();
const { Lesson } = require('../models');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'school_portal_lessons', resource_type: 'auto' },
});
const upload = multer({ storage: storage });

// 1. Publish Lesson (Now handles Media AND Thumbnails!)
router.post('/publish', upload.fields([{ name: 'mediaFile', maxCount: 1 }, { name: 'thumbnailFile', maxCount: 1 }]), async (req, res) => {
    try {
        const { teacherId, teacherName, subject, targetClass, playlistName, title, content } = req.body;
        
        // Grab the secure URLs from Cloudinary if files were uploaded
        const fileUrl = req.files && req.files['mediaFile'] ? req.files['mediaFile'][0].path : '';
        const thumbnailUrl = req.files && req.files['thumbnailFile'] ? req.files['thumbnailFile'][0].path : '';

        const newLesson = new Lesson({ 
            teacherId, teacherName, subject, targetClass, playlistName, title, content, fileUrl, thumbnailUrl 
        });
        await newLesson.save();
        res.status(201).json({ message: "Lesson published successfully!", lesson: newLesson });
    } catch (error) { 
        console.error(error);
        res.status(500).json({ message: "Failed to publish lesson." }); 
    }
});

// 2. Get All Lessons
router.get('/', async (req, res) => {
    try { res.status(200).json(await Lesson.find().sort({ createdAt: -1 })); } 
    catch (error) { res.status(500).json({ message: "Error fetching lessons." }); }
});

// 3. Delete Lesson
router.delete('/:id', async (req, res) => {
    try {
        await Lesson.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Lesson deleted permanently." });
    } catch (error) { res.status(500).json({ message: "Failed to delete lesson." }); }
});

// 4. Like/Unlike Lesson
router.post('/:id/like', async (req, res) => {
    try {
        const { userId } = req.body;
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ message: "Lesson not found." });

        const index = lesson.likes.indexOf(userId);
        if (index === -1) lesson.likes.push(userId); 
        else lesson.likes.splice(index, 1); 
        
        await lesson.save();
        res.status(200).json({ message: "Like updated.", likes: lesson.likes });
    } catch (error) { res.status(500).json({ message: "Failed to like lesson." }); }
});

// 5. Add Comment
router.post('/:id/comment', async (req, res) => {
    try {
        const { userId, fullName, text } = req.body;
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ message: "Lesson not found." });

        lesson.comments.push({ userId, fullName, text });
        await lesson.save();
        res.status(200).json({ message: "Comment added.", comments: lesson.comments });
    } catch (error) { res.status(500).json({ message: "Failed to add comment." }); }
});

module.exports = router;
