/**
 * Ownership Middleware
 * Middleware to enforce user ownership of resources for multi-tenant support
 */

import { Target, Alert } from '../models/index.js';

/**
 * Require Ownership Middleware
 * Checks if the current user owns the requested resource
 * Admins bypass this check and can access any resource
 *
 * @param {Model} model - Sequelize model to check ownership against
 * @param {string} paramName - Route parameter name for resource ID (default: 'id')
 * @returns {Function} Express middleware function
 */
export const requireOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    const resourceId = req.params[paramName];
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins bypass ownership check
    if (userRole === 'admin') {
      req.resource = await model.findByPk(resourceId);
      return next();
    }

    // Check if resource exists and belongs to user
    const resource = await model.findOne({
      where: {
        id: resourceId,
        userId
      }
    });

    if (!resource) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - resource not found or you do not have permission'
      });
    }

    req.resource = resource;
    next();
  };
};

/**
 * Add User Filter Middleware
 * Adds user filter to req object for use in query conditions
 * Admins get an empty filter (can see all data)
 * Regular users get { userId: req.user.id }
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const addUserFilter = (req, res, next) => {
  if (req.user.role === 'admin') {
    // Admins can see all data
    req.userFilter = {};
  } else {
    // Regular users only see their own data
    req.userFilter = { userId: req.user.id };
  }
  next();
};

/**
 * Validate Target Ownership Middleware
 * Checks if the targetId in request body belongs to the current user
 * Used when creating resources that reference a target
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateTargetOwnership = async (req, res, next) => {
  const { targetId } = req.body;

  // Skip validation if no targetId or user is admin
  if (!targetId || req.user.role === 'admin') {
    return next();
  }

  const target = await Target.findOne({
    where: {
      id: targetId,
      userId: req.user.id
    }
  });

  if (!target) {
    return res.status(400).json({
      success: false,
      error: 'Invalid target - target not found or you do not have permission'
    });
  }

  next();
};

/**
 * Ensure Unique Target Name Middleware
 * Checks if target name is unique for the current user
 * Used when creating/updating targets
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const ensureUniqueTargetName = async (req, res, next) => {
  const { name } = req.body;
  const targetId = req.params.id;

  // Skip validation if no name provided
  if (!name) {
    return next();
  }

  const whereCondition = {
    userId: req.user.id,
    name
  };

  // When updating, exclude current target from uniqueness check
  if (targetId) {
    whereCondition.id = { [require('sequelize').Op.ne]: targetId };
  }

  const existingTarget = await Target.findOne({
    where: whereCondition
  });

  if (existingTarget) {
    return res.status(400).json({
      success: false,
      error: 'Target with this name already exists'
    });
  }

  next();
};

/**
 * Ensure Unique Alert Name Middleware
 * Checks if alert name is unique for the current user
 * Used when creating/updating alerts
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const ensureUniqueAlertName = async (req, res, next) => {
  const { name } = req.body;
  const alertId = req.params.id;

  // Skip validation if no name provided
  if (!name) {
    return next();
  }

  const whereCondition = {
    userId: req.user.id,
    name
  };

  // When updating, exclude current alert from uniqueness check
  if (alertId) {
    whereCondition.id = { [require('sequelize').Op.ne]: alertId };
  }

  const existingAlert = await Alert.findOne({
    where: whereCondition
  });

  if (existingAlert) {
    return res.status(400).json({
      success: false,
      error: 'Alert with this name already exists'
    });
  }

  next();
};

export default {
  requireOwnership,
  addUserFilter,
  validateTargetOwnership,
  ensureUniqueTargetName,
  ensureUniqueAlertName
};
