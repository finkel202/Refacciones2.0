require('dotenv').config();

const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const express      = require('express');
const favicon      = require('serve-favicon');
const hbs          = require('hbs');
const mongoose     = require('mongoose');
const logger       = require('morgan');
const path         = require('path');
const amplify      = require('aws-amplify');
const bcrypt       = require('bcrypt');
const saltRounds   = 10;
const session      = require('express-session');
const passport     = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MongoStore = require('connect-mongo')(session);
const flash      = require("connect-flash");
const User = require("./models/user");
const Parts = require("./models/parts")

// mongoose.Promise = Promise;
// mongoose.connect("mongodb://localhost/refacciones",{useMongoClient: true})
// .then(()=>{
//   console.log("Conected to Mongo")
// })
// .catch(err =>{
//   console.log("Error conecting to mongo", err)
// });

mongoose.Promise = Promise;
mongoose.connect('mongodb://findandfix:F1nd&fix@ds221292.mlab.com:21292/findandfix', {useMongoClient: true})
  .then(() => {
    console.log('Connected to Mongo Refacciones!')
  }).catch(err => {
    console.error('Error connecting to mongo', err)
  });


const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express View engine setup

app.use(require('node-sass-middleware')({
  src:  path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));



// default value for title local
app.locals.title = 'Find&Fix';

// configuration of passport security

app.use(session({
  secret: "our-passport-local-strategy-app",
  resave: true,
  saveUninitialized: true
}));

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

app.use(flash());
passport.use(new LocalStrategy({
  passReqToCallback: true},
  (req,username, password, next) => {
  User.findOne({ username }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: "Incorrect username" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: "Incorrect password" });
    }

    return next(null, user);
  });
}));

app.use((req,res,next)=>{
  if(req.user){
    console.log(req.user);
    res.locals.username = req.user.username;
  }
  next();
});


app.use(passport.initialize());
app.use(passport.session());




// const index = require('./routes/index');
// app.use('/', index);

const authRoutes = require("./routes/auth-routes");
app.use('/', authRoutes);


module.exports = app;
