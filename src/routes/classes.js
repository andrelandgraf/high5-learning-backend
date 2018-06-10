"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const ClassController = require('../controllers/class');

router.get('/', middleware.checkAuthentication ,ClassController.find);
router.get('/details/:id', middleware.checkAuthentication, ClassController.getInfoSingleClass);
router.get('/students/:id',ClassController.getStudentsOfClass);
router.get('/openhw/:id',middleware.checkAuthentication, ClassController.findOpenHomework);
router.get('/:id', middleware.checkAuthentication, ClassController.findSingleClass);
router.post('/', middleware.checkAuthentication, ClassController.create);
router.put('/:id', middleware.checkAuthentication, ClassController.update);
router.delete('/:id', middleware.checkAuthentication, ClassController.remove);



module.exports = router;