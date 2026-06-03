const express = require('express');
const {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  getAssignedOrders,
  assignDriver,
  searchOrders,
  supportOverride,
  batchAssignDrivers,
  verifyPayment,
} = require('../controllers/orderController');
const { protect, admin, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .post(protect, addOrderItems)
  .get(protect, authorize('dispatcher', 'admin'), getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/driver/assigned').get(protect, authorize('driver', 'admin'), getAssignedOrders);

router.route('/search').get(protect, authorize('support', 'admin'), searchOrders);

router.route('/batch-assign').put(protect, authorize('dispatcher', 'admin'), batchAssignDrivers);

router.route('/verify/:reference').get(protect, verifyPayment);

router.route('/:id').get(protect, getOrderById);


router.route('/:id/status').put(protect, authorize('driver', 'support', 'admin'), updateOrderStatus);

router.route('/:id/assign').put(protect, authorize('dispatcher', 'admin'), assignDriver);

router.route('/:id/support-override').put(protect, authorize('support', 'admin'), supportOverride);

module.exports = router;
