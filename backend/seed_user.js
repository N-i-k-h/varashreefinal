const { connectDB } = require('./config/db');
const mongoose = require('mongoose');
const User = require('./models/User');

const seedUser = async () => {
    try {
        await connectDB();

        const email = 'admin@nursery.com';
        const password = 'admin'; // Will be hashed by the User model hooks

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists');
        } else {
            await User.create({
                name: 'Admin User',
                email,
                password,
            });
            console.log('✅ Admin user created successfully');
            console.log('Email: admin@nursery.com');
            console.log('Password: admin');
        }
    } catch (error) {
        console.error('❌ Error creating user:', error);
    } finally {
        await mongoose.disconnect();
    }
};

seedUser();
