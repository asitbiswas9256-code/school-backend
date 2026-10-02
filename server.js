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

const teacherRoutes = require('./routes/teacher');
app.use('/api/teacher', teacherRoutes);

const studentRoutes = require('./routes/student');
app.use('/api/student', studentRoutes);

const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

// NEW LEAVE ROUTE ADDED HERE
const leaveRoutes = require('./routes/leaves');
app.use('/api/leaves', leaveRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
