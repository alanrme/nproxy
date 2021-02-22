const express = require('express');
const app = express();
const port = 80;
const passport = require('passport');
const bcrypt = require('bcrypt')
const fs = require('fs')
const session = require('express-session');
const httpProxy = require('http-proxy');
const http = require('http')

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

module.exports = { pool };


const initializePassport = require('./passport')
initializePassport(passport)


// generate site with Jekyll
console.log('Generating website')
// execute synchronously, so the program doesn't run till this is finished
const childProcess = require('child_process');
childProcess.execSync('bundle exec jekyll build');


var proxy = httpProxy.createProxyServer({ secure: true });
// actual proxying part
http.createServer(function(req, res) {
    proxy.web(req, res, { target: 'http://138.201.66.160/' });
}).listen(5050);


// EXPRESS STUFF
// app.use
const publicdir = __dirname + '/_site';
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicdir));
app.use('/css', express.static(publicdir + '/css'));
app.use('/img', express.static(publicdir + '/img'));
app.use('/js', express.static(publicdir + '/js'));
app.use(session({
    secret: config.secret,
    resave: false,
    saveUninitialized: true
})); // put above passport things cuz it breaks if it's not??
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) { // makes urls not need .html at the end
    if (req.path.indexOf('.') === -1) {
        var file = publicdir + req.path + '.html';
        fs.exists(file, function(exists) {
            if (exists) req.url += '.html';
            next();
        });
    } else next();
});


function checkNotAuth(req, res, next) {
    if(req.user) {
        return next();
    }
    res.redirect('/login');
}
function checkAuth(req, res, next) {
    if(req.user) {
        res.redirect('/dash');
    }
    return next();
}


app.get('/', function(req, res){
    res.send('');
});

app.post('/join', async function (req, res, next) {
    if (!req.user)
        next(new Error("Not logged in"))
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
                        res.json({ message: "Success" });
                        return;
                    }
                });
            }
        });
        client.release();
    } catch(e){throw(e)}
});

app.post('/login', passport.authenticate('local', {
    successRedirect: "/dash",
    failureRedirect: "/login"
}), (req, res, next) => {
    console.log(req.body.username)
})

app.get('/logout', function(req, res){
    req.logOut();
    res.redirect('/');
});

app.get('/dash', checkNotAuth, function (req, res, next) {
    res.sendFile(publicdir+"/dashboard.html")
});

app.get('/login', checkAuth, function (req, res, next) {
    res.sendFile(publicdir+"/login-register.html")
});

app.post('/authenticated', function (req, res, next) {
    // check if user is authenticated
    if (req.user) res.send(true)
    else res.send(false)
});

app.post('/listproxies', async function (req, res, next) {
    if (!req.user)
        next(new Error("Not logged in"))
    try{
        const client = await pool.connect()
        await client.query('BEGIN')
        await client.query(`SELECT * FROM proxies WHERE email=$1`, [req.user.email], function(err, result) {
            proxies = [];
            for (i in result.rows) {
                proxies.push(result.rows[i])
            }
            res.send(proxies)
        });
        client.release();
    } catch(e){throw(e)}
});

app.post('/addproxy', async function (req, res, next) {
    if (!req.user)
        next(new Error("Not logged in"))
    try{
        proxy = req.body;

        splitIp = proxy.ip.split(".");
        for (i in splitIp) {
            if (isNaN(parseInt(splitIp[i])) || splitIp[i] > 255) return next(new Error("Invalid IP"))
        }
        if (isNaN(parseInt(proxy.port)) || proxy.port > 65535 || proxy.port < 1) return next(new Error("Invalid port"))
        if (!/^[a-zA-Z]+$/.test(proxy.subdomain))
            return next(new Error("Invalid subdomain (use alphabets only!)"))

        const client = await pool.connect();
        await client.query('BEGIN');
        premium = "";
        await client.query(`SELECT * FROM users WHERE email=$1`, [req.user.email], (err, res) => {
            if (res.rows[0]) premium = res.rows[0].premium;
        })
        await client.query(`SELECT * FROM proxies WHERE email=$1`, [req.user.email], async function(err, result) {
            if(result.rows[0] && !premium) {
                next(new Error('You have used your 1 free proxy.'))
            } else if(result.rows[9]) {
                next(new Error('You have used your 10 total proxies.'))
            } else {
                await client.query(`SELECT * FROM proxies WHERE subdomain=$1`, [proxy.subdomain], (err, result) => {
                    if (result.rows[0]) return next(new Error('This subdomain is taken!'));

                    client.query(`INSERT INTO proxies (email, ip, port, subdomain) VALUES ($1, $2, $3, $4)`,
                    [req.user.email, proxy.ip, proxy.port, proxy.subdomain], function(err, result) {
                        if(err){ console.log(err); }
                        else {
                            client.query('COMMIT');
                            res.json({ message: "Success" });
                            return;
                        }
                    });
                })
            }
        });
        client.release();
    } catch(e){throw(e)}
});

app.post('/delproxy', async function (req, res, next) {
    if (!req.user)
        next(new Error("Not logged in"))
    try{
        const client = await pool.connect();
        await client.query('BEGIN');
        await client.query(`SELECT * FROM proxies WHERE subdomain=$1`, [res.body.subdomain], (err, result) => {
            if (!result.rows[0]) return next(new Error('This doesn\'t exist anymore. Try refreshing.'));

            client.query(`DELETE FROM proxies WHERE subdomain=$1`, [res.body.subdomain], (err, result) => {
                if(err){ console.log(err); }
                else {
                    client.query('COMMIT');
                    res.json({ message: "Success" });
                    return;
                }
            });
        })
        client.release();
    } catch(e){throw(e)}
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