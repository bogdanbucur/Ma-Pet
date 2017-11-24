const db = require('../models/index'),
    fse = require('fs-extra'),
    multer = require('multer'),
    upload = multer({dest: 'uploads/'}),
    functions = require('./helpers'),
    response = require('./responses'),
    request = require('request');

module.exports = {

    queryUser: (id) => {
        return db.user.findOne({
            where: {
                id: id
            },
            attributes: {
                exclude: ['password']
            }
        })
            .then((user) => {
                return user;
            })
    },

    queryUserPets: (id) => {
        return db.pets.findAll({
            where: {
                owner_id: id
            }
        })
            .then((pets) => {
                return pets;
            })
    },

    queryPet: (id) => {
        return db.pets.findById(id)
            .then((pet) => {
                return pet
            })
    },

    queryAllPets: () => {
        return db.pets.findAll({})
            .then((pets) => {
                return pets;
            })
    },

    profilePicture: (file, user) => {
        const tempFile = file.destination + file.filename,
            newFile = 'uploads/' + user.id + '/' + 'profile' + '/' + file.originalname + '_' + file.filename;

        return fse.copy(tempFile, newFile)
            .then(() => {
                return functions.queryUser(user.id)
                    .then((user) => {
                        user.updateAttributes({
                            profilePicture: newFile
                        });
                    })
            })
            .catch((err) => console.log('error'))
    },

    petPicture: (file, userID) => {
        const tempFile = file.destination + file.filename,
            newFile = 'uploads/' + userID + '/' + 'pets/' + file.filename + '_' + file.originalname;

        fse.copy(tempFile, newFile)
            .then(() => console.log('success'))
            .catch((err) => console.log('error', err));

        return newFile;
    },

    petUpload: (photo1, photo2) => {
        return upload.fields([{name: photo1, maxCount: 1}, {name: photo2, maxCount: 8}]);
    },

    returnPet: (pet) => {
        return {
            id: pet.id,
            name: pet.name,
            dob: pet.dob,
            gender: pet.gender,
            weight: pet.weight,
            breed: pet.breed,
            species: pet.species,
            placeOfBirth: pet.placeOfBirth,
            city: pet.city,
            description: pet.description,
            profilePicture: pet.profilePicture,
            coverPicture: pet.coverPicture
        }
    },

    sortByDistance: (a, b) => {
        if (a.distance > b.distance) {
            return 1;
        }
        if (a.distance < b.distance) {
            return -1;
        }
        return 0;
    },

    sortByCreated: (a, b) => {
        if (a.created_at > b.created_at) {
            return -1;
        }
        if (a.created_at < b.created_at) {
            return 1;
        }
        return 0;
    },

    adCreate: (req, userID, classNo, expires) => {
        return {
            active: true,
            userID: userID,
            title: req.title,
            description: req.description,
            type: req.type,
            class: req.class,
            classNo: classNo,
            period: req.period,
            price: req.price,
            currency: req.currency,
            contact_name: req.contact_name,
            contact_phone: req.contact_phone,
            contact_email: req.contact_email,
            contact_address: req.contact_address,
            contact_website: req.contact_website,
            media: [],
            expires_at: expires
        }
    },

    pushNotification: (token, messages) => {
        const sendNotification = function (data) {
            const headers = {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": "Basic MDNlMTNjYWMTgy"
            };

            const options = {
                host: "onesignal.com",
                port: 443,
                path: "/api/v1/notifications",
                method: "POST",
                headers: headers
            };

            const https = require('https');
            const req = https.request(options, function (res) {
                res.on('data', function (data) {
                    console.log("Response:");
                    console.log(JSON.parse(data));
                });
            });

            req.on('error', function (e) {
                console.log("ERROR:");
                console.log(e);
            });

            req.write(JSON.stringify(data));
            req.end();
        };

        const message = {
            app_id: "28ba44bd-7d70-47e8-97c5-1b8c7fb3ae6a",
            contents: {"en": messages},
            include_player_ids: [token]
        };

        sendNotification(message);
    }
};