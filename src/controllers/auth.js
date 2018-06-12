"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../config');
const UserModel = require('../models/user');
const SchoolModel = require('../models/school');
const ClassModel = require('../models/class');


// creates a token with the id, the username and the user type (e.g. student or teacher)
function createToken(user, schoolname) {
    return jwt.sign({
        id: user._id,
        username: user.username,
        type: user.type,
        schoolname: schoolname
    }, config.JwtSecret, {
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

    let currentUser;

    UserModel.findOne({username: req.body.username}).exec()
        .then(user => {
            if (!user) throw new Error("User not found");
            // check if the password is valid
            const isPasswordValid = bcrypt.compareSync(req.body.password, user.password);
            if (!isPasswordValid) return res.status(401).send({token: null});
            currentUser = user;
            return SchoolModel.findOne({users: mongoose.Types.ObjectId(user._id)});

        })

        .then(school => {
            if (!school) throw new Error("School not found");
            const token = createToken(currentUser, school.name);
            res.status(200).json({token: token});
        })


        .catch((error) => {
            if (error.message === "User not found") {
                res.status(404).json(
                    {
                        error: 'User Not Found',
                        message: 'The user was not found.'
                    }
                )
            } else if (error.message === "School not found") {
                res.status(404).json(
                    {
                        error: 'School Not Found',
                        message: 'The school was not found.'
                    }
                )
            } else {
                res.status(500).json(
                    {
                        error: 'Internal Error',
                        message: 'An internal error occurred'
                    }
                )
            }
        });
};

const changePassword = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'password')) return res.status(400).json({
        error: 'Bad Request',
        message: 'The request body must contain a password property'
    });

    UserModel.findOneAndUpdate({_id: req.userId}, {password: bcrypt.hashSync(req.body.password, 8)}).exec()
        .catch(() => res.status(404).json({
            error: 'User Not Found',
            message: 'The user was not found.'
        }));
};

/**
 * workflow:
 * 1) if user name is already taken -> error from db
 * 2) check if user is teacher, if so, look for school license code
 * 3) if license code and/or school name valid, create user
 * 4) if user is created, user._id is also added to the school`s users array
 * 5) the user is now logged in as a cookie will be returned
 * @param req
 * @param res
 * @returns {*}
 */
const register = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'password'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a password property'
        });

    if (!Object.prototype.hasOwnProperty.call(req.body, 'username'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a username property'
        });

    if (!Object.prototype.hasOwnProperty.call(req.body, 'type'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a type property'
        });

    if (!Object.prototype.hasOwnProperty.call(req.body, 'schoolname'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a schoolname property'
        });

    let mySchool;
    let myUser;

    // check if user is teacher
    if (req.body.type === 'Teacher') {
        // insert teacher
        // now we have to check the licence code
        if (!Object.prototype.hasOwnProperty.call(req.body, 'license')) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'The request body must contain a license property'
            });

        }

        UserModel.findOne({username: req.body.username}).exec()
            .then(user => {
                if (user) throw new Error("User exists");
                return SchoolModel.findOne({license: req.body.license, name: req.body.schoolname}).exec()
            })

            .then(school => {

                if (!school) throw new Error("License Code not found");

                mySchool = school;

                delete req.body.license;
                delete req.body.schoolname;
                const user = Object.assign(req.body, {password: bcrypt.hashSync(req.body.password, 8)});

                return UserModel.create(user);
            })

            .then(user => {
                myUser = user;
                // add user to the teachers array of the school
                mySchool.users.push(user._id);
                mySchool.save();
            })

            .then(() => {
                // if user is found and password is valid
                const token = createToken(myUser, mySchool.name);
                res.status(200).json({token: token});
            })

            .catch(err => {
                if (err.message === "School not found") {
                    return res.status(404).json({
                        error: 'School not found',
                        message: `School not found`
                    });
                } else if (err.message === "Internal server error") {
                    return res.status(500).json({
                        error: 'Internal server error',
                        message: err.message
                    })
                } else if (err.message === "User exists") {
                    return res.status(400).json({
                        error: 'User exists',
                        message: err.message
                    })
                } else if (err.message === `License Code not found`) {
                    return res.status(404).json({
                        error: 'Not Found',
                        message: `License Code not found`
                    });
                } else {
                    return res.status(400).json({
                        error: 'Something went wrong!',
                        message: err + err.message
                    })
                }
            });
    } else {
        // user is of type student : register student
        UserModel.findOne({username: req.body.username}).exec()
            .then(user => {
                if (user) throw new Error("User exists");
                return SchoolModel.findOne({name: req.body.schoolname}).exec()
            })

            .then(school => {

                if (!school) throw new Error("School not found");

                mySchool = school;

                delete req.body.license;
                delete req.body.schoolname;
                const user = Object.assign(req.body, {password: bcrypt.hashSync(req.body.password, 8)});

                return UserModel.create(user);
            })

            .then(user => {
                myUser = user;
                // add user to the teachers array of the school
                mySchool.users.push(user._id);
                return mySchool.save();
            })

            .then(() => {
                // if user is found and password is valid
                const token = createToken(myUser, mySchool.name);
                res.status(200).json({token: token});
            })

            .catch(err => {
                if (err.message === "School not found") {
                    return res.status(404).json({
                        error: 'School not found',
                        message: `School not found`
                    });
                } else if (err.message === "Internal server error") {
                    return res.status(500).json({
                        error: 'Internal server error',
                        message: err.message
                    })
                } else if (err.message === "User exists") {
                    return res.status(400).json({
                        error: 'User exists',
                        message: err.message
                    })
                } else {
                    return res.status(400).json({
                        error: 'Something went wrong!',
                        message: err.message
                    })
                }
            });
    }
};


