'use strict';
const express = require('express'),
    router = express.Router(),
    db = require('../../../models/index'),
    passport = require('passport'),
    functions = require('../../helpers'),
    response = require('../../responses'),
    moment = require('moment'),
    nodemailer = require("nodemailer"),
    bCrypt = require('bcrypt-nodejs'),
    smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "bogdan.bucur@udevoffice.ro",
            pass: "l0standdamnd"
        }
    }),
    multer = require('multer'),
    upload = multer({dest: 'uploads/'}),
    crypto = require("crypto"),
    asyncMiddleware = fn =>
        (req, res, next) => {
            Promise.resolve(fn(req, res, next))
                .catch(next);
        };

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/user/loginSuccess',
    failureRedirect: '/user/loginFail',
    failureFlash: true
}));

router.post('/register', asyncMiddleware(async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    let where = {
        email: email,
        type: req.body.type
    };

    switch (req.body.type) {
        case 'user':
            where.type = 'user';
            break;
        case 'admin':
            where.type = 'admin';
            break;
    }

    if (confirmPassword === password) {
        return db.user.findOne({
            where: where,
            attributes: {
                exclude: ['password']
            }
        })
            .then((user) => {

                const generateHash = (password) => {
                    return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
                };
                if (user && user.status === 'Active') {
                    return res.json(response.response(false, 'Email is already used.', null));
                } else if (user && user.status === 'Pending') {
                    // const link = 'http://146.185.178.206:80/user/register/callback/';
                    const link = 'http://127.0.0.1:8000/user/register/callback/';
                    const mailOptions = {
                        to: user.email,
                        subject: "Please confirm your Email account",
                        html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + user.id + ">Click here to verify</a>"
                    };

                    smtpTransport.sendMail(mailOptions, (error, response) => {
                    });

                    return res.json(response.response(true, 'Successfully sent email', {user: user}));
                } else {
                    return db.user.create({
                        type: req.body.type,
                        email: email,
                        password: generateHash(password),
                        status: 'Pending',
                        device_uuid: req.body.device_uuid,
                        fullName: req.body.fullName
                    })
                        .then((newUser) => res.redirect('/user/sendEmail/' + newUser.id + '/' + newUser.type))
                }
            })
    } else {
        return res.json(response.response(false, 'Passwords do not match', null));
    }
}));

router.get('/sendEmail/:id/:type', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('Logged in');
    }
    // const link = 'http://146.185.178.206:80/user/register/callback/';
    const link = 'http://127.0.0.1:8000/user/register/callback/';
    let where = {
        id: req.params.id
    };

    switch (req.params.type) {
        case 'user':
            where.type = 'user';
            break;
        case 'admin':
            where.type = 'admin';
            break;
    }
    return db.user.findOne({
        where: where
    })
        .then((user) => {
            const mailOptions = {
                to: user.email,
                subject: "Please confirm your Email account",
                html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + req.params.id + '/' + user.type + ">Click here to verify</a>"
            };

            smtpTransport.sendMail(mailOptions, (error, response) => {
            });

            return res.json(response.response(true, 'Successfully sent email', {user: user}));

        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/register/callback/:id/:type', (req, res) => {
    let where = {
        id: req.params.id
    };

    switch (req.params.type) {
        case 'user':
            where.type = 'user';
            break;
        case 'admin':
            where.type = 'admin';
            break;
    }
    return db.user.findOne({
        where: where
    })
        .then((user) => {
            return user.updateAttributes({
                status: 'Active'
            })
                .then(() => res.status(200).send('Account Verified. You can go back to the MaPet app and login now.'))
                .catch((err) => {
                    console.log(err);
                    return res.status(200).send('There has been a problem with verifying your account. Please try again in a few minutes.');
                })
        })
        .catch((err) => {
            console.log(err);
            return res.status(200).send('There has been a problem with verifying your account. Please try again in a few minutes.');
        })
});

router.get('/loginSuccess', isLoggedIn, (req, res) => {
    return Promise.all([
        functions.queryUser(req.user.id),
        functions.queryUserPets(req.user.id)
    ])
        .then((queryRes) => res.json(response.response(true, 'Successfully logged in', {user: queryRes[0], pets: queryRes[1]})))
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/loginFail', isNotLoggedIn);

router.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['user_about_me', 'email', 'public_profile']
}));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/user/loginSuccess',
    failureRedirect: '/user/loginFail'
}));

