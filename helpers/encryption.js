const bcrypt = require('bcrypt');
const SALT = require('./helpers').SALT;

exports.cryptPassword = function (password) {
    const salt = bcrypt.genSaltSync(parseInt(SALT));
    const hash = bcrypt.hashSync(password, salt);
    return hash;
};

exports.comparePassword = function(plainPass, hashword) {
   return bcrypt.compareSync(plainPass, hashword)
};