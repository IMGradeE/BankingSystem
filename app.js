 const createError = require('http-errors'),
     express = require('express'),
     path = require('path'),
     cookieParser = require('cookie-parser'),
     logger = require('morgan'),
     adminreportselectRouter = require('./routes/adminChangeLoginInfo'),
     adminreportresultRouter = require('./routes/employeeViewUsers'),
     indexRouter = require('./routes/index'),
     loginUserRouter = require('./routes/loginuser'),
     registerRouter = require('./routes/register'),
     surveyRouter = require('./routes/survey'),
     timingsRouter = require('./routes/timings');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap-icons/")));

app.use('/', indexRouter);
app.use('/loginuser', loginUserRouter);
app.use('/register', registerRouter);
app.use('/survey', surveyRouter);
app.use('/timings', timingsRouter);
app.use('/adminreportresult', adminreportresultRouter);
app.use('/adminreportselect', adminreportselectRouter);

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
