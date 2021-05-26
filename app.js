const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require("fs");
const currentPath = path.resolve();
const basePath = currentPath + '/.env.development';
const envPath = basePath + '.' + process.env.NODE_ENV;
const finalPath = fs.existsSync(envPath) ? envPath : basePath;

const dotenv = require('dotenv');
const fileEnv = dotenv.config({ path: finalPath });


// Request routes
const indexRouter = require('./routes/index');
const loginServices = require('./routes/login_services');
const userServices = require('./routes/user_services');
const registerServices = require('./routes/register_services');


const jwt_paths = require("./helpers/jwt_token").jwt_paths;


const app = express();
app.set('view engine', 'jade');



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  next();
});
app.use(jwt_paths);

app.use('/', indexRouter);
app.use('/login_services', loginServices);
app.use('/user_services', userServices);
app.use('/register_services', registerServices);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
