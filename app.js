var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var logger = require('morgan');

const session = require('express-session');
const mysql = require('mysql');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

/*const client = mysql.createConnection({
    host : 'https://newer_news_server.paas-ta.org/',
    user : 'root',
    password : 'newernews1234',
    database : 'newr_news'
});

client.connect(function(err) {
  if (err) throw err;
  console.log('Connected');
});
*/

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24000 * 60 * 60 // 쿠키 유효기간 24시간
  }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/material', express.static('material'));
var path = require("path");
app.use('/material', express.static(path.join(__dirname, 'material')));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(upload.array());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/login', indexRouter);
app.use('/join', indexRouter);
app.use('/dashboard', indexRouter);
app.use('/board', indexRouter);
app.use('/hotsearch', indexRouter);
app.use('/feed', indexRouter);
app.use('/feed/:id', indexRouter);
app.use('/feed/:id/delete', indexRouter);
app.use('/feed/:id/count', indexRouter);
app.use('/feed/gu', indexRouter);
app.use('/feed/si', indexRouter);
app.use('/logout', indexRouter);
app.use('/ilike', indexRouter);
app.use('/ihate', indexRouter);
app.use('/ihatecancel/:id', indexRouter);
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
