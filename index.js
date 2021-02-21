const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const port = 80;
var passport = require('passport');
var request = require('request');
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid/v4');
const fs = require('fs')
const config = require('./config')


// Postgres
const { Pool, Client } = require('pg')
const pool = new Pool({ // create new pool
    user: config.db.user,
    host: config.db.host,
    database: config.db.name,
    password: config.db.password,
    port: process.env.PGPORT,
    ssl: false // require ssl connection to pg?
});

// will emit error on behalf of idle clients
// says whether a backend error or network partition happens
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

// callback/checkout a client
pool.connect((err, client, done) => {
    if (err) throw err
    client.query('SELECT * FROM users WHERE email = $1', ["alanrd772@gmail.com"], (err, res) => {
        done()
        if (err) {
            console.log(err.stack)
        } else {
            console.log(res.rows[0])
        }
    })
})


const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(function(username, password, done) {
    client.query(`SELECT * FROM users WHERE email=$1`, [username], function(err, user) {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, { message: 'Incorrect username' });
        }
        if (!user.validPassword(bcrypt.hash(password, 5))) {
            return done(null, false, { message: 'Incorrect password' });
        }
        return done(null, user);
    });
}));


// generate site with Jekyll
console.log('Generating website')
// execute synchronously, so the program doesn't run till this is finished
const childProcess = require('child_process');
childProcess.execSync('bundle exec jekyll build');


const publicdir = __dirname + '/_site';
// EXPRESS STUFF
// app.use
app.use(function(req, res, next) { // makes urls not need .html at the end
    if (req.path.indexOf('.') === -1) {
        var file = publicdir + req.path + '.html';
        fs.exists(file, function(exists) {
            if (exists) req.url += '.html';
            next();
        });
    } else next();
});
app.use(express.static(publicdir));
app.use('/css', express.static(publicdir + '/css'));
app.use('/img', express.static(publicdir + '/img'));
app.use('/js', express.static(publicdir + '/js'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', function(req, res){
    res.send('');
});

app.post('/join', async function (req, res, next) {
    try{
        const client = await pool.connect()
        await client.query('BEGIN')
        if (req.body.password.length < 8) return next(new Error('Password too short'))
        var pwd = await bcrypt.hash(req.body.password, 5);
        await client.query(`SELECT * FROM users WHERE email=$1`, [req.body.username], function(err, result) {
            if(result.rows[0]){
                next(new Error('User already registered'))
            } else {
                if (req.body.username.trim() == '' || !req.body.username.includes("@"))
                return next(new Error('Invalid Email'));
                
                client.query(`INSERT INTO users (email, password) VALUES ($1, $2)`, [req.body.username, pwd], function(err, result) {
                    if(err){ console.log(err); }
                    else {
                        client.query('COMMIT');
                        res.json({ message: "Created" });
                        return;
                    }
                });   
            }
        });
        client.release();
    } 
    catch(e){throw(e)}
});

app.get('/account', function (req, res, next) {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
    }
});

app.get('/login', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/account');
    }
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/account',
    failureRedirect: '/login',
    failureFlash: true
}), function(req, res) {
    if (req.body.remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    } else {
        req.session.cookie.expires = false; // Cookie expires at end of session
    }
    res.redirect('/');
});

app.get('/logout', function(req, res){
    console.log(req.isAuthenticated());
    req.logout();
    console.log(req.isAuthenticated());
    res.json({ message: "Logged out." })
    res.redirect('/');
});


// error handler
app.use(function(err, req, res, next) {
    console.log(err.message)
    res.status(err.status || 500)
    res.json({
        message: err.message,
        error: req.app.get('env') == 'development' ? err : {}
    })
})

app.listen(port);
console.log(`Listening on port ${port}`)