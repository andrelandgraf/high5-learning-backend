"use strict";

const handle = (message) => {

    if (message === 'No token provided in the request' || message === 'Failed to authenticate token.') {
        return {code: 401, error: 'Unauthorized', message: message}
    }

    if (message === "Not authorized") {
        return {code: 403, message: "You are not allowed to do this.", error: message};
    }

    if (message === "School not found") {
        return {code: 404, message: "The school name could not be found", error: message};
    }

    if (message === "Schools not found") {
        return {code: 404, message: "Currently there are no schools in our system", error: message};
    }

    if (message === "Class not found") {
        return {code: 404, message: "The class you were looking for could not be found.", error: message};
    }

    if (message === "Classes not found") {
        return {code: 404, message: "The classes you were looking for could not be found.", error: message};
    }

    if (message === "User not found") {
        return {code: 404, message: "The user you were looking for could not be found.", error: message};
    }

    if (message === "No homework found") {
        return {code: 404, message: "For this class there is no homework.", error: message};
    }

    if (message) {
        return {code: 500, message: message, error: "Internal server error"};
    } else {
        return {code: 500, message: "The server failed to process your request.", error: "Internal server error"}
    }

};

module.exports = {
    handle
};