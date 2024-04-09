
const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://pankajpatidar474:kS66CUumAZB5HFW3@cluster0.04eyagp.mongodb.net/elevenTrack?retryWrites=true&w=majority';
const UserRole = require('../models/userRole');

let db;

const connectDB = async () => {
    try {
        db = await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }

    // const admin = new UserRole({
    //     role_name: 'Admin',
    //   });
      
    //   admin.save()
    //     .then(() => {
    //       console.log('User saved successfully');
    //     })
    //     .catch((error) => {
    //       console.error('Error saving user:', error);
    //     });
    // const superadmin = new UserRole({
    //     role_name: 'Superadmin',
    //     });
        
    //     superadmin.save()
    //     .then(() => {
    //         console.log('User saved successfully');
    //     })
    //     .catch((error) => {
    //         console.error('Error saving user:', error);
    //     });
    // const user = new UserRole({
    //     role_name: 'User',
    //     });
        
    //     user.save()
    //     .then(() => {
    //         console.log('User saved successfully');
    //     })
    //     .catch((error) => {
    //         console.error('Error saving user:', error);
    //     });
      
};

const getDB = () => {
    if (!db) {
        console.error('Database not connected. Call connectDB first.');
    }
    return db;
};

module.exports = {
    connectDB,
    getDB,
};
