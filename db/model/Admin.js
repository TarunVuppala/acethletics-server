import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: [true, 'Username already exists'],
            required: [true, 'Username is required'],
            trim: true,
            index: true,
        },
        password: { type: String, required: true },
        email: {
            type: String,
            unique: [true, 'Email already exists'],
            required: [true, 'Email is required'],
            trim: true,
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

export default Admin;
