"use strict";

const mongoose = require('mongoose');
const config = require('../config');
const UserModel = require('../models/user');
const HomeworkModel = require('../models/homework');
const SubmissionModel = require('../models/submission');

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

        .then((submission) => {
            // no submissions yet
            if (!submission) {
                map.count = 0;
                map.homework = myHomework;
                return res.status(200).json(map);
            }
            map.count = submission.length;
            (map.studentCount === 0) ? map.submissionRate = 0 :
                map.submissionRate = map.count / map.studentCount;
            map.submissions = submission;
            map.homework = myHomework;
            let exerciseStatistics = [];
            // only one submission yet -> mapreduce failed
            if (map.count === 1){
                for(let i = 0; i < map.count; i++){
                    let rightOne = map.homework.exercises[i].rightSolution;
                    let picked = submission[0].exercises[i];
                    let pickedAnswers = [0, 0, 0, 0];
                    pickedAnswers[picked] = 1;
                    exerciseStatistics.push({
                        pickedAnswers: pickedAnswers,
                        answerPercentage: pickedAnswers,
                        rightAnswerPicked: (rightOne === picked) ? 1 : 0,
                        rightAnswerPercentage: (rightOne === picked) ? 1 : 0
                    });
                }
                return res.status(200).json(map);
            }
            myStatistics.results.forEach(function (submittedExercise, i) {
                exerciseStatistics.push({
                    pickedAnswers: myStatistics.results["" +i].value.pickedAnswers,
                    answerPercentage: [
                        myStatistics.results[i].value.pickedAnswers[0] / map.count,
                        myStatistics.results[i].value.pickedAnswers[1] / map.count,
                        myStatistics.results[i].value.pickedAnswers[2] / map.count,
                        myStatistics.results[i].value.pickedAnswers[3] / map.count,
                        myStatistics.results[i].value.pickedAnswers[3] / map.count,
                    ],
                    rightAnswerPicked:
                        myStatistics.results[i].value.pickedAnswers["" + myHomework.exercises[i].rightSolution],
                    rightAnswerPercentage:
                    myStatistics.results[i].value.pickedAnswers["" + myHomework.exercises[i].rightSolution] / map.count
                });
            });
            map.exerciseStatistics = exerciseStatistics;
            return res.status(200).json(map);
        })

        .catch(error => {
            if (error.message === "Homework not found") {
                return res.status(404).json({error: "Homework not found"});
            }
            else {
                return res.status(500).json({error: error.message});
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
        mapArray.forEach(function (pickedAnswer, i) {
            pickedAnswers[pickedAnswer]++;
        });
        return {pickedAnswers: pickedAnswers};
    };
    mapReduceObject.query = {
        homework: homework._id
    };
     return SubmissionModel.mapReduce(mapReduceObject).then((statistics) => {
         if(!statistics) throw Error("Error in map reduce");
         return statistics;
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
