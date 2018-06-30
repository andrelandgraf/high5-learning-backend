"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const SubmissionController = require('../controllers/submission');

/**
 * all routes that have something to do with the students submissions and the teachers statistics about submissions
 * note: composition between homework (parent) and submissions (children),
 *       (no submission without an homework)
 *      => id therefore describes the corresponding homework id
 */
// finds all submission by homework ID (all submission submitted for this homework)
router.get('/:id',  middleware.checkAuthentication, SubmissionController.getStatisticsForHomework);

// ranks submissions by submission timestamp and returns sorted list of submissions
router.get('/ranking/:id', middleware.checkAuthentication, SubmissionController.getRankingOfSubmissions);

// find submissions of one user for one homework, params :id is the id of homework, user id is delivered by auth
router.get('/user/:id/', middleware.checkAuthentication, SubmissionController.findSubmissionOfUserByHomework);

// insert a new submission
router.post('/', middleware.checkAuthentication, SubmissionController.create);

module.exports = router;