const express = require('express');
const { 
  getUsers, 
  getUserProfile, 
  getDashboardStats, 
  getWishlist, 
  addToWishlist, 
  removeFromWishlist, 
  updateUserProfile,
  deleteUser,
  getUserById,
  updateUser,
  createUser,
  getDrivers
} = require('../controllers/userController');
const { protect, admin, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);

router.route('/drivers').get(protect, authorize('dispatcher', 'admin'), getDrivers);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, upload.single('image'), updateUserProfile);

router.route('/stats').get(protect, admin, getDashboardStats);

router.route('/wishlist').get(protect, getWishlist).post(protect, addToWishlist);
router.route('/wishlist/:id').delete(protect, removeFromWishlist);

router.route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;
