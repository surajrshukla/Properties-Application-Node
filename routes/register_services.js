const express = require('express');
const router = express.Router();
const cryptPassword = require('../helpers/encryption').cryptPassword;
const HttpResponse = require('../helpers/httpresponse');
const isEmpty = require('lodash').isEmpty;


router.post("/register", (req, res) => {
    const db = req.app.locals.db;

    if (isEmpty(req.body.formData.email) || isEmpty(req.body.formData.password) || isEmpty(req.body.formData.username)) {
        let return_data = {};
        return_data = { ...HttpResponse.BadRequest }
        return res.send(return_data);
    }

    req.body.formData.password = cryptPassword(req.body.formData.password);

    db.collection("user_master").insertOne(req.body.formData, (err, result) => {
        let return_data = {};
        if (err) {
            return_data = { ...HttpResponse.InternalServerError }
            return res.send(return_data);
        } else if (isEmpty(result.insertedId)) {
            return_data = { ...HttpResponse.SomethingWentWrong }
            return res.send(return_data);
        }
        return_data = { ...HttpResponse.Success }
        return res.send(return_data);
    })
});

module.exports = router;
