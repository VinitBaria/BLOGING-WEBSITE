const express = require('express');
const Blog = require('../models/blog');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const authenticate = require('../middleware/user');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve('./public/uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
const router = express.Router();

router.get('/addblog', authenticate, (req, res) => {
  return res.render('addblog');
});

router.post('/addblog', authenticate, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!req.file) {
      return res.status(400).send("Cover image is required!");
    }

    // Process tags - can be a string (comma-separated) or array
    let tagsArray = [];
    if (tags) {
      if (typeof tags === 'string') {
        // Split by comma and trim each tag
        tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        tagsArray = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }

    const blog = await Blog.create({
      title,
      content,
      category: category || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      coverimage: "/public/uploads/" + req.file.filename,
      createdby: req.user.id,         // Use 'id' from JWT payload
      createdat: new Date(),
    });

    console.log("Blog created:", blog);
    return res.redirect('/blog');

  } catch (error) {
    console.error("Error creating blog:", error);
    return res.status(500).send("Error creating blog: " + error.message);
  }
});

router.get('/blog/:id', authenticate, async (req, res) => {
  try {
    const User = require('../models/user');
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId).populate('createdby', 'fullname email profileImage bio location twitter instagram facebook linkedin github');

    if (!blog) {
      return res.status(404).send('Blog not found');
    }

    // Get current user and check if following author
    const currentUser = await User.findById(req.user.id);
    let isFollowing = false;
    
    if (blog.createdby && currentUser.following) {
      isFollowing = currentUser.following.includes(blog.createdby._id.toString());
    }

    // Get like data for this blog
    const likes = await User.countDocuments({ likedblogs: blogId });
    const isLiked = currentUser.likedblogs && currentUser.likedblogs.includes(blogId);

    return res.render('displayblog', { 
      title: blog.title, 
      blog,
      user: currentUser,
      isFollowing: isFollowing,
      likes: likes,
      isLiked: isLiked
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return res.status(500).send('Error loading blog: ' + error.message);
  }
});

// Like / Unlike a blog
router.post('/like/:id', authenticate, async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hasLiked = user.likedblogs && user.likedblogs.includes(blogId);

    if (hasLiked) {
      await User.findByIdAndUpdate(userId, { $pull: { likedblogs: blogId } });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { likedblogs: blogId } });
    }

    const likes = await User.countDocuments({ likedblogs: blogId });

    return res.json({
      success: true,
      liked: !hasLiked,
      likes
    });
  } catch (error) {
    console.error('Error liking blog:', error);
    return res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

router.get('/',authenticate, async (req, res) => {
  try {
    const blogs = await Blog.find().populate('createdby', 'fullname email').sort({ createdat: -1 });
    
    // Get current user's liked blogs
    const currentUser = await User.findById(req.user.id);
    const likedSet = new Set((currentUser?.likedblogs || []).map(id => id.toString()));
    
    // Add like data to each blog
    const blogsWithLikes = await Promise.all(
      blogs.map(async (blog) => {
        const likes = await User.countDocuments({ likedblogs: blog._id });
        return {
          ...blog.toObject(),
          likes,
          isLiked: likedSet.has(blog._id.toString())
        };
      })
    );
    
    return res.render('blogs', { title: 'All Blogs', blogs: blogsWithLikes });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return res.status(500).send('Error loading blogs: ' + error.message);
  }
});

module.exports = router;
