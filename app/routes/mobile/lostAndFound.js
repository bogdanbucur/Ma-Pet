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

router.post('/createAnn', isLoggedIn, upload.array('media', 10), (req, res) => {

    if (!req.body.title) {return res.json(response.response(false, 'You must input a title.', null))}
    if (!req.body.description) {return res.json(response.response(false, 'You must input a description.', null))}
    if (!req.body.type) {return res.json(response.response(false, 'You must input a type.', null))}
    if (!req.body.contact_name) {return res.json(response.response(false, 'You must input a contact name.', null))}
    if (!req.body.contact_phone) {return res.json(response.response(false, 'You must input a contact phone', null))}

    return db.lostAndFound.create({
        userID: req.user.id,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        date: req.body.date,
        media: [],
        contact_name: req.body.contact_name,
        contact_email: req.body.contact_email,
        contact_phone: req.body.contact_phone,
        species_id: req.body.species_id,
        breed_id: req.body.breed_id
    })
        .then((ann) => {
            if (!req.files) {return ann.id;}
            let data = [].concat(req.files);
            return Promise.mapSeries(data, (photo) => {
                const tempFile = photo.destination + photo.filename,
                    newFile = 'uploads/lfAnnMedia/' + ann.id + '/' + photo.filename + '_' + photo.originalname;

                return fse.copy(tempFile, newFile)
                    .then(() => {
                        return db.mpMedia.create({
                            path: newFile,
                            type: 'photo',
                            mpAd_id: ann.id
                        });
                    })
                    .catch((err) => console.log('error'))
            })
                .then(() => ann.id)
                .catch((err) => {
                    console.log(err);
                    return res.json(response.error())
                })
        })
        .then((id) => {
            return db.lostAndFoundMedia.findAll({
                where: {
                    ann_id: id
                }
            })
                .then((media) => {
                    return db.lostAndFound.findById(id)
                        .then((ann) => {
                            ann.media.push(media);
                            ann.updateAttributes({
                                media: ann.media
                            })
                                .then((newAnn) => {
                                    if (media > []) {
                                        return res.json(response.response(true, 'Successfully created Lost and Found Announcement.', {newAnn}))
                                    } else {
                                        return res.json(response.response(true, 'Successfully created Lost and Found Announcement.', {ann}))
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

router.post('/editAnn/:id', isLoggedIn, upload.array('media', 10), (req, res) => {
    const id = req.params.id;

    return db.lostAndFound.findById(id)
        .then((ann) => {
            if (!ann) {return res.json(response.response(false, 'Lost and Found announcement not found.', null))}
            ann.updateAttributes({
                title: req.body.description,
                description: req.body.description,
                type: req.body.type,
                date: req.body.date,
                contact_name: req.body.contact_name,
                contact_phone: req.body.contact_phone,
                contact_email: req.body.contact_email,
                species_id: req.body.species_id,
                breed_id: req.body.breed_id
            })
                .then((newAnn) => {
                    if (!req.files) {return res.json(response.response(true, 'Lost and Found announcement has been edited.', {newAnn}))}
                    let data = [].concat(req.files);
                    return Promise.mapSeries(data, (photo) => {

                    })
                })
        })
});

router.get('/listAnn', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;
    let where = {};

    if (req.query.max) {limit = parseInt(req.query.max);}
    if (req.query.page) {page = parseInt(req.query.page);}
    if (req.query.type) {where.type = req.query.type;}
    if (req.query.breed_id) {where.breed_id = parseInt(req.query.breed_id);}
    if (req.query.species_id) {where.species_id = parseInt(req.query.species_id);}
    if (req.query.search) {where.$or = [{title: {[Op.iLike]: '%' + req.query.search + '%'}}, {description: {$like: '%' + req.query.search + '%'}}]}

    const offset = limit * (page - 1);

    return db.lostAndFound.findAll({
        limit: limit,
        offset: offset,
        where: where,
        include: [
            {model: db.user, as: 'UserAnn', attributes: {exclude: ['password']}}
        ]
    })
        .then((ann) => {
            return res.json(response.response(true, 'Found all Lost and Found announcements.', {ann}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.delete('/deleteAnn/:id', isLoggedIn, (req, res) => {
    return db.lostAndFound.findById(req.params.id)
        .then((ann) => {
            if (ann.userID !== req.user.id) {return res.json(response.response(false, 'You can only delete your own announcements.', null))}
            return ann.destroy()
                .then(() => res.json(response.response(true, 'Lost and Found announcement successfully deleted.', null)))
                .catch((err) => {
                    console.log(err);
                    return res.json(response.error())
                })
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