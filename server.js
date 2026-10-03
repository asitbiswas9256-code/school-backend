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

// --- ALL ROUTE CONNECTIONS ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/student', require('./routes/student'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/lessons', require('./routes/lessons'));

// --- NEW OPERATIONS & PROFILES ---
app.use('/api/school', require('./routes/school'));
app.use('/api/profile', require('./routes/profile'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
