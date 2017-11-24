function response(state, message, data) {
    return {
        success: state,
        message: message,
        data: data
    }
}

module.exports = {

    emailUsed: () => {
        return response(false, 'Email is already used.', null)
    },

    matchingPasswords: () => {
        return response(false, 'Passwords do not match.', null)
    },

    emailSent: (user) => {
        return response(true, 'Successfully sent email.', user)
    },

    addedCredits: (credits) => {
        return response(true, 'Successfully added ' + credits + ' credits.', null)
    },

    response: (state, message, data) => {
        return {
            success: state,
            message: message,
            data: data
        }
    },

    error: () => {
        return {
            success: false,
            message: 'Something unexpected happened.'
        }
    }
};