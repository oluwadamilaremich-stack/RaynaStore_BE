const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get dashboard stats
// @route   GET /api/users/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  const totalUsers = await User.countDocuments({});
  
  const activeOrders = await Order.countDocuments({
    status: { $in: ['processing', 'out_for_delivery'] },
  });

  const allOrders = await Order.find({ paymentStatus: 'Paid' });
  const totalRevenue = allOrders.reduce((acc, order) => acc + order.totalAmount, 0);

  const pendingDeliveries = await Order.countDocuments({
    status: 'out_for_delivery',
  });

  // Monthly Sales Data (Current Year)
  const currentYear = new Date().getFullYear();
  const monthlySales = Array(12).fill(0);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Revenue Comparison (Current vs Previous Year)
  const previousYear = currentYear - 1;
  const comparisonData = monthNames.map(name => ({ name, current: 0, previous: 0 }));

  allOrders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const orderYear = orderDate.getFullYear();
    const orderMonth = orderDate.getMonth();

    if (orderYear === currentYear) {
      monthlySales[orderMonth] += order.totalAmount;
      comparisonData[orderMonth].current += order.totalAmount;
    } else if (orderYear === previousYear) {
      comparisonData[orderMonth].previous += order.totalAmount;
    }
  });

  const formattedMonthlySales = monthNames.map((name, index) => ({
    name,
    value: monthlySales[index]
  }));

  res.json({
    totalUsers,
    activeOrders,
    totalRevenue,
    pendingDeliveries,
    monthlySales: formattedMonthlySales,
    comparisonData
  });
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json(users);
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      phoneNumber: user.phoneNumber,
      street: user.street,
      city: user.city,
      state: user.state,
      country: user.country,
      postalCode: user.postalCode,
      avatarUrl: user.avatarUrl,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.street = req.body.street || user.street;
      user.city = req.body.city || user.city;
      user.state = req.body.state || user.state;
      user.country = req.body.country || user.country;
      user.postalCode = req.body.postalCode || user.postalCode;
      
      if (req.file) {
        user.avatarUrl = req.file.path;
      } else {
        user.avatarUrl = req.body.avatarUrl || user.avatarUrl;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber,
        street: updatedUser.street,
        city: updatedUser.city,
        state: updatedUser.state,
        country: updatedUser.country,
        postalCode: updatedUser.postalCode,
        avatarUrl: updatedUser.avatarUrl,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  if (user) {
    res.json(user.wishlist);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
    if (user.wishlist.includes(productId)) {
      res.status(400).json({ message: 'Product already in wishlist' });
      return;
    }
    user.wishlist.push(productId);
    await user.save();
    res.status(201).json({ message: 'Product added to wishlist' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:id
// @access  Private
const removeFromWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== req.params.id
    );
    await user.save();
    res.json({ message: 'Product removed from wishlist' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.isAdmin) {
        res.status(400).json({ message: 'Can not delete admin user' });
        return;
      }
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.status = req.body.status || user.status;

      // Ensure isAdmin is synced with the 'admin' role
      if (req.body.role === 'admin') {
        user.isAdmin = true;
      } else if (req.body.isAdmin !== undefined) {
        user.isAdmin = req.body.isAdmin;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create a new user by admin
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let { isAdmin } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Ensure isAdmin is synced with the 'admin' role
    if (role === 'admin') {
      isAdmin = true;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      isAdmin: isAdmin || false,
      isVerified: true,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all drivers
// @route   GET /api/users/drivers
// @access  Private/Dispatcher/Admin
const getDrivers = async (req, res) => {
  const drivers = await User.find({ role: 'driver' }).select('-password');
  res.json(drivers);
};

module.exports = {
  getUsers,
  getUserProfile,
  updateUserProfile,
  getDashboardStats,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  deleteUser,
  getUserById,
  updateUser,
  createUser,
  getDrivers,
};
