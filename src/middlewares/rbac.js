// src/middlewares/rbac.js
import jwt from "jsonwebtoken";
import config from "../config/config.js";

// Authenticate JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Check if user is super admin
export const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ 
      message: "Access denied. Super admin privileges required." 
    });
  }
  next();
};

// Check if user is admin or super admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ 
      message: "Access denied. Admin privileges required." 
    });
  }
  next();
};

// Check if user is at least a regular user
export const isUser = (req, res, next) => {
  const validRoles = ["user", "admin", "super_admin"];
  if (!validRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: "Access denied. User privileges required." 
    });
  }
  next();
};

// Check if user can access their own resources or is admin
export const isOwnerOrAdmin = (req, res, next) => {
  const userId = req.params.userId || req.body.userId;
  const isOwner = req.user.id === parseInt(userId);
  const isAdminUser = ["admin", "super_admin"].includes(req.user.role);

  if (!isOwner && !isAdminUser) {
    return res.status(403).json({ 
      message: "Access denied. You can only access your own resources." 
    });
  }
  next();
};

// Flexible role checker - pass roles as arguments
export const hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}` 
      });
    }
    next();
  };
};