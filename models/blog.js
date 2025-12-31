const mongoose = require('mongoose');
const { create } = require('./user');


const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    coverimage: {
        type: String,
        required: false
    },tags: {
        type: [String],
        required: false
    },
    category: {
        type: String,
        required: false
    },
    createdby: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',    
        required: true
    },
    createdat: {
        type: Date,
        default: Date.now
    }
},{timestamps: true});

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;