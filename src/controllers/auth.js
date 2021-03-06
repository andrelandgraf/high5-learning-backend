"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../config');
const UserModel = require('../models/user');
const SchoolModel = require('../models/school');
const ClassModel = require('../models/class');
const errorHandler = require('../error');


/**
 * function createToken creates a token with the id, the username and the user type (e.g. student or teacher)
 * @param user
 * @param schoolname
 * @returns {*}
 */
function createToken(user, schoolname) {
    return jwt.sign({
        id: user._id,
        username: user.username,
        type: user.type,
        schoolname: schoolname
    }, config.JwtSecret, {
        // expires in 24 hours
        expiresIn: 86400
    });
}

/**
 * function login: check login data, return token if everything is fine
 * @param req
 * @param res
 * @returns {*}
 */
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

    // chaining through the promises that are needed in order to check the login data provided via req
    // finally return token if login data is valid
    UserModel.findOne({username: req.body.username}).exec()
        .then(user => {
            if (!user) throw new Error("User Not Found");
            // check if the password is valid
            const isPasswordValid = bcrypt.compareSync(req.body.password, user.password);
            if (!isPasswordValid) throw new Error("Invalid password");
            currentUser = user;
            return SchoolModel.findOne({users: mongoose.Types.ObjectId(user._id)});

        })

        .then(school => {
            if (!school) throw new Error("School Not Found");
            const token = createToken(currentUser, school.name);
            res.status(200).json({token: token});
        })


        .catch((error) => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        });
};

/**
 * function changePassword: change the password of the logged in user
 * @param req
 * @param res
 * @returns {*}
 */
const changePassword = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'password')) return res.status(400).json({
        error: 'Bad Request',
        message: 'The request body must contain a password property'
    });

    UserModel.findOneAndUpdate({_id: req.userId}, {password: bcrypt.hashSync(req.body.password, 8)}).exec()
        .then(() => res.status(200).json({code: 200, message: "success", error: ""}))
        .catch((error) => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        });
};

/**
 * function register: register new user after checking the registration data
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

            .catch(error => {
                const err = errorHandler.handle(error.message);
                res.status(err.code).json(err);
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

            .catch(error => {
                    const err = errorHandler.handle(error.message);
                    res.status(err.code).json(err);
                }
            );
    }
};

/**
 * function me: return all user information for the logged in user
 * @param req
 * @param res
 */
const me = (req, res) => {
    UserModel.findById(req.body.userId).select('username').exec()
        .then(user => {
            if (!user) throw new Error("User not found");
            res.status(200).json(user)
        })
        .catch(error => {
            const err = errorHandler.handle(error.message);
            res.status(err.code).json(err);
        });
};

/**
 * function logout: delete current auth token
 * @param req
 * @param res
 */
const logout = (req, res) => {
    res.status(200).send({token: null});
};

module.exports = {
    login,
    register,
    logout,
    me,
    changePassword
};