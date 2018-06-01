"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const SubmissionController = require('../controllers/submission');

//TODO add authentification for production
//finds all submission by homework ID
router.get('/:id', SubmissionController.findByHomework);

//find submissions of one user for one homework, params :id is the id of homework, user id is delivered by aut
router.get('/user/:id/', SubmissionController.findSubmissionOfUserByHomework);
router.post('/', SubmissionController.create);

module.exports = router;