const express = require('express');
const router = express.Router();
const User = require('../models/user');
const authenticate = require('../middleware/user');
const{ signup, signin } = require('../controller/user');

router.get('/',(req, res) => {
    res.render('home', { title: 'Home' });
});
router.get('/signup', (req, res) => {
    res.render('signup');
});
router.get('/signin', (req, res) => {
    res.render('signin');
}
);
router.post('/signup', signup);
router.post('/signin',signin); 

// About page with blog analytics
router.get('/about', authenticate, async (req, res) => {
    try {
        const Blog = require('../models/blog');
        const User = require('../models/user');

        // Current user
        const currentUser = await User.findById(req.user.id);

        // Only blogs created by the logged-in user
        const blogs = await Blog.find({ createdby: req.user.id })
            .populate('createdby', 'fullname email profileImage')
            .sort({ createdat: -1 });

        // Likes data
        const likedSet = new Set((currentUser?.likedblogs || []).map(id => id.toString()));
        const blogsWithLikes = await Promise.all(
            blogs.map(async (b) => {
                const likes = await User.countDocuments({ likedblogs: b._id });
                return {
                    ...b.toObject(),
                    likes,
                    isLiked: likedSet.has(b._id.toString()),
                };
            })
        );

        const totalBlogs = blogsWithLikes.length;
        // Placeholder views metric (adjust when real tracking exists)
        const totalViews = totalBlogs * 15;
        const totalLikes = blogsWithLikes.reduce((sum, b) => sum + (b.likes || 0), 0);

        res.render('about', { 
            title: 'About', 
            stats: { totalBlogs, totalViews, totalLikes },
            blogs: blogsWithLikes
        });
    } catch (error) {
        console.error('Error loading about page:', error);
        res.status(500).send('Error loading about page: ' + error.message);
    }
});

// API route to verify JWT token and get user data
router.get('/api/verify-token', authenticate, (req, res) => {
    // If middleware passes, user is authenticated
    res.json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            fullname: req.user.fullname || 'User',
            profileImage: req.user.profileImage || '/public/images/default.png'
        }
    });
});

// API route to get recent blogs for homepage
router.get('/api/recent-blogs', async (req, res) => {
    try {
        const Blog = require('../models/blog');
        const blogs = await Blog.find()
            .populate('createdby', 'fullname email profileImage')
            .sort({ createdat: -1 })
            .limit(6);
        
        res.json(blogs);
    } catch (error) {
        console.error('Error fetching recent blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// API route to get site statistics
router.get('/api/stats', async (req, res) => {
    try {
        const Blog = require('../models/blog');
        
        const totalBlogs = await Blog.countDocuments();
        const totalUsers = await User.countDocuments();
        
        // Calculate total views (you can implement view tracking later)
        const totalViews = totalBlogs * 15; // Placeholder calculation
        
        res.json({
            totalBlogs,
            totalUsers,
            totalViews
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ 
            totalBlogs: 0,
            totalUsers: 0,
            totalViews: 0
        });
    }
});

// Migration route to fix existing blog image paths (run once)
router.get('/api/fix-blog-images', async (req, res) => {
    try {
        const Blog = require('../models/blog');
        
        // Find blogs with old image paths
        const blogsToUpdate = await Blog.find({
            coverimage: { $regex: '^/uploads/', $options: 'i' }
        });
        
        let updatedCount = 0;
        
        for (const blog of blogsToUpdate) {
            blog.coverimage = '/public' + blog.coverimage;
            await blog.save();
            updatedCount++;
        }
        
        res.json({
            success: true,
            message: `Updated ${updatedCount} blog image paths`,
            updatedCount
        });
    } catch (error) {
        console.error('Error fixing blog images:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fix blog images'
        });
    }
});

// Profile route
router.get('/profile', authenticate, async (req, res) => {
    try {
        const Blog = require('../models/blog');
        const user = await User.findById(req.user.id)
            .select('-password -salt')
            .populate('followers', 'fullname email profileImage')
            .populate('following', 'fullname email profileImage');
        
        // Get all blogs created by this user
        const userBlogs = await Blog.find({ createdby: req.user.id })
            .sort({ createdat: -1 });
        
        return res.render('profile', {
            title: 'Profile',
            user: user,
            blogs: userBlogs
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).send("Error loading profile: " + error.message);
    }
});

// Update profile route
router.post('/profile/update', authenticate, async (req, res) => {
    try {
        const { fullname, email } = req.body;

        // Validate input
        if (!fullname || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Full name and email are required' 
            });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ 
            email: email, 
            _id: { $ne: req.user.id } 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is already taken by another user' 
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { fullname, email },
            { new: true, runValidators: true }
        ).select('-password -salt');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        return res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: user
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false, 
                message: Object.values(error.errors)[0].message 
            });
        }

        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is already taken' 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: 'Error updating profile: ' + error.message 
        });
    }
});

// Follow/Unfollow user route
router.post('/follow/:userId', authenticate, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.user.id;

        // Can't follow yourself
        if (targetUserId === currentUserId) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot follow yourself' 
            });
        }

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const isFollowing = currentUser.following && currentUser.following.includes(targetUserId);

        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(currentUserId, {
                $pull: { following: targetUserId }
            });
            await User.findByIdAndUpdate(targetUserId, {
                $pull: { followers: currentUserId }
            });

            return res.json({ 
                success: true, 
                message: 'Unfollowed successfully',
                isFollowing: false
            });
        } else {
            // Follow
            await User.findByIdAndUpdate(currentUserId, {
                $addToSet: { following: targetUserId }
            });
            await User.findByIdAndUpdate(targetUserId, {
                $addToSet: { followers: currentUserId }
            });

            return res.json({ 
                success: true, 
                message: 'Followed successfully',
                isFollowing: true
            });
        }
    } catch (error) {
        console.error('Error following/unfollowing user:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error: ' + error.message 
        });
    }
});

// Check if current user is following another user
router.get('/follow-status/:userId', authenticate, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUser = await User.findById(req.user.id);
        
        const isFollowing = currentUser.following && currentUser.following.includes(targetUserId);
        
        return res.json({ isFollowing });
    } catch (error) {
        console.error('Error checking follow status:', error);
        return res.status(500).json({ isFollowing: false });
    }
});

module.exports = router;