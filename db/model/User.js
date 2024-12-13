import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        unique: [true, 'Email already exists'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
        trim: true,
        unique: [true, 'Roll number already exists'],
    }
},
    { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

export default User;