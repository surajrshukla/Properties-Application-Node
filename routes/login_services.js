const express = require('express');
const router = express.Router();
const comparePassword = require('../helpers/encryption').comparePassword;
const HttpResponse = require('../helpers/httpresponse');
const isEmpty = require('lodash').isEmpty;
const jwt_sign = require('../helpers/jwt_token').jwt_sign

router.post("/login", (req, res) => {
    const db = req.app.locals.db;
    if (isEmpty(req.body.formData.email) || isEmpty(req.body.formData.password)) {
        let return_data = {};
        return_data = { ...HttpResponse.WrongCredentials }
        return res.send(return_data);
    }

    db.collection("user_master").findOne({ email: req.body.formData.email }, (err, result) => {
        let return_data = {};
        if (err) {
            return_data = { ...HttpResponse.InternalServerError }
            return res.send(return_data);
        } else if (isEmpty(result)) {
            return_data = { ...HttpResponse.DataNotFound }
            return res.send(return_data);
        }
        const passwordResult = comparePassword(req.body.formData.password, result.password);
        if (passwordResult) {
            jwt_sign({ role: result.user_type, user_id: result._id.toString() }, (err, token) => {
                if (err) {
                    return_data = { ...HttpResponse.InternalServerError }
                    return res.send(return_data);
                }
                const data = { accessToken: token };
                return_data = { ...HttpResponse.Success, data };
                return res.send(return_data);
            })
        } else {
            return_data = { ...HttpResponse.WrongCredentials }
            return res.send(return_data);
        }
    })
})

module.exports = router;
