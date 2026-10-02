const express = require('express');
const router = express.Router();
const { Lesson } = require('../models');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// 1. Log into Cloudinary using your Render variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Set up the File Uploader (Accepts images, video, and audio automatically)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'school_portal_lessons',
        resource_type: 'auto', 
    },
});
const upload = multer({ storage: storage });

// 3. Publish Lesson Route (Now with file uploads!)
// "upload.single('mediaFile')" intercepts the file before running the rest of the code
router.post('/publish', upload.single('mediaFile'), async (req, res) => {
    try {
        const { teacherId, teacherName, subject, title, content, youtubeLink } = req.body;
        
        // If a file was uploaded, Cloudinary automatically gives us a secure link!
        const fileUrl = req.file ? req.file.path : '';

        const newLesson = new Lesson({
            teacherId, teacherName, subject, title, content, youtubeLink, fileUrl
        });
        
        await newLesson.save();
        res.status(201).json({ message: "Lesson published successfully!", lesson: newLesson });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: "Failed to publish lesson. Check file size or format." });
    }
});

// 4. Get All Lessons Route
router.get('/', async (req, res) => {
    try {
        const lessons = await Lesson.find().sort({ createdAt: -1 });
        res.status(200).json(lessons);
    } catch (error) {
        res.status(500).json({ message: "Error fetching lessons." });
    }
});

module.exports = router;
