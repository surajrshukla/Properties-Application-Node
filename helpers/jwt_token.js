const jwt = require('express-jwt');
const cypherPassword = require("./helpers").CIPHER_PASSWORD;

const jwt_paths = jwt({
    secret: cypherPassword,
    algorithms: ['HS256'],
    resultProperty: 'locals.user'
}).unless({ path: ['/login_services/token', '/register_services/register'] });

const jwt_sign = (user) => jwt.sign({ role: user.role_id, user_id: user.user_id }, accessTokenSecret);

module.exports = {
    jwt_paths,
    jwt_sign
};