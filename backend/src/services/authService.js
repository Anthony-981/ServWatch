import jwt from 'jsonwebtoken';
import { User, sequelize } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

/**
 * Generate JWT access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * Generate token pair
 */
function generateTokens(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: JWT_EXPIRES_IN
  };
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Auth Service class
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(data) {
    const { username, email, password, firstName, lastName } = data;

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || ''
    });

    // Generate tokens
    const tokens = generateTokens(user);

    return {
      user: user.toSafeJSON(),
      ...tokens
    };
  }

  /**
   * Login user
   */
  async login(identifier, password) {
    // Find user by username or email
    const user = await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const tokens = generateTokens(user);

    return {
      user: user.toSafeJSON(),
      ...tokens
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Find user
    const user = await User.findByPk(payload.id);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    return tokens;
  }

  /**
   * Get current user by token
   */
  async getCurrentUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.toSafeJSON();
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const allowedFields = ['firstName', 'lastName', 'avatar'];
    const updates = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    }

    await user.update(updates);
    return user.toSafeJSON();
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Update password (will be hashed by model hook)
    await user.update({ password: newPassword });

    return { success: true };
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(options = {}) {
    const { limit = 50, offset = 0, role, search } = options;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where[sequelize.Sequelize.Op.or] = [
        { username: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
        { email: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return { total: count, users: rows };
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId, role) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ role });
    return user.toSafeJSON();
  }

  /**
   * Toggle user active status (admin only)
   */
  async toggleUserStatus(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ isActive: !user.isActive });
    return user.toSafeJSON();
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.destroy();
    return { success: true };
  }
}

// Export utility functions
export {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken
};

export default new AuthService();
