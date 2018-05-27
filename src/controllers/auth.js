"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const UserModel = require('../models/user');
const SchoolModel = require('../models/school');


// if user is found and password is valid
// create a token with the username and the user type (e.g. student or teacher)
function createToken(user) {
    return jwt.sign({id: user._id, username: user.username, type: user.type}, config.JwtSecret, {
        expiresIn: 86400 // expires in 24 hours
    });
}

const login = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'password')) return res.status(400).json({
        error: 'Bad Request',
        message: 'The request body must contain a password property'
    });

    if (!Object.prototype.hasOwnProperty.call(req.body, 'username')) return res.status(400).json({
        error: 'Bad Request',
        message: 'The request body must contain a username property'
    });

    UserModel.findOne({username: req.body.username}).exec()
        .then(user => {

            // check if the password is valid
            const isPasswordValid = bcrypt.compareSync(req.body.password, user.password);
            if (!isPasswordValid) return res.status(401).send({token: null});

            // if user is found and password is valid
            const token = createToken(user);
            res.status(200).json({token: token});
        })
        .catch(error => res.status(404).json({
            error: 'User Not Found',
            message: error.message
        }));

};

/**
 * workflow:
 * 1) check if user is teacher, if so, look for school license code
 * 2) if license code is valid, create user
 * 3) if user name is already taken -> error from db
 * 4) if user is created, user._id is also added to the school`s teachers array
 * 5) the user is now logged in as a cookie will be returned
 * @param req
 * @param res
 * @returns {*}
 */
const register = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'password')) return res.status(400).json({
        error: 'Bad Request',
        message: 'The request body must contain a password property'
    });

    if (!Object.prototype.hasOwnProperty.call(req.body, 'username')) return res.status(400).json({
        error: 'Bad Request',
        message: 'The request body must contain a username property'
    });

    if (!Object.prototype.hasOwnProperty.call(req.body, 'type')) return res.status(400).json({
        error: 'Bad Request',
        message: 'The request body must contain a type property'
    });

    // check if user is teacher
    if (req.body.type === 'Teacher') {
        // insert teacher
        // now we have to check the licence code
        if (!Object.prototype.hasOwnProperty.call(req.body, 'license')) return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a license property'
        });

        SchoolModel.findOne({license: req.body.license}).exec()
            .then(school => {

                if (!school) return res.status(404).json({
                    error: 'Not Found',
                    message: `License Code not found`
                });

                delete req.body.license;
                const user = Object.assign(req.body, {password: bcrypt.hashSync(req.body.password, 8)});

                UserModel.create(user)
                    .then(user => {

                        // add user to the teachers array of the school
                        school.teachers.push(user._id);
                        school.save(function (err, doc, numbersAffected) {
                            if (err) {
                                res.status(500).json({
                                    error: 'Internal server error',
                                    message: error.message
                                })
                            }

                            // if user is found and password is valid
                            const token = createToken(user);

                            res.status(200).json({token: token});
                        });
                    })
                    .catch(error => {
                        if (error.code === 11000) {
                            res.status(400).json({
                                error: 'User exists',
                                message: error.message
                            })
                        }
                        else {
                            res.status(500).json({
                                error: 'Internal server error',
                                message: error.message
                            })
                        }
                    });
            })
            .catch(error => res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            }));
    } else {
        // insert user
        const user = Object.assign(req.body, {password: bcrypt.hashSync(req.body.password, 8)});

        UserModel.create(user)
            .then(user => {
                // if user is found and password is valid
                const token = createToken(user);

                res.status(200).json({token: token});
            })
            .catch(error => {
                if (error.code === 11000) {
                    res.status(400).json({
                        error: 'User exists',
                        message: error.message
                    })
                }
                else {
                    res.status(500).json({
                        error: 'Internal server error',
                        message: error.message
                    })
                }
            });
    }
};


const me = (req, res) => {
    UserModel.findById(req.userId).select('username').exec()
        .then(user => {

            if (!user) return res.status(404).json({
                error: 'Not Found',
                message: `User not found`
            });

            res.status(200).json(user)
        })
        .catch(error => res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        }));
};

const logout = (req, res) => {
    res.status(200).send({token: null});
};

module.exports = {
    login,
    register,
    logout,
    me
};