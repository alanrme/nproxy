const LocalStrategy = require('passport-local').Strategy;
const { pool } = require('./index')
const bcrypt = require('bcrypt')

function initialize(passport) {
    authenticate = async (email, password, done) => {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query(`SELECT * FROM users WHERE email=$1`, [email], async function(err, result) {
            user = result.rows[0]
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: "Invalid email" });
            } else {
                bcrypt.compare(password, user.password, function(err, res) {
                    console.log("Hash matched:" + res)
                    if (res) {
                        console.log("Successful login")
                        return done(null, user)
                    } else {
                        return done(null, false, { message: "Invalid password" });
                    }
                });
            }
        });
    }

    passport.use(new LocalStrategy({
        emailField: "email",
        passwordField: "password"
    }, authenticate));

    passport.serializeUser(function(user, done) {
        done(null, user.email);
    });
    
    passport.deserializeUser(async function(email, done) {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query(`SELECT * FROM users WHERE email=$1`, [email], async function(err, result) {
            if (err)
                throw err;
            user = result.rows[0]
            done(null, user);
        })
    });
}

module.exports = initialize;