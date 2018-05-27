"use strict";

const express        = require('express');
const router         = express.Router();

const middleware    = require('../middleware');
const AuthController = require('../controllers/auth');
const HomeworkController = require('../controllers/homework');

//get homework by class
//router.get('/:id', HomeworkController.find);

//create homework inside class
//router.post('/',HomeworkController.create);

//id is id of homework, gives all exercises of this home + homework meta data
router.get('/homework/:id', HomeworkController.find)

module.exports = router;
