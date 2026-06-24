const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendWelcomeEmail } = require('../utils/emailService');
const { sendEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({ email: normalizedEmail });

  if (user && (await user.matchPassword(password))) {
    if (user.status === 'Banned' || user.status === 'Suspended') {
      res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
      return;
    }

    if (!user.isVerified) {
      res.status(401).json({ message: 'Please verify your email address first.' });
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
  const { name, email, password, resend } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (resend) {
    if (!normalizedEmail) {
      res.status(400).json({ message: 'Email is required.' });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(404).json({ message: 'No account found for this email.' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: 'This email is already verified.' });
      return;
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user, otp);
      console.log(`Verification OTP resent to ${normalizedEmail}: ${otp}`);
    } catch (err) {
      console.error('Error sending verification email:', err);
    }

    res.status(200).json({ message: 'Verification code resent successfully.' });
    return;
  }

  const trimmedName = String(name || '').trim();
  if (!trimmedName || !normalizedEmail || !password) {
    res.status(400).json({ message: 'Please provide your name, email, and password.' });
    return;
  }

  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const isSuperAdmin = normalizedEmail === String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const otp = isSuperAdmin ? undefined : generateOTP();
  const otpExpire = isSuperAdmin ? undefined : new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const user = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    password,
    otp,
    otpExpire,
    isVerified: isSuperAdmin,
    isAdmin: isSuperAdmin,
    role: isSuperAdmin ? 'admin' : 'customer',
  });

  if (user) {
    if (isSuperAdmin) {
      // Send welcome email immediately for Super Admin
      sendEmail(user, { NAME: user.name }, 1).catch(err => console.error('Welcome email error:', err));
      
      res.status(201).json({
        message: 'Super Admin account created and verified automatically.',
        email: user.email,
        isVerified: true
      });
    } else {
      try {
          await sendVerificationEmail(user, otp);
          console.log(`Verification OTP sent to ${normalizedEmail}: ${otp}`);
      } catch (err) {
          console.error('Error sending verification email:', err);
      }

      res.status(201).json({
        message: 'Registration successful. Please check your email for the verification code.',
        email: user.email
      });
    }
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify
// @access  Public
const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail, otp });

  if (!user) {
    res.status(400).json({ message: 'Invalid verification code' });
    return;
  }

  if (user.otpExpire < Date.now()) {
    res.status(400).json({ message: 'Verification code has expired' });
    return;
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  // Send welcome email after verification success
  sendEmail(user, { NAME: user.name }, 1).catch(err => console.error('Welcome email error:', err));

  res.json({ message: 'Email verified successfully. You can now log in.' });
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    res.status(404).json({ message: 'User not found with this email' });
    return;
  }

  const otp = generateOTP();
  user.resetOtp = otp;
  user.resetOtpExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await user.save();

  try {
      await sendPasswordResetEmail(user, otp);
      console.log(`Password reset OTP sent to ${normalizedEmail}: ${otp}`);
  } catch (err) {
      console.error('Error sending password reset email:', err);
  }

  res.json({ message: 'Password reset code sent to your email' });
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
    resetOtp: otp,
    resetOtpExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400).json({ message: 'Invalid or expired reset code' });
    return;
  }

  user.password = password;
  user.resetOtp = undefined;
  user.resetOtpExpire = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
};

module.exports = { authUser, registerUser, verifyEmail, forgotPassword, resetPassword };
