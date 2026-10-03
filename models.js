const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, password: { type: String, required: true }, email: { type: String, default: '' }, 
    role: { type: String, enum: ['Headmaster', 'Assistant Headmaster', 'Teacher', 'Student'], required: true }, fullName: { type: String, required: true },
    dob: { type: String, default: '' }, bloodGroup: { type: String, default: '' }, isActive: { type: Boolean, default: true }
}, { timestamps: true });

const PreApprovedIdSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, role: { type: String, enum: ['Assistant Headmaster', 'Student', 'Teacher'], required: true },
    isRegistered: { type: Boolean, default: false }
});

const StudentProfileSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, currentClass: { type: String, required: true }, rollNo: { type: String, required: true },
    annualAttendancePercentage: { type: Number, default: 0 }, behavioralRating: { type: Number, min: 1, max: 5 }, behavioralComments: { type: String },
    fees: { totalAnnual: { type: Number, default: 0 }, amountPaid: { type: Number, default: 0 }, pendingDues: { type: Number, default: 0 } }
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
    reporterId: { type: String, required: true }, reporterRole: { type: String, required: true }, title: { type: String, required: true }, description: { type: String, required: true },
    evidenceUrl: { type: String }, status: { type: String, enum: ['Pending', 'Reviewed', 'Resolved'], default: 'Pending' }
}, { timestamps: true });

const LeaveSchema = new mongoose.Schema({
    applicantId: { type: String, required: true }, applicantRole: { type: String, required: true }, startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
    reason: { type: String, required: true }, status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }, adminFeedback: { type: String, default: '' } 
}, { timestamps: true });

const NoticeSchema = new mongoose.Schema({
    title: { type: String, required: true }, content: { type: String, required: true }, type: { type: String, enum: ['Notice', 'Logistics'], required: true }, 
    authorId: { type: String, required: true }, authorRole: { type: String, required: true }
}, { timestamps: true });

const TeacherProfileSchema = new mongoose.Schema({
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, designation: { type: String, required: true }, subjects: [{ type: String }] 
}, { timestamps: true });

// UPDATED: Now includes "likes" array!
const LessonSchema = new mongoose.Schema({
    teacherId: { type: String, required: true }, teacherName: { type: String, required: true }, subject: { type: String, required: true },
    title: { type: String, required: true }, content: { type: String, required: true }, youtubeLink: { type: String, default: '' }, fileUrl: { type: String, default: '' }, 
    likes: [{ type: String }], 
    comments: [{ userId: String, fullName: String, text: String, createdAt: { type: Date, default: Date.now } }]
}, { timestamps: true });

const OtpSchema = new mongoose.Schema({
    userId: { type: String, required: true }, otpCode: { type: String, required: true }, createdAt: { type: Date, default: Date.now, expires: 300 } 
});

module.exports = {
    User: mongoose.model('User', UserSchema), PreApproved: mongoose.model('PreApproved', PreApprovedIdSchema), StudentProfile: mongoose.model('StudentProfile', StudentProfileSchema), 
    Report: mongoose.model('Report', ReportSchema), Leave: mongoose.model('Leave', LeaveSchema), Notice: mongoose.model('Notice', NoticeSchema),
    TeacherProfile: mongoose.model('TeacherProfile', TeacherProfileSchema), Lesson: mongoose.model('Lesson', LessonSchema), OTP: mongoose.model('OTP', OtpSchema)
};
