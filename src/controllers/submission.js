"use strict";

const mongoose = require('mongoose');
const config = require('../config');
const errorHandler = require('../error');
const UserModel = require('../models/user');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');
const ClassModel = require('../models/class');

// this will return the statistics
const getStatisticsForHomework = (req, res) => {
    if (!Object.prototype.hasOwnProperty.call(req.params, 'id'))
        return res.status(400).json({
            error: 'Bad Request',
            message: 'The request body must contain a id property for the homework'
        });
    const homeworkId = req.params.id;
    let myHomework;
    let myStatistics;
    let mySubmissions;
    let map = {};
    HomeworkModel.findById(homeworkId).exec()
        .then((homework) => {

            if (!homework) throw new Error("Homework not found");
            myHomework = homework;
            return mapReduceStatistic(homework)
        })

        .then((statistics) => {
            if (!statistics) throw new Error("Map Reduce could not find any statistics");
            myStatistics = statistics;
            return UserModel.count({classes: myHomework.assignedClass, type: "Student"}).exec();
        })

        .then((studentCount) => {
            map.studentCount = studentCount;
            return SubmissionModel.find({homework: myHomework._id}).exec();
        })

        .then((submissions) => {
            // do not throw errors here, we want to supply basic statitics even if no submissions are available yet
            mySubmissions = submissions;

            // aggregate over the create time of submissions
            return SubmissionModel.aggregate([
                {
                    $match: {
                        homework: mongoose.Types.ObjectId(myHomework._id)
                    }
                },
                {
                    $group: {
                        _id: {
                            date: {'$dateToString': {format: '%Y-%m-%d', date: '$createdAt'}},
                        },
                        students: {$push: "$student"},
                        count: {$sum: 1}
                    }
                }]
            ).then((aggregatedSubmissions) => {
                // do not throw errors here, we want to supply basic statitics even if no submissions are available yet
                return aggregatedSubmissions;
            });
        })

        .then((aggregatedSubmissions) => {
            // populate a result json via the model you want to get, retuns undefined for empty aggregatedSubmissions thats just fine
            return UserModel.populate(aggregatedSubmissions, {path: "students", select: ["username", "_id"]})
        })

        .then((aggregatedSubmissions) => {
            // check if no submissions yet
            map.count = (!mySubmissions) ? 0 : mySubmissions.length;
            map.submissionRate = (map.studentCount === 0) ? 0 : (map.count / map.studentCount);
            map.homework = myHomework;
            map.submissions = (!mySubmissions) ? [] : mySubmissions;
            map.aggregatedSubmissions = (!aggregatedSubmissions) ? [] : aggregatedSubmissions;
            // no submissions yet
            if (map.count === 0) {
                map.exerciseStatistics = [];
                return res.status(200).json(map);
            }
            let exerciseStatistics = [];
            // only one submission yet -> mapreduce failed
            if (map.count === 1) {
                for (let i = 0; i < map.homework.exercises.length; i++) {
                    let rightOne = map.homework.exercises[i].rightSolution;
                    let picked = mySubmissions[0].exercises[i];
                    let pickedAnswers = [0, 0, 0, 0];
                    pickedAnswers[picked] = 1;
                    exerciseStatistics.push({
                        pickedAnswers: pickedAnswers,
                        answerPercentage: pickedAnswers,
                        rightAnswerPicked: (rightOne === picked) ? 1 : 0,
                        rightAnswerPercentage: (rightOne === picked) ? 1 : 0
                    });
                }
                map.exerciseStatistics = exerciseStatistics;
                return res.status(200).json(map);
            }
            myStatistics = myStatistics['results'];
            myStatistics.forEach(function (submittedExercise, i) {
                exerciseStatistics.push({
                    pickedAnswers: myStatistics["" + i].value.pickedAnswers,
                    answerPercentage: [
                        (myStatistics[i].value.pickedAnswers[0] / map.count),
                        (myStatistics[i].value.pickedAnswers[1] / map.count),
                        (myStatistics[i].value.pickedAnswers[2] / map.count),
                        (myStatistics[i].value.pickedAnswers[3] / map.count),
                        (myStatistics[i].value.pickedAnswers[3] / map.count),
                    ],
                    rightAnswerPicked:
                        (myStatistics[i].value.pickedAnswers["" + myHomework.exercises[i].rightSolution]),
                    rightAnswerPercentage:
                        (myStatistics[i].value.pickedAnswers["" + myHomework.exercises[i].rightSolution] / map.count)
                });
            });
            map.exerciseStatistics = exerciseStatistics;
            return res.status(200).json(map);
        })

        .catch(error => {
            if (error.message === "Map Reduce could not find any statistics") {
                return res.status(404).json({error: "Statistics not found"});
            } else {
                errorHandler.handle(error.message);
            }
        });

};

// See: http://mongoosejs.com/docs/api.html#mongoose_Mongoose-Model
function mapReduceStatistic(homework) {
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
        mapArray.forEach(function (pickedAnswer) {
            pickedAnswers[pickedAnswer]++;
        });
        return {pickedAnswers: pickedAnswers};
    };
    mapReduceObject.query = {
        homework: homework._id
    };
    return SubmissionModel.mapReduce(mapReduceObject).then((statistics) => {
        if (!statistics) throw Error("Internal Error in map reduce");
        return statistics;
    });
}

// body has to contain array of exercises, id student and id of the homework
const create = (req, res) => {
    const addSubmission = req.body;
    SubmissionModel.create(addSubmission)
        .then((submission) => {
            res.status(200).json(submission);
        })
        .catch(error => {
                errorHandler.handle("Could not create Submission");
            }
        );
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
            errorHandler.handle("Internal Error while search for submissions of a user");
        })
};

const getRankingOfSubmissions = (req, res) => {

    const classId = req.params.id;
    const userId = req.userId;
    let homeworkRanking = {};

    let homeworkOfClass;

    ClassModel.findById(classId, 'homework').populate('homework')
        .then(result => {
            if(!result) throw new Error("Homework not found");
            homeworkOfClass = result.homework.map(val => val._id);
            return SubmissionModel.find({homework: homeworkOfClass}).sort({homework: 'asc', createdAt: 'asc'});
        })
        .then(submissions => {
            homeworkOfClass.map(homeworkId => {
                const submissionsOfHw = submissions.filter(submission => submission.homework.toString() === homeworkId.toString());
                submissionsOfHw.map((submission, rank) => {
                    if (submission.student.toString() === userId.toString()) {
                        homeworkRanking[submission.homework] = rank + 1;
                    }
                })
            });
            res.status(200).json(homeworkRanking);
        })
        .catch(error => {
            rrorHandler.handle(error.message);
        })

};

module.exports = {
    getStatisticsForHomework,
    create,
    findSubmissionOfUserByHomework,
    getRankingOfSubmissions
};
