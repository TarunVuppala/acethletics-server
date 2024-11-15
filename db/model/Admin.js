const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            index: true,
        },
        password: { type: String, required: true },
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            index: true,
        },
        role: {
            type: String,
            enum: ['super_admin', 'admin'],
            default: 'admin',
        },
    },
    { timestamps: true }
);

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;
