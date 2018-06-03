"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('../config');
const UserModel = require('../models/user');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');

// this will return the statistic
const getStatisticsForHomework = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.params, 'id'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a id property for the homework'
        });
    const homeworkId = req.params.id;
    getHomework(homeworkId).exec().then((homework) => mapReduceStatistic(req, res, homework))
        .catch(error => {
            console.log(error);
            res.status(404).json({error: "Object not found"});
        });

};

function getHomework(homeworkId) {
    return HomeworkModel.findById(homeworkId);
}

// See: http://mongoosejs.com/docs/api.html#mongoose_Mongoose-Model
function mapReduceStatistic(req, res, homework) {
    let mapReduceObject = {};
    mapReduceObject.map = function () {
        // each submission contains the exercises array which stores the picked answer for each exercise of the student
        this.exercises.forEach(function (pickedAnswer, i) {
            // key is index of the exercise in exercise array
            // value is map of:
            emit(i, pickedAnswer);
        });
    };
    mapReduceObject.reduce = function (keyExerciseIndex, mapArray) {
        let pickedAnswers = [];
        pickedAnswers[0] = 0;
        pickedAnswers[1] = 0;
        pickedAnswers[2] = 0;
        pickedAnswers[3] = 0;
        mapArray.forEach(function (pickedAnswer, i) {
            pickedAnswers["" + pickedAnswer]++;
        });
        return {pickedAnswers};
    };
    mapReduceObject.query = {
        homework: homework._id
    };
    mapReduceObject.finalize = function (keyExerciseIndex, reducedValue) {
        return reducedValue;
    };
    SubmissionModel.mapReduce(mapReduceObject, function (err, statistics) {
        if (err) {
            res.status(500).json(err);
        }
        extendMapReduce(req, res, statistics, homework)
    });
}

function extendMapReduce(req, res, statistics, homework) {
    SubmissionModel.find({homework: homework._id}).exec()
        .then((submission) => {
            const map = {};
            map.count = submission.length;
            map.submissions = submission;
            map.homework = homework;
            if (map.count === 0) res.status(200).json(map);
            const exerciseStatistics = statistics.results;
            exerciseStatistics.forEach(function (submittedExercise, i) {
                exerciseStatistics["" + i] = {
                    pickedAnswers: exerciseStatistics["" + i].value.pickedAnswers,
                    answerPercentage: [
                        exerciseStatistics["" + i].value.pickedAnswers[0] / map.count,
                        exerciseStatistics["" + i].value.pickedAnswers[1] / map.count,
                        exerciseStatistics["" + i].value.pickedAnswers[2] / map.count,
                        exerciseStatistics["" + i].value.pickedAnswers[3] / map.count,
                    ],
                    rightAnswerPicked:
                        exerciseStatistics["" + i].value.pickedAnswers["" + homework.exercises["" + i].rightSolution],
                    rightAnswerPercentage:
                    exerciseStatistics["" + i].value.pickedAnswers["" + homework.exercises["" + i].rightSolution] / map.count
                };
            });
            map.exerciseStatistics = exerciseStatistics;

            UserModel.count({class: homework.assignedClass, type: "Student"}).exec().then((studentCount) => {
                map.studentCount = studentCount;
                map.submissionRate = map.count / studentCount;
                res.status(200).json(map);
            }).catch(error => {
                console.log(error);
                res.status(404).json({error: "Object not found"});
            });
        })
        .catch(error => {
            console.log(error);
            res.status(404).json({error: "Object not found"});
        });
}

// body has to contain array of exercises, id student and id of the homework
const create = (req, res) => {
    const addSubmission = req.body;
    SubmissionModel.create(addSubmission)
        .then((submission) => {
            res.status(200).json(submission);
        }).catch(error => {
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        })
    });
};


const findSubmissionOfUserByHomework = (req, res) => {
    const userId = req.userId;
    const homeworkId = req.params.id;
    SubmissionModel.find({homework: homeworkId, student: userId})
        .exec()
        .then(submission => {
            res.status(200).json(submission);
        })
        .catch(error => {
            res.status(500).json(error);
        })
};

module.exports = {
    getStatisticsForHomework,
    create,
    findSubmissionOfUserByHomework
};
