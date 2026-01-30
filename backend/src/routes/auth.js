import express from 'express';
const router = express.Router();
import AuthService from '../services/authService.js';
import { authenticate, authorize, adminOnly } from '../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

/**
 * Validation middleware
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName').optional().trim().isLength({ max: 50 }),
  body('lastName').optional().trim().isLength({ max: 50 })
], validate, async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], validate, async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = await AuthService.login(identifier, password);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
], validate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await AuthService.getCurrentUser(req.user.id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, [
  body('firstName').optional().trim().isLength({ max: 50 }),
  body('lastName').optional().trim().isLength({ max: 50 }),
  body('avatar').optional().isURL()
], validate, async (req, res) => {
  try {
    const user = await AuthService.updateProfile(req.user.id, req.body);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post('/change-password', authenticate, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], validate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', authenticate, (req, res) => {
  // In a JWT-based system, logout is handled client-side by removing the token
  // For true server-side logout, we would implement token blacklisting
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ========== Admin Routes ==========

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const { limit = 50, offset = 0, role, search } = req.query;
    const result = await AuthService.getAllUsers({
      limit: parseInt(limit),
      offset: parseInt(offset),
      role,
      search
    });
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/auth/users/:id/role
 * Update user role (admin only)
 */
router.put('/users/:id/role', authenticate, adminOnly, [
  param('id').isUUID(),
  body('role')
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user')
], validate, async (req, res) => {
  try {
    const user = await AuthService.updateUserRole(req.params.id, req.body.role);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/auth/users/:id/toggle-status
 * Toggle user active status (admin only)
 */
router.put('/users/:id/toggle-status', authenticate, adminOnly, [
  param('id').isUUID()
], validate, async (req, res) => {
  try {
    const user = await AuthService.toggleUserStatus(req.params.id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/auth/users/:id
 * Delete user (admin only)
 */
router.delete('/users/:id', authenticate, adminOnly, [
  param('id').isUUID()
], validate, async (req, res) => {
  try {
    await AuthService.deleteUser(req.params.id);
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
