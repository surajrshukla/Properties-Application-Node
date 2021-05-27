const express = require('express');
const router = express.Router();
const ObjectId = require('mongodb').ObjectID;
const LIMIT = require('../helpers/helpers').LIMIT;
const HttpResponse = require('../helpers/httpresponse');


router.get("/get_properties/:skip", (req, res) => {
    const db = req.app.locals.db;

    const query = [
        {
            $match: {
                posted_by: { $ne: ObjectId(req.payload.user_id) }
            }
        },
        {
            $limit: LIMIT
        },
        {
            $skip: parseInt(req.params.skip)
        }
    ]

    db.collection("property_master").aggregate(query).toArray((err, result) => {
        if (err) {
            return_data = { ...HttpResponse.InternalServerError };
            return res.send(return_data);
        } else if (isEmpty(result)) {
            return_data = { ...HttpResponse.DataNotFound };
            return res.send(return_data);
        }
        const data = {
            property_list: result,
            skipped: parseInt(req.params.skip),
            has_more_data: result.length < LIMIT ? false : true
        }
        return_data = { ...HttpResponse.Success, data };
        return res.send(return_data);
    })
})

module.exports = router;
