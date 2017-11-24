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
        };

router.get('/', isLoggedIn, asyncMiddleware(async (req, res, next) => {
    return res.render('sidebar/species', {
        title: 'Ma\'Pet - Species',
        layout: 'layout',
        user: JSON.stringify(req.user),
        noDelete: req.query.noDelete
    })
}));

router.get('/data', isLoggedIn, asyncMiddleware(async (req, res, next) => {
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
    if (req.query.datatable.query.Status) {
        where.active = parseInt(req.query.datatable.query.Status);
    }
    if (req.query.datatable.query.Type) {
        where.custom = parseInt(req.query.datatable.query.Type);
    }
    if (req.query.datatable.query.generalSearch) {
        where.$or = [{name: {[Op.iLike]: '%' + req.query.datatable.query.generalSearch + '%'}}]
    }
    const species2 = await db.species.findAll();

    const species = await db.species.findAll(
        {
            limit: limit,
            offset: offset,
            where: where,
            order: [['created_at', 'ASC']]
        }
    );

    return res.json({
        meta: {
            field: 'name',
            page: page,
            pages: Math.ceil(species2.length / 10),
            perpage: limit,
            sort: 'asc',
            total: species2.length
        },
        data: species
    })
}));

router.get('/create', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    return res.render('forms/create-species', {
        title: 'MaPet - Create Species',
        layout: 'layout',
        user: JSON.stringify(req.user)
    });
}));

router.post('/create-species', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    await db.species.create({
        name: req.body.species_name,
        active: 1,
        custom: 1
    });

    return res.redirect('/admin/species');
}));

router.get('/edit/:id', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const species = await db.species.findById(req.params.id);

    return res.render('forms/edit-species', {
        title: 'Ma\'Pet - Edit Species',
        layout: 'layout',
        user: JSON.stringify(req.user),
        name: species.name,
        id: species.id
    });
}));

router.post('/edit-species', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const species = await db.species.findById(req.body.species_id);

    await species.updateAttributes({
        name: req.body.species_name
    });

    return res.redirect('/admin/species');
}));

router.get('/delete/:id', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const breeds = await db.breeds.findAll({where: {specie_id: parseInt(req.params.id)}});

    if (breeds !== null) {
        return res.redirect('/admin/species?noDelete=1');
    } else {
        await db.species.destroy({where: {id: parseInt(req.params.id)}});

        return res.redirect('admin/species');
    }
}));

router.get('/breeds/:id', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    return res.render('sidebar/breeds', {
        title: 'Ma\'Pet - Breeds',
        layout: 'layout',
        user: JSON.stringify(req.user),
        specie_id: req.params.id
    })
}));

router.get('/breeds/:id/data', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    let limit = 10;
    let page = 1;
    if (req.query.datatable.pagination.perpage) {
        limit = parseInt(req.query.datatable.pagination.perpage);
    }
    if (req.query.datatable.pagination.page) {
        page = parseInt(req.query.datatable.pagination.page);
    }

    let offset = limit * (page - 1);

    let where = {specie_id: req.params.id};
    if (req.query.datatable.query.Status) {
        where.active = parseInt(req.query.datatable.query.Status);
    }
    if (req.query.datatable.query.Type) {
        where.custom = parseInt(req.query.datatable.query.Type);
    }
    if (req.query.datatable.query.generalSearch) {
        where.$or = [{name: {[Op.iLike]: '%' + req.query.datatable.query.generalSearch + '%'}}]
    }
    const breeds2 = await db.breeds.findAll({where:{specie_id: req.params.id}});

    const breeds = await db.breeds.findAll(
        {
            limit: limit,
            offset: offset,
            where: where,
            order: [['created_at', 'ASC']]
        }
    );

    return res.json({
        meta: {
            field: 'name',
            page: page,
            pages: Math.ceil(breeds2.length / 10),
            perpage: limit,
            sort: 'asc',
            total: breeds2.length
        },
        data: breeds
    })
}));

router.get('/breeds/create/:id', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    return res.render('forms/create-breed', {
        title: 'Ma\'Pet - Create Breed',
        layout: 'layout',
        user: JSON.stringify(req.user),
        species_id: req.params.id
    })
}));

router.post('/breeds/create-breed', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    await db.breeds.create({
        name: req.body.breed_name,
        specie_id: req.body.species_id,
        active: 1,
        custom: 1
    });

    return res.redirect('/admin/species/breeds/' + req.body.species_id);
}));

router.get('/breeds/activate/:breed_id/:species_id', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const breed = await db.breeds.findById(parseInt(req.params.breed_id));

    await breed.updateAttributes({
        active: 1
    });

    return res.redirect('/admin/species/breeds/' + req.params.species_id);
}));

router.get('/breeds/edit/:breed_id/:species_id', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const breed = await db.breeds.findById(parseInt(req.params.breed_id));

    return res.render('forms/edit-breed', {
        title: 'Ma\'Pet - Edit Breed',
        layout: 'layout',
        user: JSON.stringify(req.user),
        breed_name: breed.name,
        breed_id: breed.id,
        species_id: breed.specie_id
    });
}));

router.post('/breeds/edit-breed', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const breed = await db.breeds.findById(parseInt(req.body.breed_id));

    await breed.updateAttributes({
        name: req.body.breed_name
    });

    return res.redirect('/admin/species/breeds/' + parseInt(req.body.species_id));
}));

router.get('/breeds/delete/:breed_id/:species_id', isLoggedIn, asyncMiddleware(async(req, res, next) => {
    const pets = await db.pets.findAll({where: {breed_id: parseInt(req.params.breed_id)}});

    console.log(pets);

    if (pets.length > 0) {
        return res.redirect('/admin/species/breeds/' + parseInt(req.params.species_id) + '?noDelete=1');
    } else {
        await db.breeds.destroy({where: {id: parseInt(req.params.breed_id)}});

        return res.redirect('/admin/species/breeds/' + parseInt(req.params.species_id));
    }
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