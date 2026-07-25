const { User } = require('../models');
const { sendAdminAccountCreatedEmail } = require('../services/emailService');

const SAFE_USER_EXCLUDE_FIELDS = ['password', 'otpCode', 'otpExpiry'];

exports.createAdmin = async (req, res) => {
  console.log('====== CREATE ADMIN CALLED ======');
  try {
    const { name, email, password, role = 'instructor' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Validate role
    const validRoles = ['instructor', 'superadmin'];
    const roleToUse = validRoles.includes(role) ? role : 'instructor';

    const user = await User.create({
      name,
      email,
      password,
      role: roleToUse
    });

    console.log('=== ADMIN CREATED ===', email);

    // Send email with credentials to the new admin
    try {
      console.log('Sending email to:', email);
      await sendAdminAccountCreatedEmail(email, name, password, roleToUse);
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Email failed:', emailError.message);
    }

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: ['instructor']
      },
      attributes: { exclude: SAFE_USER_EXCLUDE_FIELDS },
      order: [['createdAt', 'DESC']]
    });

    const usersWithPermissions = users.map(user => {
      const userJson = user.toJSON();
      if (!userJson.permissions && ['instructor'].includes(userJson.role)) {
        userJson.permissions = {
          canManageAllCourses: true,
          canManageCategories: true,
          canManageStudents: true,
          canManageCertificates: true,
          canViewFeedback: true
        };
      }
      return userJson;
    });

    res.json({ success: true, users: usersWithPermissions });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: SAFE_USER_EXCLUDE_FIELDS }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isActive, role } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'superadmin' && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Cannot modify super admin account' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (role && ['student', 'instructor', 'superadmin', 'sponsor'].includes(role)) {
      user.role = role;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot modify super admin account' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own account status' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateAdminPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot modify super admin permissions' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own permissions' });
    }

    if (!['instructor'].includes(user.role)) {
      return res.status(400).json({ error: 'Permissions can only be set for admin users' });
    }

    user.setDataValue('permissions', permissions);
    user.changed('permissions', true);
    await user.save();

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete super admin account' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.destroy();

    res.json({ success: true, message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
