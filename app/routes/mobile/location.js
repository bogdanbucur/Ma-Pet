'use strict';

const express = require('express'),
    router = express.Router(),
    db = require('../../../models/index'),
    Sequelize = require('sequelize'),
    Op = Sequelize.Op,
    functions = require('../../helpers'),
    response = require('../../responses'),
    moment = require('moment'),
    multer = require('multer'),
    cors = require('cors'),
    fse = require('fs-extra'),
    path = require('path'),
    Loki = require('lokijs'),
    upload = multer({dest: 'uploads/'}),
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
    geodist = require('geodist');

router.post('/createLocationType', (req, res) => {
    return db.location_type.create({
        name: req.body.name,
        logo: req.body.logo
    })
        .then((type) => {
            return res.json(response.response(true, 'Successfully create location type', {data: type}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/editLocationType/:id', (req, res) => {
    const id = req.params.id;

    return db.location_type.findById(id)
        .then((type) => {
            type.updateAttributes({
                name: req.body.name,
                logo: req.body.logo
            })
                .then((newType) => {
                    return res.json(response.response(true, 'Successfully edited location type.', {data: newType}))
                })
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/getLocationTypes', (req, res) => {
    return db.location_type.findAll({})
        .then((types) => {
            return res.json(response.response(true, 'Successfully got all location types.', {data: types}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/getLocationType/:id', (req, res) => {
    const id = req.params.id;

    return db.location_type.findById(id)
        .then((type) => {
            return res.json(response.response(true, 'Successfully got location type.', {data: type}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/createLocation', upload.array('media', 10), (req, res) => {
    return db.locations.create({
        name: req.body.name,
        longitude: req.body.longitude,
        latitude: req.body.latitude,
        distance: 0,
        description: req.body.description,
        address: req.body.address,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email,
        location_type_id: req.body.location_type_id,
        media: [],
        rating: 0,
        rateCount: 0,
        views: 0
    })
        .then((location) => {
            if (!req.files) {
                return location;
            }
            let data = [].concat(req.files);
            return Promise.mapSeries(data, (photo) => {
                const tempFile = photo.destination + photo.filename,
                    newFile = 'uploads/locationsMedia/' + location.id + '/' + photo.filename + '_' + photo.originalname;

                return fse.copy(tempFile, newFile)
                    .then(() => {
                        return db.location_media.create({
                            path: newFile,
                            type: 'photo',
                            location_id: location.id
                        });
                    })
                    .catch((err) => console.log('error'))
            })
                .then(() => location)
        })
        .then((loc) => {
            if (!req.files) {
                return db.locations.findOne({
                    where: {
                        id: loc.id
                    },
                    include: [
                        {model: db.location_type, as: 'Type'}
                    ]
                })
                    .then((location) => {
                        let data = [];
                        return db.location_media.findAll({
                            where: {
                                location_id: location.id
                            }
                        })
                            .then((media) => {
                                return Promise.mapSeries(media, (photo) => {
                                    location.media.push(photo);
                                    return location.media;
                                })
                                    .then((media) => {
                                        location.updateAttributes({
                                            media: media
                                        })
                                            .then((newLocation) => {
                                                data.push(newLocation);
                                                return data;
                                            })
                                    })
                            })
                            .then(() => res.json(response.response(true, 'Successfully created location.', {data})))
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.json(response.error())
                    })
            } else {
                return res.json(response.response(true, 'Successfully created location.', {location: loc}))
            }
        })
});

router.post('/editLocation/:id', upload.array('media', 10), (req, res) => {
    const id = req.params.id;
});

router.post('/viewLocation/:id', (req, res) => {
    const id = req.params.id;

    return db.locations.findById(id)
        .then((location) => {
            location.dataValues.views += 1;
            location.updateAttributes({
                views: location.dataValues.views
            })
                .then((newLocation) => {
                    return res.json(response.response(true, 'Location has been viewed one time.', {data: newLocation}))
                })
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/rateLocation/:id', (req, res) => {
    const id = req.params.id;
    const rate = parseFloat(req.body.rate);
    let oldRate = 0;

    return db.locationRatings.findOne({
        where: {
            userID: req.user.id,
            locationID: id
        }
    })
        .then((rating) => {
            if (!rating) {
                db.locationRatings.create({
                    rateValue: rate,
                    userID: req.user.id,
                    locationID: id
                })
                    .then(() => {
                        return db.locations.findById(id)
                            .then((location) => {
                                let rateAvg = (location.rating * location.rateCount + rate) / (location.rateCount + 1);
                                location.updateAttributes({
                                    rating: rateAvg.toFixed(1),
                                    rateCount: location.rateCount + 1
                                })
                                    .then((newLocation) => {
                                        return res.json(response.response(true, 'Successfully added rating to location.', {newLocation}))
                                    })
                            })
                    })
            } else {
                return db.locationRatings.findOne({
                    where: {
                        userID: req.user.id,
                        locationID: id
                    }
                })
                    .then((rating) => {
                        oldRate = rating.rateValue;
                        rating.updateAttributes({
                            rateValue: rate
                        })
                            .then(() => {
                                return db.locations.findById(id)
                                    .then((location) => {
                                        const rateAvg = (location.rating * location.rateCount - oldRate + rate) / location.rateCount;
                                        location.updateAttributes({
                                            rating: rateAvg
                                        })
                                            .then((newLocation) => {
                                                return res.json(response.response(true, 'Successfully edited location rating.', {newLocation}))
                                            })
                                    })
                            })
                    })
            }
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/comment/:id', isLoggedIn, (req, res) => {
    const id = req.params.id;

    return db.locationComments.create({
        location_id: id,
        pet_id: req.user.selected_pet_id,
        comment: req.body.comment
    })
        .then((comment) => {
            return res.json(response.response(true, 'Location comment created.', {comment}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/listCommentsByLocation/:id', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;

    if (req.query.max) {
        limit = parseInt(req.query.max);
    }
    if (req.query.page) {
        page = parseInt(req.query.page);
    }

    const offset = limit * (page - 1);

    return db.locationComments.findAll({
        limit: limit,
        offset: offset,
        where: {
            location_id: req.params.id
        }
    })
        .then((comments) => {
            return res.json(response.response(true, 'Got all comments for current location.', {comments}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/updateRateLocation/:id', (req, res) => {
    const id = req.params.id;
    const newRate = parseFloat(req.body.rate);
    let oldRate = 0;

    return db.locationRatings.findOne({
        where: {
            userID: req.user.id,
            locationID: id
        }
    })
        .then((rating) => {
            if (rating) {
                oldRate = rating.rateValue;
                rating.updateAttributes({
                    rateValue: newRate
                })
                    .then(() => {
                        return db.locations.findById(id)
                            .then((location) => {
                                const rateAvg = (location.rating * location.rateCount - oldRate + newRate) / location.rateCount;
                                location.updateAttributes({
                                    rating: rateAvg
                                })
                                    .then((newLocation) => {
                                        return res.json(response.response(true, 'Successfully edited location rating.', {newLocation}))
                                    })
                            })
                    })
            } else {
                return res.json(response.response(false, 'Could not find rating.', null))
            }
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/getLocations', (req, res) => {
    let limit = 20;
    let page = 1;
    let where = {};

    if (req.query.max) {
        limit = parseInt(req.query.max);
    }
    if (req.query.max) {
        page = parseInt(req.query.page);
    }
    const offset = limit * (page - 1);

    if (req.query.location_type) {
        where.location_type_id = parseInt(req.query.location_type);
    }
    if (req.query.search) {
        where.$or = [{name: {[Op.iLike]: '%' + req.query.search + '%'}}, {description: {[Op.iLike]: '%' + req.query.search + '%'}}]
    }

    return db.locations.findAll({
        limit: limit,
        offset: offset,
        where: where,
        include: [
            {model: db.location_type, as: 'Type'}
        ]
    })
        .then((locations) => {
            return Promise.mapSeries(locations, (location) => {
                location.updateAttributes({
                    distance: geodist({lat: location.latitude, lon: location.longitude}, {lat: req.query.lat, lon: req.query.lon})
                });
            })
                .then((newLocations) => {
                    newLocations.sort(functions.sortByDistance);
                    return res.json(response.response(true, 'Successfully got all the locations according to the search criteria.', {newLocations}))
                });
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('Logged in.');
        return next();
    } else {
        res.redirect('/user/loginFail');
    }
}