"use strict";

const express        = require('express');
const router         = express.Router();

const middleware    = require('../middleware');
const AuthController = require('../controllers/auth');
const HomeworkController = require('../controllers/homework');

//id is id of homework, gives all exercises of this home + homework meta data
router.get('/:id', middleware.checkAuthentication, HomeworkController.getHomeworkDetail);
router.post('/:id', middleware.checkAuthentication, HomeworkController.create);
router.delete('/:id', middleware.checkAuthentication, HomeworkController.remove);

module.exports = router;
