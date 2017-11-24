'use strict';

const express = require('express'),
    router = express.Router(),
    db = require('../../../models/index'),
    passport = require('passport'),
    functions = require('../../helpers'),
    response = require('../../responses'),
    moment = require('moment'),
    bCrypt = require('bcrypt-nodejs'),
    Sequelize = require('sequelize'),
    Op = Sequelize.Op,
    asyncMiddleware = fn =>
        (req, res, next) => {
            Promise.resolve(fn(req, res, next))
                .catch(next);
        },
    fs = require('fs');

router.get('/login-page', isNotLoggedIn, asyncMiddleware(async (req, res, next) => {
    return res.render('login-page', {
        title: 'Admin Login',
        layout: false
    });
}));

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/admin/home',
    failureRedirect: '/admin/login-page',
    failureFlash: true
}));

router.post('/sign-out', isLoggedIn, asyncMiddleware(async (req, res, next) => {
    req.logOut();
    req.session.destroy();
    if (req.isAuthenticated()) {
        return res.redirect('/admin/home')
    } else {
        return res.redirect('/admin/login-page')
    }
}));

router.get('/home', isLoggedIn, asyncMiddleware(async (req, res, next) => {
    return res.render('sidebar/dashboard', {
        title: 'MaPet Homepage',
        layout: 'layout',
        user: req.user
    });
}));

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('Logged in.');
        return next();
    } else {
        return res.redirect('/admin/login-page');
    }
}

function isNotLoggedIn(req, res, next) {
    if (req.isUnauthenticated()) {
        return next();
    } else {
        return res.redirect('/admin/home');
    }
}