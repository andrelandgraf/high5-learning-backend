"use strict";

const express        = require('express');
const router         = express.Router();

const middleware    = require('../middleware');
const AuthController = require('../controllers/auth');
const HomeworkController = require('../controllers/homework');

//TODO add authentification for production
//id is id of homework, gives all exercises of this home + homework meta data
router.get('/:id', HomeworkController.find);
router.post('/', HomeworkController.create);

module.exports = router;
