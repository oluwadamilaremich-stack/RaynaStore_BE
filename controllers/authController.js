const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendWelcomeEmail } = require('../utils/emailService');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.status === 'Banned' || user.status === 'Suspended') {
      res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
      return;
    }
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
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    // Send welcome email
    sendWelcomeEmail(user.email, user.name).catch(err => console.error('Welcome email error:', err));

    res.status(201).json({
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
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

module.exports = { authUser, registerUser };
