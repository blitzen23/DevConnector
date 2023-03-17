const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post('/', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
    
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id,
        });

        const post = await newPost.save();

        return res.json(post);
    }catch (err){
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({date: -1});
        return res.json(posts);
    } catch (err){
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post){
            return res.status(404).json({errors: [{msg: 'Post not found'}]});
        }

        return res.json(post);
    } catch (err){
        console.error(err.message);
        if (err.kind === 'ObjectId'){
            return res.status(404).json({errors: [{msg: 'Post not found'}]});
        }
        return res.status(500).send('Server error');
    }
});

// @route   DELETE api/posts/:id
// @desc    Delete post by ID
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post){
            return res.status(404).json({errors: [{msg: 'Post not found'}]});
        }
        // Check user
        if (post.user.toString() !== req.user.id){
            return res.status(401).json({errors: [{msg: 'User not authorized'}]});
        }

        await post.remove();

        return res.json({msg: 'Post removed'});
    } catch (err){
        console.error(err.message);
        if (err.kind === 'ObjectId'){
            return res.status(404).json({errors: [{msg: 'Post not found'}]});
        }
        return res.status(500).send('Server error');
    }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
            return res.status(400).json({errors: [{msg: 'Post already liked'}]});
        }

        post.likes.unshift({user: req.user.id});

        await post.save();

        return res.json(post.likes);
    } catch (err){
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been linked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
            return res.status(400).json({errors: [{msg: 'Post has not yet been liked'}]});
        }

        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();

        return res.json(post.likes);
    } catch (err){
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post('/comment/:id', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);
    
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id,
        };

        post.comments.unshift(newComment);

        await post.save();

        return res.json(post.comments);
    }catch (err){
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete a comment on a post
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        if (!comment){
            return res.status(404).json({errors: [{msg: 'Comment does not exist'}]});
        }

        if (comment.user.toString() !== req.user.id){
            return res.status(401).json({errors: [{msg: 'User not authorized'}]});
        }

        let removeIndex = -1;
        for (let i = 0; i < post.comments.length; i++){
            if (post.comments[i].id === req.params.comment_id && post.comments[i].user.toString() === req.user.id){
                removeIndex = i;
                break;
            }
        }

        post.comments.splice(removeIndex, 1);

        await post.save();

        return res.json(post.comments);
    }catch (err){
        console.error(err.message);
        return res.status(500).send("Server error");
    }
});
module.exports = router;