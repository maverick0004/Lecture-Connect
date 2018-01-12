var express = require('express'),
	app = express(),
	path = require('path'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'), 
	config = require('./config/config.js'),
	connectMongo = require('connect-mongo')(session),
	mongoose = require('mongoose').connect(config.dbURL),
	passport = require('passport'),
	FBStrategy = require('passport-facebook').Strategy,
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	rooms = [],
	todocontroller = require('./controller/controller.js'),
  bodyParser = require('body-parser');

const translate = require('google-translate-api');
	
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({secret:'I am key', resave:true, saveUninitialized:true}));


var env = process.env.NODE_ENV || 'development';


app.use(passport.initialize());
app.use(passport.session());

var user = new mongoose.Schema({
  profileID:String,
  fullname:String,
  profilePic:String
})

var userModel = mongoose.model('user', user);

passport.serializeUser(function(user, done){
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  userModel.findById(id, function(err, user) {
    done(err, user);
  })
});

require('./auth/passportauthfb.js')(passport, FBStrategy, config, mongoose,userModel);
require('./auth/passportauthgoogle.js')(passport, GoogleStrategy, config, mongoose,userModel);
require('./routes/routes.js')(express, app, passport, config, rooms);
/*
app.listen(9000, function() {
	console.log('ChatBox is working on port 9000');
	console.log('Current mode is '+ env);
})*/
app.set('port', process.env.PORT || 9000);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
require('./socket/socket.js')(io, rooms);


app.get('/translate/:lan',function(req,response) {
  translate(req.query.data, {to: req.params.lan}).then(res => {
    response.send(res.text);
    //=> I speak English
    console.log(res.from.language.iso);
    //=> nl
  }).catch(err => {
    console.error(err);
  });
});

app.get('/chatRoom',function(req,res){
	res.render("page");
});

var a = 0;
app.get('/profs',function(req,res){
	res.render("gethelp",{a:1,title:'Get Help', user:req.user,config:config});
});


server.listen(app.get('port'), function() {
	console.log('ChatBox is working on ' + app.get('port')); 
});