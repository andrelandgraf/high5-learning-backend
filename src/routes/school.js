"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const SchoolController = require('../controllers/school');

router.get('/', middleware.checkAuthentication, SchoolController.getAll);
router.get('/students/:id', middleware.checkAuthentication, SchoolController.getStudentsOfSchool);
router.get('/:id', middleware.checkAuthentication, SchoolController.find);

module.exports = router;