router.get('/logout', (req, res) => {
    req.logOut();
    req.session.destroy();
    if (req.isAuthenticated()) {
        return res.json(response.response(false, 'Logout unsuccessful.', null))
    } else {
        return res.json(response.response(true, 'Successfully logged out.', null))
    }
});

router.get('/checkLogin', (req, res) => {
    if (req.isAuthenticated()) {
        return Promise.all([
            functions.queryUser(req.user.id),
            functions.queryUserPets(req.user.id)
        ])
            .then((queryRes) => res.json(response.response(true, 'User is logged in.', {user: queryRes[0], pets: queryRes[1]})))
            .catch((err) => {
                console.log(err);
                return res.json(response.error())
            })
    } else if (req.isUnauthenticated()) {
        return res.json(response.response(false, 'User is not logged in.', null));
    }
});

router.post('/updateProfile', isLoggedIn, upload.single('profilePicture'), (req, res) => {
    let date = null;

    if (req.body.dob) {
        date = moment(req.body.dob, 'DD-MM-YYYY').format('YYYY-MM-DD');
    }

    if (req.file) {
        const profilePicture = req.file;
        functions.profilePicture(profilePicture, req.user);
    }

    return functions.queryUser(req.user.id)
        .then((user) => {
            user.updateAttributes({
                fullName: req.body.fullName,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                gender: req.body.gender,
                dob: date,
                phoneNumber: req.body.phoneNumber,
                address: req.body.address,
                website: req.body.website,
                city: req.body.city
            })
                .then((newUser) => {
                    return res.json(response.response(true, 'Successfully update user profile.', {user: newUser}));
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

router.post('/addCredits/:credits', (req, res) => {
    const credits = parseInt(req.params.credits);

    return functions.queryUser(req.user.id)
        .then((user) => {
            const newCredits = user.credits + credits;
            user.updateAttributes({
                credits: newCredits
            })
                .then(() => res.json(response.response(true, 'Successfully added ' + credits + ' credits.', null)))
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

router.post('/forgotPassword', (req, res) => {
    const email = req.body.email;
    const password = crypto.randomBytes(6).toString('hex');

    return db.user.findOne({
        where: {
            email: email
        },
        attributes: {
            exclude: ['password']
        }
    })
        .then((user) => {
            const generateHash = (password) => {
                return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
            };
            user.updateAttributes({
                password: generateHash(password)
            })
                .catch((err) => {
                    console.log(err);
                    return res.json(response.error())
                });

            const mailOptions = {
                to: user.email,
                subject: "Change Password",
                html: "Hello,<br> New Password: " + password + ".<br>" +
                "Use this password to login to your account and go to Settings > Change Password to change your password"
            };

            smtpTransport.sendMail(mailOptions, (error, response) => {
            });

            return res.json(response.emailSent(user));
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/changePassword', isLoggedIn, (req, res) => {
    const oldPass = req.body.oldPass;
    const newPass = req.body.newPass;
    const newPass1 = req.body.newPass1;

    function isValidPassword (userpass, password) {
        return bCrypt.compareSync(password, userpass);
    }

    if (!isValidPassword(req.user.password, oldPass)) {
        return res.json(response.response(false, 'The old password is not correct! Try again.', null))
    } else if (newPass !== newPass1) {
        return res.json(response.response(false, 'Passwords do not match', null))
    } else {
        const generateHash = (password) => {
            return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
        };

        return functions.queryUser(req.user.id)
            .then((user) => {
                user.updateAttributes({
                    password: generateHash(newPass)
                })
                    .then(() => {
                        return res.json(response.response(true, 'Password successfully changed.', null))
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
    }
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('Logged in.');
        return next();
    } else {
        res.redirect('/');
    }
}

function isNotLoggedIn(req, res, next) {
    if (req.isUnauthenticated()) {
        return res.json(response.response(false, 'User is not logged in.', null))
    }
}

module.exports = router;