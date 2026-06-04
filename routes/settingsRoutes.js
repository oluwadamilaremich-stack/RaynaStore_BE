const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get store settings
// @route   GET /api/settings
// @access  Public (or Private/Admin depending on use case, let's keep it Private/Admin for now)
router.get('/', protect, admin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private/Admin
router.put('/', protect, admin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    settings.storeName = req.body.storeName || settings.storeName;
    settings.supportEmail = req.body.supportEmail || settings.supportEmail;
    settings.currency = req.body.currency || settings.currency;
    settings.language = req.body.language || settings.language;
    
    if (req.body.notifications) {
      settings.notifications = {
        ...settings.notifications,
        ...req.body.notifications
      };
    }

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
