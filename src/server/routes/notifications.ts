import express from 'express';
import { Notification } from '../models.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications.map(n => ({ ...n.toObject(), _id: n._id })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create notification (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({ ...notification.toObject(), _id: notification._id });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create notification' });
  }
});

// Update notification (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ ...notification.toObject(), _id: notification._id });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update notification' });
  }
});

// Delete notification (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
