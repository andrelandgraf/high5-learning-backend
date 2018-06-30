"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const SchoolController = require('../controllers/school');

/**
 * all routes of the school data model
 * note: school cannot be inserted via backend as they provide crucial information for registration
 *       you have to insert a new school manually to the mongoDB
 */

// !important: no middleware for getAll as we need to receive the school names at the landingPage (no auth)
// returns all school names
router.get('/', SchoolController.getAll);

// find all students of one school (list of students)
router.get('/students', middleware.checkAuthentication, SchoolController.getStudentsOfSchool);

module.exports = router;
