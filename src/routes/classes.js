"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const ClassController = require('../controllers/class');

//find all submission for :id == homework._id
router.get('/:id', middleware.checkAuthentication ,ClassController.find);
router.post('/', middleware.checkAuthentication, ClassController.create);


module.exports = router;