const User = require('../models/User');

const createAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rayna.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        isAdmin: true,
        isVerified: true,
        role: 'admin',
      });
      console.log('Super Admin created successfully and verified');
    } else {
      // Ensure the existing user is an admin and verified
      let updated = false;
      if (!adminExists.isAdmin) {
        adminExists.isAdmin = true;
        adminExists.role = 'admin';
        updated = true;
      }
      if (!adminExists.isVerified) {
        adminExists.isVerified = true;
        updated = true;
      }
      if (updated) {
        await adminExists.save();
        console.log('Existing Super Admin updated with verification and role');
      }
    }
  } catch (error) {
    console.error(`Error creating admin: ${error.message}`);
  }
};

module.exports = createAdmin;
