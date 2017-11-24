'use strict';

const express = require('express'),
    router = express.Router(),
    db = require('../../../models/index'),
    Sequelize = require('sequelize'),
    Op = Sequelize.Op,
    functions = require('../../helpers'),
    response = require('../../responses'),
    moment = require('moment');

router.post('/createNote', isLoggedIn, (req, res) => {
    if (req.user.selected_pet_id === null) {return res.json(response.response(false, 'You need to have a pet selected.', null))}
    if (!req.body.content) {return res.json(response.response(false, 'You must input some content.', null))}

    return db.notes.create({
        pet_id: req.user.selected_pet_id,
        content: req.body.content,
        date: req.body.date,
        alarm: req.body.alarm,
        repeat: req.body.repeat
    })
        .then((note) => {
            return res.json(response.response(true, 'Yoo. Check this out. We got a note up in here.', {note}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/editNote/:id', isLoggedIn, (req, res) => {
    return db.notes.findById(req.params.id)
        .then((note) => {
            if (note.pet_id !== req.user.selected_pet_id) {return res.json(response.response(false, 'Nice try.', null))}
            note.updateAttributes({
                content: req.body.content,
                date: req.body.date,
                alarm: req.body.alarm,
                repeat: req.body.repeat
            })
                .then((newNote) => {
                    return res.json(response.response(true, 'Someone messed up his note, huh?', {newNote}))
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

router.delete('/deleteNote/:id', isLoggedIn, (req, res) => {
    return db.notes.findById(req.params.id)
        .then((note) => {
            if (note.pet_id !== req.user.selected_pet_id) {return res.json(response.response(false, 'Don\'t be tryin\' deleting no notes which ain\'it yours.'))}
            return note.destroy()
                .then(() => res.json(response.response(true, 'Note\'s been buuuurned.', null)))
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

router.get('/listNotes', isLoggedIn, (req, res) => {
    let limit = 20;
    let page = 1;

    if (req.query.max) {limit = parseInt(req.query.max);}
    if (req.query.page) {page = parseInt(req.query.page)}

    const offset = limit * (page - 1);

    return db.notes.findAll({
        limit: limit,
        offset: offset,
        where: {
            pet_id: req.user.selected_pet_id
        }
    })
        .then((notes) => res.json(response.response(true, 'Here them all.', {notes})))
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