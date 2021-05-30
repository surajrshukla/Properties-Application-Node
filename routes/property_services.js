const express = require('express');
const router = express.Router();
const ObjectId = require('mongodb').ObjectID;
const IMAGE_PATH = require('../helpers/helpers').IMAGE_PATH;
const HttpResponse = require('../helpers/httpresponse');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const isEmpty = require('lodash').isEmpty;

const LIMIT = 10;
const FILEUPLAOD_LIMIT = 10;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/property_image/"))
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const generateThumbNails = (images) => {
    const promises = [];
    images.forEach((file) => {
        const promise = new Promise((resolve, reject) => {
            const thumbnail = file.filename.replace("files", "thumbnails");
            sharp(file.path).resize(200, 200).toFile(path.join(__dirname, "../public/property_image/") + thumbnail, (err, resizeImage) => {
                if (err) {
                    return reject(err)
                } else {
                    return resolve(thumbnail)
                }
            })
        });
        promises.push(promise)
    })

    return Promise.all(promises);
}


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
        let return_data = {};
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

router.get("/get_my_properties/:skip", (req, res) => {
    const db = req.app.locals.db;

    const query = [
        {
            $match: {
                posted_by: ObjectId(req.payload.user_id)
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
        debugger
        let return_data = {};
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
});

router.post("/create_property", upload.array("files", FILEUPLAOD_LIMIT), (req, res) => {
    generateThumbNails(req.files).then((thumbnails) => {
        const db = req.app.locals.db;
        const property_details = JSON.parse(req.body.property_details)
        const property = {
            ...property_details,
            images: isEmpty(req.files) ? [] : req.files.map((file) => { return IMAGE_PATH + file.filename }),
            thumbnails: isEmpty(thumbnails) ? [] : thumbnails.map((file) => { return IMAGE_PATH + file }),
            posted_at: new Date(),
            posted_by: ObjectId(req.payload.user_id)
        }
        db.collection("property_master").insertOne(property, (err, result) => {
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
    }).catch((err) => {
        const return_data = {};
        return_data = { ...HttpResponse.InternalServerError };
        return res.send(return_data);
    })

})

module.exports = router;
