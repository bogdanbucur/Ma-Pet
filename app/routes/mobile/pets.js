'use strict';
const express = require('express'),
    router = express.Router(),
    db = require('../../../models/index'),
    functions = require('../../helpers'),
    response = require('../../responses'),
    moment = require('moment'),
    multer = require('multer'),
    upload = multer({dest: 'uploads/'}),
    asyncMiddleware = fn =>
        (req, res, next) => {
            Promise.resolve(fn(req, res, next))
                .catch(next);
        },
    fs = require('fs');

router.post('/createPet', functions.petUpload('profilePicture', 'coverPicture'), (req, res) => {
    let date = null,
        profile = null,
        cover = null;

    if (req.body.dob) {
        date = moment(req.body.dob, 'DD-MM-YYYY').format('YYYY-MM-DD');
    }

    if (req.files['profilePicture']) {
        const profilePicture = req.files['profilePicture'][0];
        profile = functions.petPicture(profilePicture, req.user.id);
    }

    if (req.files['coverPicture']) {
        const coverPicture = req.files['coverPicture'][0];
        cover = functions.petPicture(coverPicture, req.user.id);
    }

    return db.pets.create({
        owner_id: req.user.id,
        name: req.body.name,
        dob: date,
        gender: req.body.gender,
        weight: req.body.weight,
        breed_id: parseInt(req.body.breed_id),
        specie_id: parseInt(req.body.specie_id),
        placeOfBirth: req.body.placeOfBirth,
        city: req.body.city,
        description: req.body.description,
        profilePicture: profile,
        coverPicture: cover
    })
        .then((pet) => {
            return res.json(response.response(true, 'Successfully created pet', {pet: pet}))
        })
});

