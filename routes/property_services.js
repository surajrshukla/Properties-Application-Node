const express = require('express');
const router = express.Router();
const ObjectId = require('mongodb').ObjectID;
const IMAGE_PATH = require('../helpers/helpers').IMAGE_PATH;
const HttpResponse = require('../helpers/httpresponse');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const isEmpty = require('lodash').isEmpty;
const fileModels = require('../models/file_model');

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


router.get("/get_properties/:skip/:limit", (req, res) => {
    const db = req.app.locals.db;

    const query = [
        {
            $match: { posted_by: { $ne: ObjectId(req.payload.user_id) } }
        },
        {
            $lookup: {
                from: "favourite_master",
                as: "favourites",
                let: { "property_id": "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $and: [{ $eq: ["$property_id", "$$property_id"] }, { $eq: ["$user_id", ObjectId(req.payload.user_id)] }] }
                        }
                    },
                    {
                        $count: "favCount"
                    }
                ]
            }
        },
        {
            $unwind: {
                path: '$favourites',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "user_master",
                as: "posted_by",
                let: { "postedBy": "$posted_by" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$postedBy"] }
                        }
                    },
                    {
                        $project: {
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: '$posted_by',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                property_name: 1,
                price: 1,
                address: 1,
                property_description: 1,
                locality: 1,
                badrooms: 1,
                bathrooms: 1,
                carpet_area: 1,
                images: 1,
                thumbnails: 1,
                posted_at: 1,
                posted_by: 1,
                visit_count: 1,
                isFavourite: { $cond: { if: { $gt: ["$favourites.favCount", 0] }, then: true, else: false } },
            }
        },
        {
            $skip: parseInt(req.params.skip)
        },
        {
            $limit: parseInt(req.params.limit)
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
            has_more_data: result.length < parseInt(req.params.limit) ? false : true
        }
        return_data = { ...HttpResponse.Success, data };
        return res.send(return_data);
    })
})

router.get("/get_my_properties/:skip/:limit", (req, res) => {
    const db = req.app.locals.db;
    const query = [
        {
            $match: { posted_by: ObjectId(req.payload.user_id) }
        },
        {
            $lookup: {
                from: "favourite_master",
                as: "favourites",
                let: { "property_id": "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $and: [{ $eq: ["$property_id", "$$property_id"] }, { $eq: ["$user_id", ObjectId(req.payload.user_id)] }] }
                        }
                    },
                    {
                        $count: "favCount"
                    }
                ]
            }
        },
        {
            $unwind: {
                path: '$favourites',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "user_master",
                as: "posted_by",
                let: { "postedBy": "$posted_by" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$postedBy"] }
                        }
                    },
                    {
                        $project: {
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: '$posted_by',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                property_name: 1,
                price: 1,
                address: 1,
                property_description: 1,
                locality: 1,
                badrooms: 1,
                bathrooms: 1,
                carpet_area: 1,
                images: 1,
                thumbnails: 1,
                posted_at: 1,
                posted_by: 1,
                visit_count: 1,
                isFavourite: { $cond: { if: { $gt: ["$favourites.favCount", 0] }, then: true, else: false } },
            }
        },
        {
            $skip: parseInt(req.params.skip)
        },
        {
            $limit: parseInt(req.params.limit)
        }
    ];

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
            skipped_my_proprties: parseInt(req.params.skip),
            has_more_data: result.length < parseInt(req.params.limit) ? false : true
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
});

router.put("/update_property", upload.array("files", FILEUPLAOD_LIMIT), (req, res) => {
    generateThumbNails(req.files).then((thumbnails) => {
        const db = req.app.locals.db;
        const property_details = JSON.parse(req.body.property_details);
        let property_id = ObjectId(property_details._id)
        delete property_details._id;
        delete property_details.images;
        delete property_details.thumbnails;
        delete property_details.posted_by;

        const query = { _id: property_id };

        const operation = {
            $set: {
                ...property_details,
                updated_at: new Date()
            },
            $push: {
                images: { $each: req.files.map((file) => { return IMAGE_PATH + file.filename }) },
                thumbnails: { $each: thumbnails.map((file) => { return IMAGE_PATH + file }) }
            }
        }

        db.collection("property_master").updateOne(query, operation, (err, result) => {
            let return_data = {};
            if (err) {
                return_data = { ...HttpResponse.InternalServerError }
                return res.send(return_data);
            } else if (result.modifiedCount !== 1) {
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

router.post("/toggle_favourite", (req, res) => {

    const db = req.app.locals.db;

    if (req.body.action === "add") {
        const data = {
            property_id: ObjectId(req.body.property_id),
            user_id: ObjectId(req.payload.user_id)
        }
        db.collection("favourite_master").insertOne(data, (err, result) => {
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
    } else {
        const query = {
            property_id: ObjectId(req.body.property_id),
            user_id: ObjectId(req.payload.user_id)
        };

        db.collection("favourite_master").deleteOne(query, (err, result) => {
            let return_data = {};
            if (err) {
                return_data = { ...HttpResponse.InternalServerError }
                return res.send(return_data);
            } else if (result.deletedCount < 0) {
                return_data = { ...HttpResponse.SomethingWentWrong }
                return res.send(return_data);
            }
            return_data = { ...HttpResponse.Success }
            return res.send(return_data);
        })

    }
});

router.get("/get_property_details/:id", (req, res) => {
    const db = req.app.locals.db;

    db.collection("property_master").findOne({ _id: ObjectId(req.params.id) }, (err, result) => {
        let return_data = {};
        if (err) {
            return_data = { ...HttpResponse.InternalServerError };
            return res.send(return_data);
        } else if (isEmpty(result)) {
            return_data = { ...HttpResponse.DataNotFound };
            return res.send(return_data);
        }

        const data = result;
        return_data = { ...HttpResponse.Success, data };
        return res.send(return_data);
    })
})


router.delete("/delete_image/:property_id/:image_name", (req, res) => {
    const db = req.app.locals.db;

    const query = { _id: ObjectId(req.params.property_id) };

    const operation = {
        $pull: { images: IMAGE_PATH + req.params.image_name, thumbnails: IMAGE_PATH + req.params.image_name.replace("files", "thumbnails") }
    }

    db.collection("property_master").updateOne(query, operation, (err, result) => {
        let return_data = {};
        if (err) {
            return_data = { ...HttpResponse.InternalServerError };
            return res.send(return_data);
        } else {
            fileModels.delete_file(req.params.image_name).then(() => {
                return_data = { ...HttpResponse.Success };
                return res.send(return_data);
            }).catch((err) => {
                return_data = { ...HttpResponse.InternalServerError };
                return res.send(return_data);
            })
        }

    })
})

router.put("/increament_visit_count", (req, res) => {
    const db = req.app.locals.db;
    const query = { _id: ObjectId(req.body.id) };
    const operation = { $inc: { visit_count: 1 } }

    db.collection("property_master").updateOne(query, operation, (err, result) => {
        let return_data = {};
        if (err) {
            return_data = { ...HttpResponse.InternalServerError };
            return res.send(return_data);
        } else {
            return_data = { ...HttpResponse.Success };
            return res.send(return_data);
        }
    })
})



module.exports = router;
