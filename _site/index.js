const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const port = 80;
var passport = require('passport');
var request = require('request');
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid/v4');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs')

// Postgres
const { Pool, Client } = require('pg')
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: true
});

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
app.use('/auth', require('./auth'))


app.get('/', function(req, res){
    res.send('');
});

app.post('/join', async function (req, res, next) {
    console.log("someone tryig to join ?")
    try{
        const client = await pool.connect()
        await client.query('BEGIN')
        if (req.body.password.length < 8) next(new Error('Password too short!'))
        var pwd = await bcrypt.hash(req.body.password, 5);
        await JSON.stringify(client.query(`SELECT id FROM 'users' WHERE 'email'=$1`, [req.body.username], function(err, result) {
            if(result.rows[0]){
                next(new Error('User already registered'))
            }
            else{
                client.query(`INSERT INTO users (email, password) VALUES ($1, $2, $3)`, [uuidv4(), req.body.username, pwd], function(err, result) {
                    if(err){console.log(err);}
                    else {
                        client.query('COMMIT')
                        console.log(result)
                        res.json({ message: "Created." })
                        res.redirect('/login');
                        return;
                    }
                });   
            }
        }));
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
    res.status(err.status || 500)
    res.json({
        message: err.message,
        error: req.app.get('env') == 'development' ? err : {}
    })
})

app.listen(port);
console.log(`Listening on port ${port}`)