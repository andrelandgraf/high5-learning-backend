"use strict";

const express        = require('express');
const router         = express.Router();

const middleware    = require('../middleware');
const HomeworkController = require('../controllers/homework');

/**
 * all routes of the homework data model
 * note: composition between class (parent) and homework (children),
 *       (no homework without an class)
 *       for example: get homework for class is routed in routes/classes.js
 */

// id is id of homework, gives all exercises of this home + homework meta data
router.get('/:id', middleware.checkAuthentication, HomeworkController.getHomeworkDetail);

// !important id is class id
// insert a new homework for the class (:id)
router.post('/:id', middleware.checkAuthentication, HomeworkController.create);

// delete homework with homework id :id
router.delete('/:id', middleware.checkAuthentication, HomeworkController.remove);

// change the visibility of the homework with homework id :id
router.put('/visibility/:id', middleware.checkAuthentication, HomeworkController.changeVisibility);

// update the homework with homework id :id
router.put('/:id', middleware.checkAuthentication, HomeworkController.update);

module.exports = router;
