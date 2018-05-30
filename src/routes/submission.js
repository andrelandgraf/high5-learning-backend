"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const SubmissionController = require('../controllers/submission');

//TODO add authentification for production
//finds all submission by homework ID
router.get('/:id', SubmissionController.findByHomework);
router.post('/', SubmissionController.create);

module.exports = router;