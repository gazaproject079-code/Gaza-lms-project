const { Sponsorship, User, ForumChannel, Course, Enrollment, DailyActivity, QuizResult, Certificate, StudentUpload } = require('../models');
const { Op } = require('sequelize');

exports.getAvailableStudents = async (req, res) => {
  try {
    // Find students who do not have an active sponsorship
    const sponsoredStudentIds = await Sponsorship.findAll({
      where: { status: 'active' },
      attributes: ['studentId']
    }).then(sponsorships => sponsorships.map(s => s.studentId));

    const availableStudents = await User.findAll({
      where: {
        role: 'student',
        id: { [Op.notIn]: sponsoredStudentIds }
      },
      attributes: ['id', 'name', 'location', 'isWarZone', 'profilePicture', 'createdAt']
    });

    res.json(availableStudents);
  } catch (error) {
    console.error('Error fetching available students:', error);
    res.status(500).json({ error: 'Server error fetching available students' });
  }
};

exports.sponsorStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const sponsorId = req.user.id;

    // Verify student exists and is a student
    const student = await User.findOne({ where: { id: studentId, role: 'student' } });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if already sponsored actively
    const existingSponsorship = await Sponsorship.findOne({
      where: { studentId, status: 'active' }
    });

    if (existingSponsorship) {
      return res.status(400).json({ error: 'Student is already sponsored by someone else' });
    }

    // Create Sponsorship
    const sponsorship = await Sponsorship.create({
      sponsorId,
      studentId,
      status: 'active'
    });

    // Create a direct messaging channel for them
    const sponsor = await User.findByPk(sponsorId);
    
    await ForumChannel.create({
      name: `Direct: ${sponsor.name} & ${student.name}`,
      description: 'Private 1-on-1 channel for sponsor and student',
      type: 'direct',
      adminOnly: false,
      directUserId1: sponsorId,
      directUserId2: studentId,
      createdBy: sponsorId
    });

    res.status(201).json({ message: 'Successfully sponsored student', sponsorship });
  } catch (error) {
    console.error('Error sponsoring student:', error);
    res.status(500).json({ error: 'Server error sponsoring student' });
  }
};

exports.getMySponsoredStudents = async (req, res) => {
  try {
    const sponsorId = req.user.id;

    const sponsorships = await Sponsorship.findAll({
      where: { sponsorId, status: 'active' }
    });

    const studentIds = sponsorships.map(s => s.studentId);

    const students = await User.findAll({
      where: { id: { [Op.in]: studentIds } },
      attributes: ['id', 'name', 'location', 'isWarZone', 'profilePicture']
    });

    res.json(students);
  } catch (error) {
    console.error('Error fetching sponsored students:', error);
    res.status(500).json({ error: 'Server error fetching sponsored students' });
  }
};

exports.getMySponsors = async (req, res) => {
  try {
    const studentId = req.user.id;
    const sponsorships = await Sponsorship.findAll({
      where: { studentId, status: 'active' },
      include: [{ model: User, as: 'sponsor', attributes: ['id', 'name', 'email', 'profilePicture', 'role'] }]
    });
    const sponsors = sponsorships.map(s => s.sponsor).filter(Boolean);
    res.json(sponsors);
  } catch (error) {
    console.error('Error fetching my sponsors:', error);
    res.status(500).json({ error: 'Server error fetching sponsors' });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findOne({
      where: { id: studentId, role: 'student' },
      attributes: ['id', 'name', 'email', 'location', 'isWarZone', 'profilePicture', 'createdAt']
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Fetch enrollments and courses
    const enrollments = await Enrollment.findAll({
      where: { userId: studentId },
      include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    // Attendance log (distinct active days)
    const attendance = await DailyActivity.findAll({
      where: { userId: studentId },
      order: [['activityDate', 'DESC']]
    });

    // Quiz results -> average score
    const quizResults = await QuizResult.findAll({
      where: { userId: studentId },
      include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }],
      order: [['submittedAt', 'DESC']]
    });
    const averageScore = quizResults.length
      ? Math.round(quizResults.reduce((sum, r) => sum + (r.score || 0), 0) / quizResults.length)
      : 0;

    // Certificates earned
    const certificates = await Certificate.findAll({
      where: { userId: studentId },
      order: [['createdAt', 'DESC']]
    });

    // Uploaded supporting documents
    const uploads = await StudentUpload.findAll({
      where: { userId: studentId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      student,
      enrollments,
      attendance,
      quizResults,
      certificates,
      uploads,
      stats: {
        attendanceDays: attendance.length,
        coursesEnrolled: enrollments.length,
        coursesCompleted: enrollments.filter(e => e.status === 'completed').length,
        averageScore,
        certificatesEarned: certificates.length,
        uploadsCount: uploads.length
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Server error fetching student profile' });
  }
};
