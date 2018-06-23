"use strict";

/**
 * message is the error message
 * @param message
 * @returns {*}
 */
const handle = (message) => {

    if (message === 'No token provided in the request' || message === 'Failed to authenticate token.') {
        return {code: 401, error: 'Unauthorized', message: message}
    }

    if (message === "Not authorized") {
        return {code: 403, message: "You are not allowed to do this.", error: message};
    }

    if (message === "Invalid password") {
        return {code: 401, message: "Wrong password! Please try it again.", error: message};
    }

    if (message === "School not found") {
        return {code: 404, message: "The school name could not be found", error: message};
    }

    if (message === "Submission not found") {
        return {code: 404, message: "The submission could not be found", error: message};
    }

    if (message === "Schools not found") {
        return {code: 404, message: "Currently there are no schools in our system", error: message};
    }

    if (message === "Homework not found") {
        return {code: 404, message: "The homework you were looking for could not be found", error: message};
    }

    if (message === "Class not found") {
        return {code: 404, message: "The class you were looking for could not be found.", error: message};
    }

    if (message === "User not found") {
        return {code: 404, message: "The user you were looking for could not be found.", error: message};
    }

    if (message === "User exists") {
        return {code: 400, message: "The username already exists.", error: message};
    }

    if (message === "License Code not found") {
        return {code: 404, message: "The license is not valid.", error: message};
    }

    if (message === "No homework found") {
        return {code: 404, message: "For this class there is no homework.", error: message};
    }

    if (message === "Could not create homework") {
        return {code: 500, message: "The homework couldn't be created.", error: message};
    }

    if (message === "Could not create class") {
        return {code: 500, message: "The class couldn't be created.", error: message};
    }

    if (message === "Could not update class") {
        return {code: 500, message: "The class couldn't be updated.", error: message};
    }

    if (message === "Could not update homework") {
        return {code: 500, message: "The homework couldn't be updated.", error: message};
    }

    if (message === "Could not delete submission") {
        return {code: 500, message: "The submission couldn't be deleted.", error: message};
    }

    if (message === "Creation of submission not possible") {
        return {code: 500, message: "The submission couldn't be created.", error: message};
    }

    if (message === "Could not delete class") {
        return {code: 500, message: "The class couldn't be deleted.", error: message};
    }

    if (message === "Could not delete homework") {
        return {code: 500, message: "The homework couldn't be deleted.", error: message};
    }

    if (message) {
        return {code: 500, message: "The server failed to process your request.", error: "Internal server error"};
    }

};

module.exports = {
    handle
};