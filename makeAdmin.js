const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const emailToMakeAdmin = process.argv[2] || 'testadmin@example.com';

if (!process.env.MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in backend/.env file');
  process.exit(1);
}

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');

    console.log(`Searching for user with email: ${emailToMakeAdmin}`);
    const user = await User.findOne({ email: emailToMakeAdmin });

    if (!user) {
      console.log(`User with email "${emailToMakeAdmin}" not found.`);
      console.log('Please register this user first in the frontend, then run this script again.');
      process.exit(0);
    }

    user.isAdmin = true;
    user.isVerified = true;
    user.role = 'admin';
    await user.save();
    console.log(`Success! User "${user.name}" (${user.email}) is now a verified admin!`);
  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

run();
