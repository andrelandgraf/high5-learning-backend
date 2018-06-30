"use strict";

const express        = require('express');
const router         = express.Router();

const middleware    = require('../middleware');
const AuthController = require('../controllers/auth');

/**
 * all routes of the user data model / authentication routes
 * user id and other user attributes provided via middleware
 */

// check login information and return login token if successful
router.post('/login', AuthController.login);

// check register information and login and return login token if successful
router.post('/register', AuthController.register);

// return all user information (user id via auth)
router.get('/me', middleware.checkAuthentication , AuthController.me);

// check if user (user id via auth) is member of class with class id :id
router.get('/member/:id', middleware.checkAuthentication , AuthController.listMembership);

// add membership for user (user id via auth)
// !important class id via body is compulsory
router.post('/member/', middleware.checkAuthentication , AuthController.createMembership);

// delete token of logged in user
router.get('/logout', AuthController.logout);

// update password for logged in user (user id via auth)
router.put('/changepw', middleware.checkAuthentication,AuthController.changePassword);

module.exports = router;