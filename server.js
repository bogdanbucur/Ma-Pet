global.Promise = require('bluebird');

const express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    expressLayouts = require('express-ejs-layouts');
    io = require('socket.io').listen(server),
    db = require('./models/index'),
    passport = require('passport'),
    path = require('path'),
    flash = require('connect-flash'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    env = require('./config/env'),
    formidable = require('formidable'),
    user = require('./models/user');

let users = {},
    connections = [];

const PORT = env.PORT;

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(session({
    secret: 'awesomeness',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./config/passport')(passport, user);

// APIs for Mobile
app.use('/', require('./app/routes/mobile/general'));
app.use('/user', require('./app/routes/mobile/user'));
app.use('/pets', require('./app/routes/mobile/pets'));
app.use('/location', require('./app/routes/mobile/location'));
app.use('/mp', require('./app/routes/mobile/marketplace'));
app.use('/l&f', require('./app/routes/mobile/lostAndFound'));
app.use('/agenda', require('./app/routes/mobile/agenda'));
app.use('/fs', require('./app/routes/mobile/foodStore'));
app.use('/social', require('./app/routes/mobile/social'));

// APIs for Web
app.use('/admin', require('./app/routes/web/general'));
app.use('/admin/species', require('./app/routes/web/species'));
app.use('/admin/locations', require('./app/routes/web/locations'));

// Redirect Unmatched Addresses
app.use(redirectUnmatched);
function redirectUnmatched(req, res) {
    res.redirect("/404");
}

// app.get('*', (req, res) => {
//     return res.redirect('/404');
// });

db.sequelize.sync().then(() => {
    server.listen(PORT, () => {
        console.log('Express listening on port:', PORT);
    });
});


io.sockets.on('connection', (socket) => {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    socket.on('disconnect', (data) => {
        delete users[socket.username];
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    socket.on('send message', (data, callback) => {
        let msg = data.trim();
        if (msg.substr(0, 3) === '/w ') {
            msg = msg.substr(3);
            let ind = msg.indexOf(' ');
            if (ind !== -1) {
                console.log(data, ind);
                let name = msg.substr(0, ind);
                msg = msg.substr(ind + 1);
                if (name in users) {
                    io.socket(users[name]).emit('whisper', {msg: msg, user: socket.username});
                    console.log('whisper');
                } else {
                    callback('Error. User does not exist.');
                }
            } else {
                callback('Error! Please enter a message for your whisper.');
            }
        } else {
            io.sockets.emit('new message', {msg: msg, user: socket.username});
        }
    });

    socket.on('new user', (data, callback) => {
        if (data in users) {
            callback(false);
        } else {
            callback(true);
            socket.username = data;
            users[socket.username] = data;
            updateUsernames();
        }
    });

    socket.on('room', function(room) {
        socket.join(room);
    });

    const room = 'abc123';

    function updateUsernames () {
        io.sockets.in(room).emit('get users', Object.keys(users));
    }
});
// vm IP -> 146.185.178.206