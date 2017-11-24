'use strict';
const express = require('express'),
    router = express.Router(),
    db = require('../../../models/index'),
    functions = require('../../helpers'),
    response = require('../../responses'),
    moment = require('moment'),
    nodemailer = require("nodemailer"),
    multer = require('multer'),
    upload = multer({dest: 'uploads/'}),
    fse = require('fs-extra'),
    satelize = require('satelize'),
    NodeGeocoder = require('node-geocoder'),
    options = {
        provider: 'google',

        // // Optional depending on the providers
        // httpAdapter: 'https', // Default
        // apiKey: 'YOUR_API_KEY', // for Mapquest, OpenCage, Google Premier
        // formatter: null         // 'gpx', 'string', ...
    },
    geocoder = NodeGeocoder(options),
    asyncMiddleware = fn =>
        (req, res, next) => {
            Promise.resolve(fn(req, res, next))
                .catch(next);
        };

router.post('/createPost', isLoggedIn, upload.array('media', 10), asyncMiddleware(async(req, res, next) => {
    if (!req.body.content) {
        return res.json(response.response(false, 'Content is required.', null))
    }

    return db.feedPosts.create({
        pet_id: req.user.selected_pet_id,
        content: req.body.content,
        location: req.body.location,
        shared: false,
        likes: 0,
        comment: []
    }).then((post) => {
        if (!req.files) {
            return res.json(response.response(true, 'Post created.', {post}))
        } else {
            let data = [].concat(req.files);
            return Promise.mapSeries(data, (item) => {
                const tempFile = item.destination + item.filename,
                    newFile = 'uploads/feed/post/' + '/' + item.filename + '_' + item.originalname;
                return fse.copy(tempFile, newFile)
                    .then(() => {
                        return db.feedPostMedia.create({
                            post_id: post.id,
                            path: newFile
                        });
                    })
            })
                .then(() => post)
        }
    })
        .then((post) => {
            return Promise.all([
                db.feedPosts.findOne({
                    where: {
                        id: post.id
                    },
                    include: [{model: db.pets, as: 'Pet'}]
                }),
                db.feedPostMedia.findAll({
                    where: {
                        post_id: post.id
                    }
                })
            ])
                .then((queryRes) => {
                    const Post = queryRes[0];
                    const Media = queryRes[1];

                    functions.pushNotification("badcc800-8189-4920-91c8-264486914c60", Post.Pet.name + ' created a post.');
                    return res.json(response.response(true, 'Created post.', {Post, Media}))
                })
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
}));

router.get('/allPosts', isLoggedIn, asyncMiddleware(async (req, res, next) => {
    let limit = 20;
    let page = 1;
    if (req.query.max) {
        limit = parseInt(req.query.max);
    }
    if (req.query.page) {
        page = parseInt(req.query.page);
    }
    const offset = limit * (page - 1);

    let feed = [];
    let feedPosts = await db.feedPosts.findAll({
        limit: limit,
        offset: offset,
        include: [
            {model: db.feedPosts, as: 'SharedPost', include: [{model: db.pets, as: 'Pet'}]},
            {model: db.pets, as: 'Pet'}
        ],
        order: [['created_at', 'DESC']]
    });

    await Promise.mapSeries(feedPosts, (item) => {
        async function add() {
            let sharedPostMedia = null;
            let Comments = await db.feedComments.findAll({
                where: {
                    post_id: item.id
                },
                include: [{model: db.pets, as: 'Pet'}],
                order: [['created_at', 'DESC']]
            });
            const media = await db.feedPostMedia.findAll({
                where: {
                    post_id: item.id
                }
            });
            if (item.SharedPost !== null) {
                sharedPostMedia = await db.feedPostMedia.findAll({
                    where: {
                        post_id: item.SharedPost.id
                    }
                });
            }
            return await Promise.mapSeries(Comments, (comment) => {
                async function child() {
                    return await db.feedCommentsJunction.findAll({
                        where: {
                            parent_comment_id: comment.id
                        },
                        include: [{model: db.feedComments, as: 'ChildComment', include: [{model: db.pets, as: 'Pet'}]}],
                        order: [['created_at', 'DESC']]
                    });
                }
                return child().then((res) => {
                    comment.comments = res;
                    const child = Comments.find(x => x.id === res.child_comment_id);
                    if (child !== null) {
                        Comments = Comments.splice(Comments.indexOf(child, 1));
                    }
                })
            })
                .then(() => {
                    item.media = media;
                    if (item.SharedPost !== null) {
                        item.SharedPost.media = sharedPostMedia;
                    }
                    return Comments;
                });
        }
        return add().then((res) => {
            item.comments = res;
            feed.push(item);
        });
    });

    feed = feed.sort(functions.sortByCreated);
    return res.json(response.response(true, 'Retrieved feed', {feed}));
}));

router.get('/myPosts', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;
    if (req.query.max) {
        limit = parseInt(req.query.max);
    }
    if (req.query.page) {
        page = parseInt(req.query.page);
    }
    const offset = limit * (page - 1);

    return db.feedPosts.findAll({
        limit: limit,
        offset: offset,
        where: {
            pet_id: req.user.selected_pet_id
        },
        order: [['created_at', 'DESC']],
        include: [
            {model: db.pets, as: 'Pet'}
        ]
    })
        .then((posts) => {
            let data = [];
            return Promise.mapSeries(posts, (Post) => {
                let post = {};
                post.post = Post;

                return db.feedComments.findAll({
                    where: {
                        post_id: Post.id,
                        parent: true
                    },
                    order: [['created_at', 'DESC']],
                    include: [
                        {model: db.pets, as: 'Pet'}
                    ]
                })
                    .then((comments) => {
                        let Comments = comments;
                        return Promise.mapSeries(Comments, (comment) => {
                            return db.feedCommentsJunction.findAll({
                                where: {
                                    parent_comment_id: comment.id
                                },
                                include: [
                                    {
                                        model: db.feedComments,
                                        as: 'ChildComment',
                                        include: [
                                            {model: db.pets, as: 'Pet'}
                                        ]
                                    }
                                ],
                                order: [['created_at', 'DESC']]
                            })
                                .then((junction) => {
                                    comment.comments = junction;
                                })
                        })
                            .then(() => Comments)
                    })
                    .then((Comments) => {
                        post.post.comments = Comments;
                        return db.feedPostMedia.findAll({
                            where: {
                                post_id: Post.id
                            }
                        })
                            .then((media) => {
                                post.media = media;
                                data.push(post);
                            })
                    })
            })
                .then(() => data)
        })
        .then((feed) => {
            return res.json(response.response(true, 'Retrieved pet\'s feed.', {feed}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.delete('/deletePost:/id', isLoggedIn, (req, res) => {
    return db.feedPosts.findById(req.params.id)
        .then((post) => {
            if (post.pet_id !== req.user.selected_pet_id) {
                return res.json(response.response(false, 'You can delete only your posts.', null))
            } else {
                return db.feedPostMedia.destroy({
                    where: {
                        post_id: post.id
                    },
                    force: true
                })
                    .then(() => {
                        return post.destroy()
                            .then(() => res.json(response.response(true, 'Post deleted', null)))
                            .catch((err) => {
                                console.log(err);
                                return res.json(response.error())
                            })
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.json(response.error())
                    })
            }
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/editPost/:id', upload.fields([{name: 'added', maxCount: 10}]), isLoggedIn, (req, res) => {
    let removedMedia = null;
    let addedMedia = null;
    if (req.body.removed) {
        removedMedia = req.body.removed;
    }
    if (req.files['added']) {
        addedMedia = req.files['added']
    }

    return db.feedPosts.findById(req.params.id)
        .then((post) => {
            if (post.pet_id !== req.user.selected_pet_id) {
                return res.json(response.response(false, 'You can edit only your posts.', null))
            } else {
                if (removedMedia !== null && addedMedia !== null) {
                    return Promise.mapSeries(removedMedia, (item) => {
                        return db.feedPostMedia.destroy({
                            where: {
                                id: parseInt(item)
                            },
                            force: true
                        });
                    })
                        .then(() => {
                            return Promise.mapSeries(addedMedia, (item) => {
                                const tempFile = item.destination + item.filename,
                                    newFile = 'uploads/feed/post/' + '/' + item.filename + '_' + item.originalname;
                                return fse.copy(tempFile, newFile)
                                    .then(() => {
                                        return db.feedPostMedia.create({
                                            post_id: post.id,
                                            path: newFile
                                        });
                                    })
                            })
                        })
                        .then(() => post)
                } else if (removedMedia !== null && addedMedia !== null) {
                    return Promise.mapSeries(removedMedia, (item) => {
                        return db.feedPostMedia.destroy({
                            where: {
                                id: parseInt(item)
                            },
                            force: true
                        });
                    })
                        .then(() => post)
                } else if (removedMedia === null && addedMedia !== null) {
                    return Promise.mapSeries(addedMedia, (item) => {
                        const tempFile = item.destination + item.filename,
                            newFile = 'uploads/feed/post/' + '/' + item.filename + '_' + item.originalname;
                        return fse.copy(tempFile, newFile)
                            .then(() => {
                                return db.feedPostMedia.create({
                                    post_id: post.id,
                                    path: newFile
                                });
                            })
                    })
                        .then(() => post)
                } else if (removedMedia === null && addedMedia === null) {
                    return post;
                }
            }
        })
        .then((post) => {
            return post.updateAttributes({
                content: req.body.content,
                location: req.body.location
            })
                .then((newPost) => {
                    let Post = [];
                    Post.push(newPost);
                    return db.feedPostMedia.findAll({
                        where: {
                            post_id: newPost.id
                        }
                    })
                        .then((media) => {
                            Post.push(media);
                            return res.json(response.response(true, 'Update post.', {Post}))
                        })
                        .catch((err) => {
                            console.log(err);
                            return res.json(response.error())
                        })
                })
                .catch((err) => {
                    console.log(err);
                    return res.json(response.error())
                })
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/likePost/:id', isLoggedIn, asyncMiddleware(async (req, res, next) => {
    const feedPost = await db.feedPosts.findById(req.params.id);
    const postLike = await db.feedLikes.findOne({
        where: {
            pet_id: req.user.selected_pet_id,
            post_id: req.params.id
        }
    });
    if (postLike) {
        const newLikes = feedPost.likes - 1;
        const newPost = await feedPost.updateAttributes({
            likes: newLikes
        });
        const destroyLike = await postLike.destroy({force: true})
            .then(() => res.json(response.response(true, 'Post unliked.', {newPost})))
    } else {
        const newLikes = feedPost.likes + 1;
        const newPost = await feedPost.updateAttributes({
            likes: newLikes
        });
        const newLike = await db.feedLikes.create({
            pet_id: req.user.selected_pet_id,
            post_id: feedPost.id
        })
            .then(() => res.json(response.response(true, 'Post unliked.', {newPost})))
    }
}));

router.post('/commentPost/:id', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    let parent = null;
    if (req.body.parent) {
        parent = parseInt(req.body.parent);
    }

    const comment = await db.feedComments.create({
        pet_id: req.user.selected_pet_id,
        post_id: parseInt(req.params.id),
        content: req.body.content,
        likes: 0
    });

    const post = await db.feedPosts.findById(req.params.id);

    if (parent !== null) {
        await db.feedCommentsJunction.create({
            parent_comment_id: parent,
            child_comment_id: comment.id
        });

        return res.json(response.response(true, 'Added new comment.', {post, comment}))
    } else {
        return res.json(response.response(true, 'Added new comment.', {post, comment}))
    }
}));

router.post('/likeComment/:id', isLoggedIn, asyncMiddleware(async (req, res, next) => {
    const comment = await db.feedComments.findById(req.params.id);
    const like = await db.feedCommentLikes.findOne({
        where: {
            pet_id: req.user.selected_pet_id,
            comment_id: comment.id
        }
    });
    if (!like) {
        const newLike = await db.feedCommentLikes.create({
            pet_id: req.user.selected_pet_id,
            comment_id: comment.id
        });
        const newLikes = comment.likes + 1;
        const newComment = await comment.updateAttributes({
            likes: newLikes
        });
        return res.json(response.response(true, 'Liked comment.', {newComment}))
    } else {
        const destroyed = await like.destroy({force: true});
        const newLikes = comment.likes - 1;
        const newComment = await comment.updateAttributes({
            likes: newLikes
        });
        return res.json(response.response(true, 'Unliked comment.', {newComment}))
    }
}));

router.post('/sharePost/:id', isLoggedIn, asyncMiddleware(async (req, res, next) => {
    const parentPost = await db.feedPosts.findById(req.params.id);
    if (parentPost.pet_id === req.user.selected_pet_id) {
        return res.json(response.response(false, 'Oh, you attention seeking pet.', null))
    }
    const childPost = await db.feedPosts.create({
        pet_id: req.user.selected_pet_id,
        content: req.body.content,
        location: req.body.location,
        shared_id: parentPost.id,
        likes: 0,
        comments: []
    });

    return await db.feedPosts.findOne({
        where: {
            id: childPost.id
        },
        include: [{model: db.feedPosts, as: 'SharedPost'}]
    })
        .then((post) => res.json(response.response(true, 'Post shared.', {post})))
}));

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('Logged in.');
        return next();
    } else {
        return res.json(response.response(false, 'User is not logged in.', null))
    }
}