const expressJwt = require("express-jwt");
const jwt = require("jsonwebtoken");
const cypherPassword = require("./helpers").CIPHER_PASSWORD;
const jwt_paths = expressJwt({
    secret: cypherPassword,
    algorithms: ['HS256'],
    resultProperty: 'locals.user'
}).unless({ path: ['/login_services/login', '/register_services/register'] });

const jwt_sign = (user, cb) => jwt.sign({ role: user.user_type, user_id: user.user_id }, cypherPassword, { algorithm: 'HS256'}, (err, token) => {
    if (err) {
        return cb(err);
    }
    return cb(null, token)
});

module.exports = {
    jwt_paths,
    jwt_sign
};