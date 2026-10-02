const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err));

app.get('/', (req, res) => res.send('API running smoothly'));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// NEW TEACHER ROUTE ADDED HERE
const teacherRoutes = require('./routes/teacher');
app.use('/api/teacher', teacherRoutes);

// NEW STUDENT ROUTE ADDED HERE
const studentRoutes = require('./routes/student');
app.use('/api/student', studentRoutes);

// NEW REPORTS ROUTE ADDED HERE
const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