const me = (req, res) => {
    UserModel.findById(req.body.userId).select('username').exec()
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

const listMembership = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.params, 'id'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a class id property'
        });

    if (!Object.prototype.hasOwnProperty.call(req, 'userId'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a user id property'
        });

    const userId = req.userId;
    const classId = req.params.id;

    UserModel.findById(userId).select('username classes').exec()
        .then(user => {

            if (!user) return res.status(404).json({
                error: 'Not Found',
                message: `User not found`
            });

            let isClassOfUser = false;
            user.classes.forEach(function (c) {
                if (String(c) === classId) {
                    isClassOfUser = true;
                }
            });

            if (isClassOfUser === true) {
                res.status(200).json(
                    {
                        user: user.username,
                        classes: user.classes
                    }
                );
            } else {
                res.status(200).json(
                    {
                        user: user.username,
                        classes: -1
                    }
                );
            }
        })
        .catch(error => res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        }));
};

const createMembership = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'class'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a class id property'
        });

    if (!Object.prototype.hasOwnProperty.call(req.body, 'user'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a user id property'
        });

    const userId = req.body.user;
    const classId = req.body.class;

    UserModel.findById(userId).select('username classes').exec()
        .then(user => {

            if (!user) return res.status(404).json({
                error: 'Not Found',
                message: `User not found`
            });

            ClassModel.findById(classId).exec()
                .then(myClass => {
                    if (!myClass)
                        return res.status(404).json({
                            error: 'Not Found',
                            message: `Class not found`
                        });

                    let isClassOfUser = false;
                    user.classes.forEach(function (c) {
                        if (String(c) === classId) {
                            isClassOfUser = true;
                        }
                    });

                    if (isClassOfUser) {
                        res.status(200).json(
                            {
                                user: user.username,
                                classes: user.classes
                            }
                        );
                    } else {
                        // add class to the classes array of the user
                        user.classes.push(myClass._id);
                        user.save(function (err, doc, numbersAffected) {
                            if (err) {
                                res.status(500).json({
                                    error: 'Internal server error',
                                    message: error.message
                                })
                            }

                            res.status(200).json({
                                user: user.username,
                                classes: user.classes
                            });
                        });
                    }
                })
                .catch(error => res.status(500).json({
                    error: 'Internal Server Error',
                    message: error.message
                }));
        })
        .catch(error => res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        }));
};

module.exports = {
    login,
    register,
    logout,
    me,
    listMembership,
    createMembership,
    changePassword
};