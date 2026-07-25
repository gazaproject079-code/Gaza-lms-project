const { Course, Category, Topic, Material, Enrollment, Quiz, LiveLecture, Recording } = require('../models');

function ensureCourseAuthoringAccess(user, course = null) {
  const isSuperAdmin = user.role === 'superadmin';
  const isAdmin = user.role === 'instructor';
  const canManageAll = user.permissions?.canManageAllCourses === true;
  const isOwner = course ? course.userId === user.id : false;

  if (!isSuperAdmin && !isAdmin) {
    return 'Only admins can manage courses';
  }

  if (course && !isSuperAdmin && !isOwner && !canManageAll) {
    return 'You do not have permission to manage this course';
  }

  return null;
}

// Get top N published courses by enrollment count (public)
exports.getTopCourses = async (req, res) => {
  try {
    const { User } = require('../models');
    const limit = parseInt(req.query.limit) || 3;

    const courses = await Course.findAll({
      where: { status: 'published' },
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ]
    });

    // Count enrollments per course, then sort and slice
    const coursesWithCount = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.count({ where: { courseId: course.id } });
        const data = course.toJSON();
        data.enrollmentCount = enrollmentCount;
        return data;
      })
    );

    const top = coursesWithCount
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, limit);

    res.json({ success: true, courses: top });
  } catch (error) {
    console.error('Get top courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, description, level, language, categoryId, duration, materials, thumbnailImage, creationMode, deliveryMode } = req.body;

    const accessError = ensureCourseAuthoringAccess(req.user);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    console.log('📝 Creating course...');
    console.log('🖼️  Received thumbnailImage:', thumbnailImage);

    if (!name || !description || !level || !language || !categoryId || !duration) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Verify category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const courseToCreate = {
      name,
      description,
      level,
      language,
      categoryId,
      duration,
      status: 'draft',
      userId: req.user.id,
      thumbnailImage: thumbnailImage || null,
      creationMode: creationMode || 'manual',
      deliveryMode: deliveryMode || 'recorded'
    };

    console.log('💾 Creating course in database with:', courseToCreate);

    const course = await Course.create(courseToCreate);

    // Add materials if provided
    if (materials && Array.isArray(materials) && materials.length > 0) {
      const courseMaterials = materials.map(material => ({
        ...material,
        courseId: course.id
      }));
      await Material.bulkCreate(courseMaterials);
    }

    const createdCourse = await Course.findByPk(course.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Material, as: 'materials' }
      ]
    });

    console.log('✅ Course created successfully with ID:', course.id);
    console.log('🖼️  Saved thumbnailImage:', createdCourse.thumbnailImage);

    res.status(201).json({ success: true, course: createdCourse });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const { User } = require('../models');
    const courses = await Course.findAll({
      include: [
        { model: Category, as: 'category' },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Topic,
          as: 'topics',
          include: [
            { model: Material, as: 'materials' },
            { model: Quiz, as: 'quizzes' },
            { model: LiveLecture, as: 'liveLecture' },
            { model: Recording, as: 'recording' }
          ],
          separate: true,
          order: [['order', 'ASC']]
        },
        { model: Material, as: 'materials' }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get enrollment count for each course
    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.count({
          where: { courseId: course.id }
        });
        const courseData = course.toJSON();
        courseData.enrollmentCount = enrollmentCount;
        return courseData;
      })
    );

    res.json({ success: true, courses: coursesWithEnrollment });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { User } = require('../models');
    const { id } = req.params;

    const course = await Course.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Topic,
          as: 'topics',
          include: [
            { model: Material, as: 'materials' },
            { model: Quiz, as: 'quizzes' },
            { model: LiveLecture, as: 'liveLecture' },
            { model: Recording, as: 'recording' }
          ],
          separate: true,
          order: [['order', 'ASC']]
        },
        { model: Material, as: 'materials' }
      ]
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get enrollment count for this course
    const enrollmentCount = await Enrollment.count({
      where: { courseId: course.id }
    });

    const courseData = course.toJSON();
    courseData.enrollmentCount = enrollmentCount;

    res.json({ success: true, course: courseData });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, level, language, categoryId, duration, status, thumbnailImage, creationMode, deliveryMode } = req.body;

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const accessError = ensureCourseAuthoringAccess(req.user, course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      course.categoryId = categoryId;
    }

    if (name) course.name = name;
    if (description) course.description = description;
    if (level) course.level = level;
    if (language) course.language = language;
    if (duration) course.duration = duration;
    if (status) course.status = status;
    if (thumbnailImage !== undefined) course.thumbnailImage = thumbnailImage;
    if (creationMode) course.creationMode = creationMode;
    if (deliveryMode) course.deliveryMode = deliveryMode;

    await course.save();

    const { User } = require('../models');
    const updatedCourse = await Course.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Topic,
          as: 'topics',
          include: [
            { model: Material, as: 'materials' },
            { model: Quiz, as: 'quizzes' },
            { model: LiveLecture, as: 'liveLecture' },
            { model: Recording, as: 'recording' }
          ],
          separate: true,
          order: [['order', 'ASC']]
        },
        { model: Material, as: 'materials' }
      ]
    });

    res.json({ success: true, course: updatedCourse });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const accessError = ensureCourseAuthoringAccess(req.user, course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    // Manually delete related records first
    // Delete materials associated with topics of this course
    const topics = await Topic.findAll({ where: { courseId: id } });
    for (const topic of topics) {
      await Material.destroy({ where: { topicId: topic.id } });
    }

    // Delete materials directly associated with this course
    await Material.destroy({ where: { courseId: id } });

    // Delete all topics of this course
    await Topic.destroy({ where: { courseId: id } });

    // Delete course itself
    await course.destroy();

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.publishCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const accessError = ensureCourseAuthoringAccess(req.user, course);
    if (accessError) {
      return res.status(403).json({ error: accessError });
    }

    course.status = 'published';
    await course.save();

    res.json({ success: true, message: 'Course published successfully', course });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
