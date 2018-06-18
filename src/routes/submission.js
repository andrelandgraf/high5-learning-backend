"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const SubmissionController = require('../controllers/submission');

//finds all submission by homework ID TODO middleware.checkAuthentication,
router.get('/:id', SubmissionController.getStatisticsForHomework);
router.get('/ranking/:id', middleware.checkAuthentication, SubmissionController.getRankingOfSubmissions);
//find submissions of one user for one homework, params :id is the id of homework, user id is delivered by aut
router.get('/user/:id/', middleware.checkAuthentication, SubmissionController.findSubmissionOfUserByHomework);
router.post('/', middleware.checkAuthentication, SubmissionController.create);

module.exports = router;