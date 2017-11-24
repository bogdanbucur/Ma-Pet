'use strict';

const express = require('express'),
    router = express.Router(),
    db = require('../../../models/index'),
    functions = require('../../helpers'),
    response = require('../../responses'),
    moment = require('moment'),
    Sequelize = require('sequelize'),
    Op = Sequelize.Op,
    multer = require('multer'),
    cors = require('cors'),
    fse = require('fs-extra'),
    upload = multer({dest: 'uploads/'});

router.post('/settings', (req, res) => {
    return db.mpSettings.create({
        offerType: req.body.offerType,
        offerPeriod: req.body.offerPeriod,
        credits: req.body.credits
    })
        .then((settings) => {
            return res.json(response.response(true, 'Create MP Settings.', {settings}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/createAd', isLoggedIn, upload.array('media', 10), (req, res) => {
    const userID = req.user.id;
    let classNo = 0;
    let expires = new Date();

    switch (req.body.class) {
        case 'bronze':
            classNo = 1;
            break;
        case 'silver':
            classNo = 2;
            break;
        case 'gold':
            classNo = 3;
            break;
    }
    if (!req.body.type) {
        return res.json(response.response(false, 'You must input a type.', null))
    }
    if (!req.body.class) {
        return res.json(response.response(false, 'You must input a class', null))
    }
    if (!req.body.period) {
        return res.json(response.response(false, 'You must input a class.', null))
    } else {
        switch (req.body.period) {
            case '1week':
                expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case '2weeks':
                expires.setTime(expires.getTime() + 14 * 24 * 60 * 60 * 1000);
                break;
            case '1month':
                expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                return res.json(response.response(false, 'Please input a valid period.', null))
        }
    }
    if (!req.body.contact_name) {
        return res.json(response.response(false, 'You must input a contact name.', null))
    }
    if (!req.body.contact_phone) {
        return res.json(response.response(false, 'You must input a contact phone number.', null))
    }
    if (!req.body.contact_email) {
        return res.json(response.response(false, 'You must input a contact email.', null))
    }

    return db.mpSettings.findOne({
        where: {
            offerType: req.body.class,
            offerPeriod: req.body.period
        }
    })
        .then((settings) => {
            if (req.user.credits >= settings.credits) {
                return db.user.findById(req.user.id)
                    .then((user) => {
                        user.credits -= settings.credits;
                        user.updateAttributes({
                            credits: user.credits
                        });
                        return db.mpAds.create(functions.adCreate(req.body, userID, classNo, expires))
                            .then((ad) => {
                                if (req.files.length <= 0) {
                                    return ad;
                                }
                                let data = [].concat(req.files);
                                return Promise.mapSeries(data, (photo) => {
                                    const tempFile = photo.destination + photo.filename,
                                        newFile = 'uploads/mpAdsMedia/' + ad.id + '/' + photo.filename + '_' + photo.originalname;

                                    return fse.copy(tempFile, newFile)
                                        .then(() => {
                                            return db.mpMedia.create({
                                                path: newFile,
                                                type: 'photo',
                                                mpAd_id: ad.id
                                            });
                                        })
                                        .catch((err) => console.log('error'))
                                })
                                    .then(() => {
                                        return ad;
                                    })
                            })
                            .then((ad) => {
                                if (req.files.length > 0) {
                                    return db.mpAds.findOne({
                                        where: {
                                            id: ad.id
                                        },
                                        include: [
                                            {model: db.user, as: 'User'}
                                        ]
                                    })
                                        .then((Ad) => {
                                            let mpAd = [];
                                            return db.mpMedia.findAll({
                                                where: {
                                                    mpAd_id: Ad.id
                                                }
                                            })
                                                .then((media) => {
                                                    return Promise.mapSeries(media, (photo) => {
                                                        Ad.media.push(photo);

                                                        return Ad.media
                                                    })
                                                        .then((media) => {
                                                            return Ad.updateAttributes({
                                                                media: media
                                                            })
                                                                .then((newAd) => {
                                                                    mpAd.push(newAd);
                                                                    return mpAd
                                                                })
                                                        })
                                                })
                                                .then(() => {
                                                    return res.json(response.response(true, 'Successfully created ad...', {mpAd}))
                                                })
                                                .catch((err) => {
                                                    console.log('err');
                                                    console.log(err);
                                                    return res.json(response.error())
                                                })
                                        })
                                        .catch((err) => {
                                            console.log(err);
                                            return res.json(response.error())
                                        })
                                } else {
                                    return res.json(response.response(true, 'Successfully created ad.', {ad}))
                                }
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
            } else {
                return res.json(response.response(false, 'User does not have enough credits to create ad.', null))
            }
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/editAd/:id', isLoggedIn, upload.array('media', 10), (req, res) => {
    const id = req.params.id;

    return db.mpAds.findById(id)
        .then((ad) => {
            if (req.files <= []) {
                ad.updateAttributes({
                    title: req.body.title,
                    description: req.body.description,
                    type: req.body.type,
                    price: req.body.price,
                    currency: req.body.currency,
                    contact_name: req.body.contact_name,
                    contact_phone: req.body.contact_phone,
                    contact_email: req.body.contact_email,
                    contact_address: req.body.contact_address,
                    contact_website: req.body.contact_website
                })
                    .then((newAd) => {
                        return res.json(response.response(true, 'Successfully edited ad.', {newAd}))
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.json(response.error())
                    })
            } else {
                let data = [].concat(req.files);
                return Promise.mapSeries(data, (photo) => {
                    const tempFile = photo.destination + photo.filename,
                        newFile = 'uploads/mpAdsMedia/' + ad.id + '/' + photo.filename + '_' + photo.originalname;

                    return fse.copy(tempFile, newFile)
                        .then(() => {
                            return db.mpMedia.create({
                                path: newFile,
                                type: 'photo',
                                mpAd_id: ad.id
                            });
                        })
                        .catch((err) => console.log('error'))
                })
                    .then(() => {
                        return db.mpMedia.findAll({
                            where: {
                                mpAd_id: ad.id
                            }
                        })
                            .then((media) => {
                                ad.media.push(media);
                                ad.updateAttributes({
                                    title: req.body.title,
                                    description: req.body.description,
                                    type: req.body.type,
                                    price: req.body.price,
                                    currency: req.body.currency,
                                    contact_name: req.body.contact_name,
                                    contact_phone: req.body.contact_phone,
                                    contact_email: req.body.contact_email,
                                    contact_address: req.body.contact_address,
                                    contact_website: req.body.contact_website,
                                    media: ad.media
                                })
                                    .then((newAd) => {
                                        return res.json(response.response(true, 'Successfully edited ad.', {newAd}))
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
            }
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/listAds', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;
    let where = {expires_at: {[Op.gt]: new Date()}, active: true};

    if (req.body.page) {
        page = parseInt(req.query.page);
    }
    if (req.body.max) {
        limit = parseInt(req.query.max);
    }
    if (req.body.type) {
        where.type = req.query.type;
    }
    if (req.body.search) {
        where.$or = [{title: {[Op.iLike]: '%' + req.query.search + '%'}}, {description: {$like: '%' + req.query.search + '%'}}]
    }

    let offset = limit * (page - 1);
    return db.mpAds.findAll({
        limit: limit,
        offset: offset,
        where: where,
        order: [
            ['classNo', 'DESC'],
            ['created_at', 'DESC']
        ]
    })
        .then((ads) => {
            return res.json(response.response(true, 'Successfully got all ads.', {ads}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/myAds', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;
    let where = {userID: req.user.id};

    if (req.body.page) {
        page = parseInt(req.query.page);
    }
    if (req.body.max) {
        limit = parseInt(req.query.max);
    }
    if (req.body.type) {
        where.type = req.query.type;
    }

    let offset = limit * (page - 1);
    return db.mpAds.findAll({
        limit: limit,
        offset: offset,
        where: where,
        order: [
            ['created_at', 'DESC']
        ]
    })
        .then((ads) => {
            return res.json(response.response(true, 'Successfully got all ads.', {ads}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/changeAdState/:id', isLoggedIn, (req, res) => {
    const id = req.params.id;

    return db.mpAds.findById(id)
        .then((ad) => {
            if (ad.userID !== req.user.id) {
                return res.json(response.response(false, 'You can only suspend your ads.', null))
            } else if (ad.active === false) {
                ad.updateAttributes({
                    active: true
                })
                    .then((newAd) => {
                        return res.json(response.response(true, 'Ad has been resumed.', {newAd}))
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.json(response.error())
                    })
            } else {
                ad.updateAttributes({
                    active: false
                })
                    .then((newAd) => {
                        return res.json(response.response(true, 'Ad has been suspended.', {newAd}))
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

router.delete('/deleteAd/:id', isLoggedIn, (req, res) => {
    return db.mpAds.findById(req.params.id)
        .then((ad) => {
            if (ad.userID !== req.user.id) {
                return res.json(response.response(false, 'You can only delete your own ads.', null))
            }
            return ad.destroy()
                .then(() => res.json(response.response(true, 'Ad has been successfully deleted.', null)))
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

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('Logged in.');
        return next();
    } else {
        res.redirect('/user/loginFail');
    }
}