const mongoose = require('mongoose');
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String
    },
    profileImage: {
        type: String,
        default: '/public/images/default.png'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },followers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },following: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    bio: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },

    twitter: {
        type: String,
        default: ''
    },
    instagram: {
        type: String,
        default: ''
    },
    facebook: {
        type: String,
        default: ''
    },
    linkedin: {
        type: String,
        default: ''
    },
    youtube: {
        type: String,
        default: ''
    },
    github: {
        type: String,
        default: ''
    },
    likedblogs: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Blog',
        default: []
    },
    commentedblogs: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Blog',
        default: []
    },
    followedusers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
   
}, { timestamps: true });


userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = crypto.randomBytes(16).toString("hex");

    const hashedPassword = crypto
        .createHmac("sha256", salt)
        .update(this.password)
        .digest("hex");

    this.password = hashedPassword;
    this.salt = salt;
});
userSchema.statics.matchPassword = async function (email, password) {
    const user = await this.findOne({ email });

    if (!user) {
        throw new Error('User not found');
    }

    if (!user.salt) {
        throw new Error('User has no salt stored');
    }

    const inputHash = crypto
        .createHmac("sha256", user.salt)
        .update(password)
        .digest("hex");

    if (inputHash !== user.password) {
        throw new Error('Invalid password');
    }

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.salt;

    return userObj;
};


module.exports = mongoose.model('User', userSchema);
