"use strict";

const express        = require('express');
const router         = express.Router();

const middleware    = require('../middleware');
const AuthController = require('../controllers/auth');
const ClassController = require('../controllers/class');


router.get('/', ClassController.list);

module.exports = router;