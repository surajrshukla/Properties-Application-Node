const fs = require("fs");
const appRoot = require('app-root-path');

const fileModels = {
    delete_file: function (file_name) {

        const file_path = appRoot + '/public/property_image/' + file_name
        const thumbnail_path = appRoot + '/public/property_images/' + file_name.replace("files", "thumbnails");

        let filePromise;
        let thumbnailPromise;

        if (fs.existsSync(file_path)) {
            filePromise = new Promise((resolve, reject) => {
                fs.unlink(file_path, (err) => {
                    if (err) return reject(err);
                    resolve()
                });

            })

        } else {
            filePromise = Promise.resolve();
        }

        if (fs.existsSync(thumbnail_path)) {
            thumbnailPromise = new Promise((resolve, reject) => {
                fs.unlink(thumbnail_path, (err) => {
                    if (err) return reject(err);
                    resolve()
                })
            });
        } else {
            filePromise = Promise.resolve();
        }

        return Promise.all([filePromise, thumbnailPromise])
    }
}

module.exports = fileModels;