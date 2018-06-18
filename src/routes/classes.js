"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const ClassController = require('../controllers/class');

router.get('/', middleware.checkAuthentication, ClassController.find);
router.get('/allhomework', middleware.checkAuthentication, ClassController.getAllHomework);
router.get('/students/:id', middleware.checkAuthentication, ClassController.getStudentsOfClass);
router.get('/openhw/:id', middleware.checkAuthentication, ClassController.findOpenHomework);
router.get('/:id', middleware.checkAuthentication, ClassController.findHomeworkOfClass);
router.post('/', middleware.checkAuthentication, ClassController.create);
router.put('/:id', middleware.checkAuthentication, ClassController.update);
router.delete('/:id', middleware.checkAuthentication, ClassController.remove);


module.exports = router;