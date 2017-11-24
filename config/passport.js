const bCrypt = require('bcrypt-nodejs'),
    db = require('../models/index'),
    LocalStrategy = require('passport-local').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    configAuth = require('./auth'),
    response = require('../app/responses');

module.exports = function (passport) {

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        db.user.findById(id).then(function (user) {
            if (user) {
                done(null, user.get());
            } else {
                done(user.errors, null);
            }
        });
    });

    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, (req, email, password, done) => {
        let where = {
            email: email,
            status: 'Active'
        };
        switch (req.body.type) {
            case 'user':
                where.type = 'user';
                break;
            case 'admin':
                where.type = 'admin';
                break;
        }
        return db.user.findOne({
            where: where
        })
            .then((user) => {

                function isValidPassword(userpass, password) {
                    return bCrypt.compareSync(password, userpass);
                }

                if (!user) {
                    return done(null, false, {
                        message: 'Email does not exist'
                    });
                }

                if (!isValidPassword(user.password, password)) {
                    return done(null, false, {
                        message: 'Incorrect password.'
                    });
                }

                const userinfo = user.get();
                return done(null, userinfo);
            })
    }));

    passport.use(new FacebookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL
        },
        function (token, refreshToken, profile, done) {
            process.nextTick(function () {
                return User.findOne({
                    where: {
                        email: profile.emails[0].value,
                        status: 'Active'
                    }
                })
                    .then((user) => {
                        if (user) {
                            user.updateAttributes({
                                facebook_id: profile.id
                            })
                                .then(() => {
                                    return done(null, user);
                                })
                        } else {
                            User.create({
                                facebook_id: profile.id,
                                firstName: profile.name.givenName,
                                lastName: profile.name.familyName,
                                email: profile.emails[0].value
                            })
                                .then((newUser) => {
                                    if (!newUser) {
                                        return done(null, false);
                                    }
                                    if (newUser) {
                                        return done(null, newUser);
                                    }
                                });
                        }

                    });
            });

        }));
};