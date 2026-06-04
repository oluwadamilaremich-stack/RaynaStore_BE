const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'Rayna Store',
    },
    supportEmail: {
      type: String,
      default: 'support@rayna.com',
    },
    currency: {
      type: String,
      default: 'Nigerian Naira (₦)',
    },
    language: {
      type: String,
      default: 'English (UK)',
    },
    notifications: {
      orderAlerts: { type: Boolean, default: true },
      stockUpdates: { type: Boolean, default: true },
      supportTickets: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
