"use strict";

const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');

const config     = require('../config');
const ClassModel  = require('../models/class');
const HomeworkModel = require('../models/homework');



const list = (req, res) => {

    ClassModel.find().exec()
        .then(classes => {
            res.status(200).json(classes);
        }).catch((error) => {
            res.status(500).json(error);
    });

};

const create = (req,res) => {

    const passwd = req.body.title + 2018;

    const addClass = Object.assign(req.body, {password: passwd});

    ClassModel.create(addClass).then((myClass) =>
    {
        console.log(myClass);
        res.status(200).json(myClass);
    });
}

const find = (req,res) => {
    ClassModel.findOne({_id: req.body.id}).exec()
        .then(myClass => myClass);
}

const findSingleClass = (req, res) => {
    const classId = req.body.id;
    HomeworkModel.find().where('_id').equals(classId).exec().then(
        (homeworkList) => {
            res.status(200).json(homeworkList);
        }
    );

}

module.exports = {
    list,
    create,
    find,
    findSingleClass
};