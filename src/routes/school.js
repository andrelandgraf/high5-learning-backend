"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const SchoolController = require('../controllers/school');

// watch out! no middleware needed in getAll!
router.get('/', SchoolController.getAll);
router.get('/students', middleware.checkAuthentication, SchoolController.getStudentsOfSchool);
router.get('/:id', middleware.checkAuthentication, SchoolController.find);

module.exports = router;
