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
    NodeGeocoder = require('node-geocoder'),
    options = {
        provider: 'google'
    },
    geocoder = NodeGeocoder(options);

router.get('/', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const types = await db.location_type.findAll({order: [['created_at', 'ASC']]});
    return res.render('sidebar/locations', {
        title: 'Ma\'Pet - Locations',
        layout: 'layout',
        user: JSON.stringify(req.user),
        types: types
    })
}));

router.get('/data', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    let limit = 10;
    let page = 1;
    if (req.query.datatable.pagination.perpage) {
        limit = parseInt(req.query.datatable.pagination.perpage);
    }
    if (req.query.datatable.pagination.page) {
        page = parseInt(req.query.datatable.pagination.page);
    }

    let offset = limit * (page - 1);

    let where = {};
    if (req.query.datatable.query.Type) {
        where.location_type_id = parseInt(req.query.datatable.query.Type);
    }
    if (req.query.datatable.query.generalSearch) {
        where.$or = [{name: {[Op.iLike]: '%' + req.query.datatable.query.generalSearch + '%'}}]
    }
    const locations2 = await db.locations.findAll();

    const locations = await db.locations.findAll(
        {
            limit: limit,
            offset: offset,
            where: where,
            order: [['created_at', 'ASC']],
            include: [
                {model: db.location_type, as: 'Type'}
            ]
        }
    );

    return res.json({
        meta: {
            field: 'name',
            page: page,
            pages: Math.ceil(locations2.length / 10),
            perpage: limit,
            sort: 'asc',
            total: locations2.length
        },
        data: locations
    })
}));

router.get('/create', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const types = await db.location_type.findAll({order: [['created_at', 'ASC']]});

    return res.render('forms/create-location', {
        title: 'Ma\'Pet - Create Location',
        layout: 'layout',
        user: JSON.stringify(req.user),
        types: types
    });
}));

router.post('/create-location', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const geocode = await geocoder.geocode(req.body.address);

    await db.locations.create({
        name: req.body.location_name,
        address: req.body.address,
        latitude: geocode.latitude,
        longitude: geocode.longitude,
        distance: 0,
        rating: 0,
        ratingCount: 0,
        views: 0,
        description: req.body.description,
        phoneNumber: req.body.phone_number,
        email: req.body.email,
        location_type_id: req.body.location_type,
        media: []
    });

    return res.redirect('/admin/locations');
}));

router.get('/media/:id', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const media = await db.location_media.findAll({where: {location_id: parseInt(req.params.id)}});
    const location = await db.locations.findById(parseInt(req.params.id));

    return res.render('side-views/location-media', {
        title: location.name + ' - Media',
        layout: 'layout',
        user: JSON.stringify(req.user),
        media: media
    })
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