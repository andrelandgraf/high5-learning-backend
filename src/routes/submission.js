"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const SubmissionController = require('../controllers/submission');


//finds all submission by homework ID
router.get('/:id', SubmissionController.findByHomework);

module.exports = router;