const { LiveLecture, Course, Enrollment, User } = require('../models');

function ensureCourseAuthoringAccess(user, course) {
  const isSuperAdmin = user.role === 'superadmin';
  const isAdmin = user.role === 'instructor';
  const canManageAll = user.permissions?.canManageAllCourses === true;
  const isOwner = course ? course.userId === user.id : false;

  if (!isSuperAdmin && !isAdmin) {
    return 'Only admins/instructors can manage live lectures';
  }

  if (course && !isSuperAdmin && !isOwner && !canManageAll) {
    return 'You do not have permission to manage live lectures for this course';
  }

  return null;
}

exports.getMyLiveLectures = async (req, res) => {
  try {
    const user = req.user;
    let lectures = [];

    if (user.role === 'instructor' || user.role === 'superadmin') {
      const isSuperAdmin = user.role === 'superadmin';
      const canManageAll = user.permissions?.canManageAllCourses === true;

      // Instructors get lectures for their courses
      const courseWhere = (!isSuperAdmin && !canManageAll) ? { userId: user.id } : {};
      
      lectures = await LiveLecture.findAll({
        include: [
          {
            model: Course,
            as: 'course',
            where: courseWhere,
            attributes: ['id', 'name', 'thumbnailImage']
          }
        ],
        order: [['scheduledTime', 'ASC']]
      });
    } else {
      // Students get lectures for enrolled courses
      const enrollments = await Enrollment.findAll({
        where: { userId: user.id },
        attributes: ['courseId']
      });
      const courseIds = enrollments.map(e => e.courseId);

      if (courseIds.length === 0) {
        return res.json({ success: true, liveLectures: [] });
      }

      lectures = await LiveLecture.findAll({
        where: { courseId: courseIds },
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'name', 'thumbnailImage']
          }
        ],
        order: [['scheduledTime', 'ASC']]
      });
    }

    res.json({ success: true, liveLectures: lectures });
  } catch (error) {
    console.error('Get my live lectures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createLiveLecture = async (req, res) => {
  try {
    const { title, description, scheduledTime, meetingLink, courseId } = req.body;

    if (!title || !scheduledTime || !meetingLink || !courseId) {
      return res.status(400).json({ error: 'All fields (title, scheduledTime, meetingLink, courseId) are required' });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const accessError = ensureCourseAuthoringAccess(req.user, course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    const lecture = await LiveLecture.create({
      title,
      description,
      scheduledTime,
      meetingLink,
      courseId,
      status: 'scheduled'
    });

    const createdLecture = await LiveLecture.findByPk(lecture.id, {
      include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }]
    });

    res.status(201).json({ success: true, liveLecture: createdLecture });
  } catch (error) {
    console.error('Create live lecture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateLiveLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, scheduledTime, meetingLink, status } = req.body;

    const lecture = await LiveLecture.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!lecture) {
      return res.status(404).json({ error: 'Live lecture not found' });
    }

    const accessError = ensureCourseAuthoringAccess(req.user, lecture.course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    if (title) lecture.title = title;
    if (description !== undefined) lecture.description = description;
    if (scheduledTime) lecture.scheduledTime = scheduledTime;
    if (meetingLink) lecture.meetingLink = meetingLink;
    if (status) lecture.status = status;

    await lecture.save();

    const updatedLecture = await LiveLecture.findByPk(id, {
      include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }]
    });

    res.json({ success: true, liveLecture: updatedLecture });
  } catch (error) {
    console.error('Update live lecture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteLiveLecture = async (req, res) => {
  try {
    const { id } = req.params;

    const lecture = await LiveLecture.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!lecture) {
      return res.status(404).json({ error: 'Live lecture not found' });
    }

    const accessError = ensureCourseAuthoringAccess(req.user, lecture.course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    await lecture.destroy();

    res.json({ success: true, message: 'Live lecture deleted successfully' });
  } catch (error) {
    console.error('Delete live lecture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
