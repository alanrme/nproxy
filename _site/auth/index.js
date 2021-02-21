const express = require('express');
const router = express.Router();

// these paths are prepended with /auth

router.get('/', (req, res) => {
    res.json({
        message: "Auth"
    });
});

function validateUser(user) {
    const validEmail = typeof user.email == 'string' && user.email.trim() !== '';
    const validPass = typeof user.password == 'string' && user.password.trim() !== '' && user.password.trim().length >= 8;
    return validEmail && validPass;
}

router.get('/signup', (req, res, next) => {
    if (validateUser(req.body)) {
        res.json({
            message: "ur valid"
        });
    } else {
        next(new Error('Invalid user'))
    }
});

module.exports = router;