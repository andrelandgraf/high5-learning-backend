"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const UserModel = require('../models/user');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');

const findByHomework = (req, res) => {
    const homeworkId = req.params.id;
    SubmissionModel.find({homework: homeworkId})
        .then(homework => {
            res.status(200).json(homework);
        }).catch((error) => {
        res.status(500).json(error);
    });
};




module.exports = {
    findByHomework
}