router.post('/updatePet/:id', functions.petUpload('profilePicture', 'coverPicture'), (req, res) => {
    const petID = req.params.id;

    return db.pets.findOne({
        where: {
            id: petID
        }
    })
        .then((pet) => {
            let date = pet.dob,
                profile = pet.profilePicture,
                cover = pet.coverPicture;

            if (req.body.dob) {
                date = moment(req.body.dob, 'DD-MM-YYYY').format('YYYY-MM-DD');
            }

            if (req.files['profilePicture']) {
                const profilePicture = req.files['profilePicture'][0];
                profile = functions.petPicture(profilePicture, req.user.id);
            }

            if (req.files['coverPicture']) {
                const coverPicture = req.files['coverPicture'][0];
                cover = functions.petPicture(coverPicture, req.user.id);
            }

            pet.updateAttributes({
                name: req.body.name,
                dob: date,
                gender: req.body.gender,
                weight: req.body.weight,
                breed: req.body.breed,
                species: req.body.species,
                placeOfBirth: req.body.placeOfBirth,
                city: req.body.city,
                description: req.body.description,
                profilePicture: profile,
                coverPicture: cover
            })
                .then((newPet) => {
                    return res.json(response.response(true, 'Successfully updated pet.', {pet: newPet}))
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

router.get('/petList/:user', isLoggedIn, (req, res) => {
    const userID = req.params.user;

    return functions.queryUserPets(userID)
        .then((pets) => {
            return res.json(response.response(true, 'Successfully got all pets of user.', {pets: pets}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.delete('/deletePet/:pet', isLoggedIn, (req, res) => {
    const petID = req.params.pet;

    return db.pets.findOne({
        where: {
            id: petID
        }
    })
        .then((pet) => {
            return pet.destroy()
                .then(() => {
                    return res.json(response.response(true, 'Successfully deleted pet.', null))
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

router.post('/friendRequest/:receiver', (req, res) => {
    const receiver = req.params.receiver;

    return db.petRelation.findAll({
        where: {
            $or: [{
                sender_id: req.user.selected_pet_id,
                receiver_id: receiver,
                $or: [{
                    status: 'Pending'
                }, {
                    status: 'Accepted'
                }]
            }, {
                sender_id: receiver,
                receiver_id: req.user.selected_pet_id,
                $or: [{
                    status: 'Pending'
                }, {
                    status: 'Accepted'
                }]
            }]
        }
    })
        .then((relation) => {
            console.log(relation);
            if (relation > []) {
                return res.json(response.response(false, 'There is already a friendship request in \'Pending\' status between these two pets.', {relation: relation}))
            } else {
                db.petRelation.create({
                    sender_id: req.user.selected_pet_id,
                    receiver_id: receiver,
                    status: 'Pending'
                })
                    .then((Relation) => {
                        return db.petRelation.findOne({
                            where: {
                                id: Relation.id
                            },
                            include: [
                                {model: db.pets, as: 'Sender', targetKey: 'sender_id'},
                                {model: db.pets, as: 'Receiver', targetKey: 'receiver_id'}
                            ]
                        })
                            .then((theRelation) => {
                                return res.json(response.response(true, 'Successfully sent friend request.', {relation: theRelation}))
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

router.post('/denyFriendRequest/:pet', (req, res) => {
    const petId = req.params.pet;

    return db.petRelation.findOne({
        where: {
            $or: [{
                sender_id: req.user.selected_pet_id,
                receiver_id: petId,
                status: 'Pending'
            }, {
                sender_id: petId,
                receiver_id: req.user.selected_pet_id,
                status: 'Pending'
            }]
        }
    })
        .then((relation) => {
            return relation.destroy({force: true})
                .then(() => res.json(response.response(true, 'Friendship request has been denied.', null)))
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

router.post('/acceptFriendRequest/:pet', (req, res) => {
    const petID = req.params.pet;

    return db.petRelation.findOne({
        where: {
            $or: [{
                sender_id: req.user.selected_pet_id,
                receiver_id: petID,
                status: 'Pending'
            }, {
                sender_id: petID,
                receiver_id: req.user.selected_pet_id,
                status: 'Pending'
            }]
        },
        include: [
            {model: db.pets, as: 'Sender', targetKey: 'sender_id'},
            {model: db.pets, as: 'Receiver', targetKey: 'receiver_id'}
        ]
    })
        .then((relation) => {
            relation.updateAttributes({
                status: 'Accepted'
            })
                .then((newRelation) => {
                    return res.json(response.response(true, 'Friendship Request has been accepted', {relation: newRelation}))
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

router.post('/cancelFriendship/:pet', (req, res) => {
    const petID = req.params.pet;

    return db.petRelation.findOne({
        where: {
            $or: [{
                sender_id: req.user.selected_pet_id,
                receiver_id: petID,
                status: 'Accepted'
            }, {
                sender_id: petID,
                receiver_id: req.user.selected_pet_id,
                status: 'Accepted'
            }]
        }
    })
        .then((relation) => {
            return relation.destroy({force: true})
                .then(() => res.json(response.response(true, 'Friendship has been deleted', null)))
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

router.get('/friendshipStatus/:pet', (req, res) => {
    const petID = req.params.pet;

    return db.petRelation.findOne({
        where: {
            $or: [{
                sender_id: petID,
                receiver_id: req.user.selected_pet_id,
                $or: [{
                    status: 'Pending'
                }, {
                    status: 'Accepted'
                }]
            }, {
                sender_id: req.user.selected_pet_id,
                receiver_id: petID,
                $or: [{
                    status: 'Pending'
                }, {
                    status: 'Accepted'
                }]
            }]
        }
    })
        .then((relation) => {
            return res.json(response.response(true, 'Successfully got friendship.', {friendship: relation}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.get('/friendsList/:pet', (req, res) => {
    const pet = req.params.pet;


    return db.petRelation.findAll({
        where: {
            $or: [{
                sender_id: pet,
                status: 'Accepted'
            }, {
                receiver_id: pet,
                status: 'Accepted'
            }]
        },
        include: [
            {model: db.pets, as: 'Sender', targetKey: 'sender_id'},
            {model: db.pets, as: 'Receiver', targetKey: 'receiver_id'}
        ]
    })
        .then((relations) => {
            return res.json(response.response(true, 'Successfully got all pet relations.', {relations: relations}))
        })
        .catch((err) => {
            console.log(err);
            return res.json(response.error())
        })
});

router.post('/selectPet/:pet', (req, res) => {
    const petID = req.params.pet;

    return functions.queryUser(req.user.id)
        .then((user) => {
            user.updateAttributes({
                selected_pet_id: petID
            });
            return functions.queryPet(petID)
                .then((pet) => {
                    return res.json(response.response(true, 'Successfully selected pet.', {pet: pet}))
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

router.post('/createSpecie', asyncMiddleware(async(req, res, next) => {
    const specie = await db.species.create({
        name: req.body.name,
        custom: 1,
        active: 1
    });

    return res.json(response.response(true, 'Created specie', {specie}));
}));

router.post('/createBreed', asyncMiddleware(async(req, res, next) => {
    const breed = await db.breeds.create({
        name: req.body.name,
        specie_id: parseInt(req.body.specie_id),
        active: 1,
        custom: 1
    });

    return res.json(response.response(true, 'Created breed.', {breed}));
}));

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        console.log('Logged in.');
        return next();
    } else {
        return res.json(response.response(false, 'User is not logged in.', null))
    }
}

function isNotLoggedIn(req, res, next) {
    if (req.isUnauthenticated()) {
        console.log('Not logged in.');
        return next();
    } else {
        res.redirect('/user/checkLogin');
    }
}

module.exports = router;