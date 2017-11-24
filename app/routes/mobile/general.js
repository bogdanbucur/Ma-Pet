'use strict';
const express = require('express'),
    router = express.Router(),
    db = require('../../../models/index'),
    functions = require('../../helpers'),
    asyncMiddleware = fn =>
        (req, res, next) => {
            Promise.resolve(fn(req, res, next))
                .catch(next);
        };
router.get('/404', (req, res) => {
    return res.render('error', {
        layout: false
    });
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
        console.log('Not logged in.');
        return next();
    } else {
        res.redirect('/home');
    }
}

module.exports = router;