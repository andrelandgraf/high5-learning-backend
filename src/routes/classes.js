"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const ClassController = require('../controllers/class');

//TODO add authentification for production
router.get('/', middleware.checkAuthentication ,ClassController.find);
router.get('/details/:id', middleware.checkAuthentication, ClassController.getInfoSingleClass);
router.get('/:id', middleware.checkAuthentication, ClassController.findSingleClass);
router.post('/', middleware.checkAuthentication, ClassController.create);


module.exports = router;