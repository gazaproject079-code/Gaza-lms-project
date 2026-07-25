const { Recording, Course, Enrollment } = require('../models');

function ensureCourseAuthoringAccess(user, course) {
  const isSuperAdmin = user.role === 'superadmin';
  const isAdmin = user.role === 'instructor';
  const canManageAll = user.permissions?.canManageAllCourses === true;
  const isOwner = course ? course.userId === user.id : false;

  if (!isSuperAdmin && !isAdmin) {
    return 'Only admins/instructors can manage recordings';
  }

  if (course && !isSuperAdmin && !isOwner && !canManageAll) {
    return 'You do not have permission to manage recordings for this course';
  }

  return null;
}

exports.getMyRecordings = async (req, res) => {
  try {
    const user = req.user;
    let recordings = [];

    if (user.role === 'instructor' || user.role === 'superadmin') {
      const isSuperAdmin = user.role === 'superadmin';
      const canManageAll = user.permissions?.canManageAllCourses === true;

      // Instructors get recordings for their courses
      const courseWhere = (!isSuperAdmin && !canManageAll) ? { userId: user.id } : {};
      
      recordings = await Recording.findAll({
        include: [
          {
            model: Course,
            as: 'course',
            where: courseWhere,
            attributes: ['id', 'name', 'thumbnailImage']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Students get recordings for enrolled courses
      const enrollments = await Enrollment.findAll({
        where: { userId: user.id },
        attributes: ['courseId']
      });
      const courseIds = enrollments.map(e => e.courseId);

      if (courseIds.length === 0) {
        return res.json({ success: true, recordings: [] });
      }

      recordings = await Recording.findAll({
        where: { courseId: courseIds },
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'name', 'thumbnailImage']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    res.json({ success: true, recordings });
  } catch (error) {
    console.error('Get my recordings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createRecording = async (req, res) => {
  try {
    const { title, description, videoUrl, duration, courseId } = req.body;

    if (!title || !videoUrl || !courseId) {
      return res.status(400).json({ error: 'Fields (title, videoUrl, courseId) are required' });
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const accessError = ensureCourseAuthoringAccess(req.user, course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    const recording = await Recording.create({
      title,
      description,
      videoUrl,
      duration,
      courseId
    });

    const createdRecording = await Recording.findByPk(recording.id, {
      include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }]
    });

    res.status(201).json({ success: true, recording: createdRecording });
  } catch (error) {
    console.error('Create recording error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateRecording = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl, duration } = req.body;

    const recording = await Recording.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const accessError = ensureCourseAuthoringAccess(req.user, recording.course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    if (title) recording.title = title;
    if (description !== undefined) recording.description = description;
    if (videoUrl) recording.videoUrl = videoUrl;
    if (duration !== undefined) recording.duration = duration;

    await recording.save();

    const updatedRecording = await Recording.findByPk(id, {
      include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }]
    });

    res.json({ success: true, recording: updatedRecording });
  } catch (error) {
    console.error('Update recording error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteRecording = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const accessError = ensureCourseAuthoringAccess(req.user, recording.course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    await recording.destroy();

    res.json({ success: true, message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
