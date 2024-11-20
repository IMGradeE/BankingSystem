 const createError = require('http-errors'),
     express = require('express'),
     path = require('path'),
     cookieParser = require('cookie-parser'),
     logger = require('morgan'),
     indexRouter = require('./routes/index'),
     loginUserRouter = require('./routes/loginuser'),
     baseRouter = require('./routes/base'),
     adminActionRouter = require('./routes/adminAction'),
     adminBaseRouter = require('./routes/adminBase'),
     registerRouter = require('./routes/register'),
     baseTransactions = require('./routes/baseTransactions');

 var session = require('express-session');
 var MySQLStore = require('express-mysql-session')(session);


 var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// This will set up the database if it doesn't already exist
var dbCon = require('./lib/database');
dbCon.initCon();

// Session management to store cookies in a MySQL server (this has a bug, so we assist it by creating the database for it)
var dbSessionPool = require('./lib/sessionPool.js');
var sessionStore = new MySQLStore({}, dbSessionPool);

// Necessary middleware to store session cookies in MySQL
app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret1234',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  cookie : {
    sameSite: 'strict'
  }
}));

// Middleware to make session variables available in .ejs template files
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

 app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap-icons/")));
app.use('/', indexRouter);
app.use('/loginuser', loginUserRouter);
app.use('/register', registerRouter);
app.use('/adminBase', adminBaseRouter);
app.use('/adminAction', adminActionRouter);
app.use('/baseTransactions', baseTransactions);
app.use('/base', baseRouter);

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
