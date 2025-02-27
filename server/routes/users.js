const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can view all users' });
  }
  
  db.all('SELECT id, username, email, role, created_at FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    return res.json(users || []);
  });
});

// Get a specific user
router.get('/:id', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Users can only view their own profile unless they are an admin
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json(user);
  });
});

// Update a user (admin only or self)
router.put('/:id', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const { username, email, role } = req.body;
  
  // Users can only update their own profile unless they are an admin
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  // Only admins can change roles
  if (role && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can change user roles' });
  }
  
  // Check if user exists
  db.get('SELECT id FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prepare update query based on provided fields
    const updates = [];
    const params = [];
    
    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    
    if (role && req.user.role === 'admin') {
      updates.push('role = ?');
      params.push(role);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Add user ID to params
    params.push(userId);
    
    // Update user
    db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'Username or email already exists' });
          }
          return res.status(500).json({ message: 'Error updating user', error: err.message });
        }
        
        // Get updated user
        db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [userId], (err, updatedUser) => {
          if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
          }
          
          return res.json({
            message: 'User updated',
            user: updatedUser
          });
        });
      }
    );
  });
});

// Delete a user (admin only)
router.delete('/:id', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can delete users' });
  }
  
  // Prevent deleting the last admin
  db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"', (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (result.count <= 1) {
      // Check if the user to delete is an admin
      db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        if (user.role === 'admin') {
          return res.status(400).json({ message: 'Cannot delete the last administrator' });
        }
        
        // Delete the user
        deleteUser(userId, res);
      });
    } else {
      // Delete the user
      deleteUser(userId, res);
    }
  });
});

// Helper function to delete a user
function deleteUser(userId, res) {
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting user', error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.json({ message: 'User deleted' });
  });
}

module.exports = router;
