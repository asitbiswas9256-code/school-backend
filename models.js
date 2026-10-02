const mongoose = require('mongoose');

// 1. User Schema (Handles all 4 roles + Login)
const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // THE FIX: Removed the underscore to match the frontend perfectly
    role: { type: String, enum: ['Headmaster', 'Assistant Headmaster', 'Teacher', 'Student'], required: true },
    fullName: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 2. Pre-Approved IDs (Gatekeeper for Registration)
const PreApprovedIdSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    // THE FIX: Added 'Assistant Headmaster' to the allowed list so MongoDB stops rejecting it
    role: { type: String, enum: ['Assistant Headmaster', 'Student', 'Teacher'], required: true },
    isRegistered: { type: Boolean, default: false }
});

// 3. Student Profile Schema (Unified Portal Data)
const StudentProfileSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentClass: { type: String, required: true },
    annualAttendancePercentage: { type: Number, default: 0 },
    behavioralRating: { type: Number, min: 1, max: 5 },
    behavioralComments: { type: String },
    fees: {
        totalAnnual: { type: Number, required: true },
        amountPaid: { type: Number, default: 0 },
        pendingDues: { type: Number, required: true }
    }
}, { timestamps: true });

// 4. Confidential Whistleblower Portal
const ReportSchema = new mongoose.Schema({
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    evidenceUrl: { type: String },
    status: { type: String, enum: ['Pending', 'Reviewed', 'Resolved'], default: 'Pending' }
}, { timestamps: true });

module.exports = {
    User: mongoose.model('User', UserSchema),
    PreApproved: mongoose.model('PreApproved', PreApprovedIdSchema),
    StudentProfile: mongoose.model('StudentProfile', StudentProfileSchema),
    Report: mongoose.model('Report', ReportSchema)
};
