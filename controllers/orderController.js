const axios = require('axios');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderNotification } = require('../utils/emailService');

const generateOrderNumber = () => {
  return 'ORD' + Math.floor(100000 + Math.random() * 900000);
};

const generateTrackingNumber = () => {
  return 'TRK' + Math.floor(100000000 + Math.random() * 900000000);
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  const {
    items,
    shippingDetails,
    phoneNumber,
    paymentStatus,
    paymentReference,
    totalAmount,
    customerName,
    customerEmail,
  } = req.body;

  if (items && items.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  }

  try {
    const order = new Order({
      items: items.map((x) => ({
        ...x,
        product: x.id || x.product,
        _id: undefined,
      })),
      user: req.user._id,
      customerName,
      customerEmail,
      shippingDetails,
      phoneNumber,
      orderNumber: generateOrderNumber(),
      trackingNumber: generateTrackingNumber(),
      paymentStatus: paymentStatus || 'Pending',
      paymentReference: paymentReference || '',
      totalAmount,
    });

    const createdOrder = await order.save();

    // Background tasks - wrapped in their own try/catch to prevent blocking the main response
    (async () => {
      try {
        // Send email notifications
        await Promise.allSettled([
          sendOrderNotification(createdOrder, false),
          sendOrderNotification(createdOrder, true)
        ]);
        
        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { ordersCount: 1, totalSpent: totalAmount },
        });
      } catch (bgError) {
        console.error('Background tasks error:', bgError);
      }
    })();

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Failed to create order. Please contact support.', error: error.message });
  }
};

// @desc    Verify Paystack Payment
// @route   GET /api/orders/verify/:reference
// @access  Private
const verifyPayment = async (req, res) => {
  const { reference } = req.params;
  const secretKey = process.env.TEST_SECRET_KEY;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (response.data.status && response.data.data.status === 'success') {
      res.json({ status: 'success', data: response.data.data });
    } else {
      res.status(400).json({ status: 'failed', message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Paystack verification error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    // Only allow the user who placed the order or an admin to see it
    if (order.user._id.toString() === req.user._id.toString() || req.user.isAdmin) {
      res.json(order);
    } else {
      res.status(401).json({ message: 'Not authorized' });
    }
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 });
  res.json(orders);
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin, Driver, Support)
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = req.body.status || order.status;
      
      if (req.body.proofOfDelivery) {
        order.proofOfDelivery = req.body.proofOfDelivery;
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get assigned orders for a driver
// @route   GET /api/orders/driver/assigned
// @access  Private/Driver
const getAssignedOrders = async (req, res) => {
  const orders = await Order.find({ assignedDriverId: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @desc    Assign driver to an order
// @route   PUT /api/orders/:id/assign
// @access  Private/Dispatcher/Admin
const assignDriver = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.assignedDriverId = req.body.driverId;
    // Automatically set status to processing if it was ordered
    if (order.status === 'ordered') {
      order.status = 'processing';
    }
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Search orders for support
// @route   GET /api/orders/search
// @access  Private/Support/Admin
const searchOrders = async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json([]);
  }

  const orders = await Order.find({
    $or: [
      { orderNumber: { $regex: query, $options: 'i' } },
      { customerName: { $regex: query, $options: 'i' } },
      { customerEmail: { $regex: query, $options: 'i' } },
    ],
  });
  res.json(orders);
};

// @desc    Manual override for support
// @route   PUT /api/orders/:id/support-override
// @access  Private/Support/Admin
const supportOverride = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    if (req.body.shippingDetails) {
      order.shippingDetails = { ...order.shippingDetails, ...req.body.shippingDetails };
    }
    if (req.body.deliveryNotes !== undefined) {
      order.deliveryNotes = req.body.deliveryNotes;
    }
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Assign driver to multiple orders
// @route   PUT /api/orders/batch-assign
// @access  Private/Dispatcher/Admin
const batchAssignDrivers = async (req, res) => {
  const { orderIds, driverId } = req.body;

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400).json({ message: 'No orders selected' });
    return;
  }

  try {
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        $set: { 
          assignedDriverId: driverId,
          status: 'processing' 
        } 
      }
    );
    res.json({ message: 'Orders assigned successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
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
};
