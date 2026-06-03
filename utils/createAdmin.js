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
      });
      console.log('Super Admin created successfully');
    } else {
      // Ensure the existing user is an admin
      if (!adminExists.isAdmin) {
        adminExists.isAdmin = true;
        await adminExists.save();
        console.log('Existing user promoted to Admin');
      }
    }
  } catch (error) {
    console.error(`Error creating admin: ${error.message}`);
  }
};

module.exports = createAdmin;
