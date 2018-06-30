"use strict";

const express = require('express');
const router = express.Router();

const middleware = require('../middleware');
const ClassController = require('../controllers/class');

/**
 * all routes of the class data model
 * note: composition between class (parent) and homework (children),
 *       (no homework without an class)
 *       for example: get homework for class is routed here
 */

// get all classes of the current user (user id via auth)
router.get('/', middleware.checkAuthentication, ClassController.find);

// returns all classes and all homework for each class of the current user (user id via auth)
router.get('/allhomework', middleware.checkAuthentication, ClassController.getAllHomework);

// returns a list of all students (user) that are member of this class with class id :id
router.get('/students/:id', middleware.checkAuthentication, ClassController.getStudentsOfClass);

// returns homework of class with class id :id that have no submission yet (user is a student, user id via auth)
router.get('/openhw/:id', middleware.checkAuthentication, ClassController.findOpenHomework);

// returns all homework of the class with id :id
router.get('/:id', middleware.checkAuthentication, ClassController.findHomeworkOfClass);

// insert a new class
router.post('/', middleware.checkAuthentication, ClassController.create);

// update a class with class id :id
router.put('/:id', middleware.checkAuthentication, ClassController.update);

// delete the class with class id :id
router.delete('/:id', middleware.checkAuthentication, ClassController.remove);


module.exports = router;