// src/controllers/userController.js
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

class UserController {
  // Get all users (Admin only)
  async getAll(req, res) {
    try {
      const filters = {
        role: req.query.role,
        status: req.query.status,
        search: req.query.search,
      };

      const { page, limit, offset } = parsePagination(req.query);
      const { users, total } = await User.getAll(filters, { limit, offset });
      
      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.status(200).json({
        users: sanitizedUsers,
        pagination: buildPaginationMeta(total, page, limit)
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching users", 
        error: error.message 
      });
    }
  }

  // Get user by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching user", 
        error: error.message 
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching profile", 
        error: error.message 
      });
    }
  }

  // Update user (Admin can update any, users can update own)
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Regular users can only update themselves
      if (req.user.role === 'user' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ 
          message: "You can only update your own profile" 
        });
      }

      // Only super admin can change roles
      if (updateData.role && req.user.role !== 'super_admin') {
        return res.status(403).json({ 
          message: "Only super admin can change user roles" 
        });
      }

      // Only super admin can change other super admins
      if (existingUser.role === 'super_admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ 
          message: "Only super admin can modify super admin accounts" 
        });
      }

      // Hash password if being updated
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const updatedUser = await User.update(id, updateData);
      const { password, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        message: "User updated successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating user", 
        error: error.message 
      });
    }
  }

  // Change user status (Admin only)
  async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status. Must be: active, inactive, or suspended" 
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Cannot change super admin status unless you're super admin
      if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ 
          message: "Only super admin can change super admin status" 
        });
      }

      await User.updateStatus(id, status);
      const updatedUser = await User.findById(id);
      const { password, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        message: "User status updated successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error changing user status", 
        error: error.message 
      });
    }
  }

  // Delete user (Super admin only)
  async delete(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Cannot delete super admin
      if (user.role === 'super_admin') {
        return res.status(403).json({ 
          message: "Cannot delete super admin account" 
        });
      }

      // Cannot delete yourself
      if (req.user.id === parseInt(id)) {
        return res.status(403).json({ 
          message: "Cannot delete your own account" 
        });
      }

      await User.delete(id);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: "Error deleting user", 
        error: error.message 
      });
    }
  }

  // Get user statistics (Admin only)
  async getStats(req, res) {
    try {
      const stats = await User.countByRole();
      res.status(200).json({ stats });
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching user statistics", 
        error: error.message 
      });
    }
  }

  // Create admin/user (Admin only)
  async createUser(req, res) {
    try {
      const { username, email, location, phone, password, role } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ 
          message: "Username, email, and password are required" 
        });
      }

      // Only super admin can create other admins or super admins
      if ((role === 'admin' || role === 'super_admin') && req.user.role !== 'super_admin') {
        return res.status(403).json({ 
          message: "Only super admin can create admin accounts" 
        });
      }

      // Check if user already exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Username already exists" 
        });
      }

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ 
          message: "Email already exists" 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create(
        username,
        email,
        location,
        phone,
        hashedPassword,
        role || 'user'
      );

      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: "User created successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating user", 
        error: error.message 
      });
    }
  }
}

export default new UserController();