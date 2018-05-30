"use strict";

const express        = require('express');
const router         = express.Router();

const middleware    = require('../middleware');
const AuthController = require('../controllers/auth');


router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', middleware.checkAuthentication , AuthController.me);
router.get('/member/:id', middleware.checkAuthentication , AuthController.listMembership);
router.get('/member/', middleware.checkAuthentication , AuthController.createMembership);
router.get('/logout', AuthController.logout);

module.exports = router;