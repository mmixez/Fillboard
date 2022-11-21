var express = require('express');
var bp = require('body-parser');
var bcrypt = require('bcrypt');
var mysql = require('mysql');
const session = require('express-session');

var app = express();
var {body, validationResult} = require('express-validator');

// sets up for css
app.set('views', 'views');
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

app.use(bp.json());

// parameters for session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUnitialized: false
}));

// url parser used to decipher input from forms
var urlParser = bp.urlencoded({extended: false});

// db connection obj
var sqlConn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "MySQLAdmin",
    database: "Fillboard"
})

// check db connection
sqlConn.connect((err) => {
    if(err) console.log(err)
    else  {
        console.log('Successfully connected to SQL database!')
    }
})

app.get('/', (req, res) => {
    res.render('pages/signup')
});

app.get('/signup', (req, res) => {
    res.render('pages/signup')
});

app.get('/signin', (req, res) => {
    res.render('pages/login')
});

//----------------------------------------- EVENT PAGE -----------------------------------------

app.get('/events', (req, res) => {
    sqlConn.query(`SELECT * FROM event;`, function (err, qres_event, fields) {
        if(err){
            throw err; 
        }
        else {
            sqlConn.query(`SELECT * FROM country ORDER BY name ASC;`, function (err, qres_country, fields) {
                if(err){
                    throw err; 
                }
                else {
                    res.render('pages/events', {
                        event_data: qres_event,
                        country_data: qres_country 
                    });
                }
            })
        }
    })
});

app.get('/events_search', (req, res) => {
    res.render('pages/events', {
        event_data: req.session.qres_event,
        country_data: req.session.qres_country
    })
});

app.post('/search_for_events', urlParser,
    body('eventname'),
    body('country'),
    body('city'),
    body('category'),
    body('start-date'),
    body('end-date'),
    (req, res) => {
    sqlConn.query(`SELECT * FROM event WHERE event_name = "${req.body.eventname}";`, function (err, qres_event, fields) {
        if(err){
            throw err; 
        }
        else {
            sqlConn.query(`SELECT * FROM country ORDER BY name ASC;`, function (err, qres_country, fields) {
                if(err){
                    throw err; 
                }
                else {
                    req.session.qres_event = qres_event;
                    req.session.qres_country = qres_country;
                    res.redirect('/events_search');
                }
            })
        }
    })
});

//----------------------------------------- PROFILE PAGE -----------------------------------------

app.get('/profile', (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username = '${req.session.username}';`, function (err, qres_user, fields) {
        if(err){
            throw err; 
        }
        else {
            res.render('pages/profile', {
                user_data: qres_user 
            });
        }
    })
});

// lines 55-77 needed for edit/save profile req's
app.get('/editProfile', (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username = '${req.session.username}';`, function (err, qres_user, fields) {
        if(err){
            throw err; 
        }
        else {
            res.render('pages/editProfile', {
                user_data: qres_user //this is the data property to access
            });
        }
    })
});

app.get('/main', (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username = '${req.session.username}';`, function (err, qres_user, fields) {
        if(err){
            throw err; 
        }
        else {
            sqlConn.query(`SELECT * FROM posts p, event e WHERE p.event_id = e.id_event ORDER BY p.idposts DESC;`, 
            function (err, qres_posts, fields) {
                if(err){
                    throw err; 
                }
                else {
                    sqlConn.query(`SELECT * FROM category;`, function (err, qres_categories, fields) {
                        if(err){
                            throw err; 
                        }
                        else {
                            sqlConn.query(`SELECT * FROM event;`, function (err, qres_events, fields) {
                                if(err){
                                    throw err; 
                                }
                                else {
                                    res.render('pages/main', {
                                        user_data: qres_user,
                                        post_data: qres_posts,
                                        category_data: qres_categories,
                                        event_data: qres_events
                                    });
                                }
                            })
                        }
                    })
                }
            })
        }
    })
});


app.post('/main_to_event',(req, res) => {
    res.redirect('/events');
});

app.post('/main_to_profile',(req, res) => {
    res.redirect('/profile');
});

app.post('/profile_to_main', (req, res) => {
    res.redirect('/main');
});

app.post('/editProfile', (req, res) => {
    res.redirect('/editProfile');
});

app.post('/saveProfile', urlParser, body('birthday'),body('gender'),body('biography'),(req, res) => {
    sqlConn.query(`UPDATE fillboard_user SET birthday="${req.body.birthday}", gender="${req.body.gender}", biography="${req.body.biography}" WHERE username="${req.session.username}";`);
    res.redirect('/profile');
});

app.post('/main', (req,res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username = '${req.session.username}';`, function (err, qres, fields) {
        if(err){
            throw err; 
        }
        else {
            req.session.qres=qres;
        }
    })
    res.redirect('/main');
});

app.post('/post_text', urlParser,
    body('post_heading').isLength({min:1, max: 45}).withMessage('heading can not be empty'),
    body('post_text').isLength({min:1, max: 200}).withMessage('Text can not be empty!')
 ,(req, res) => {
    var errs = validationResult(req);
    if(!errs.isEmpty()) {
        return res.status(400).json({errs: errs.array()})
    } else {
        sqlConn.query(`INSERT INTO posts (heading, post_text, event_id) VALUES ('${req.body.post_heading}', '${req.body.post_text}', 3);`);
        res.redirect('/main')
    }
});

app.post('/post_img',urlParser,(req, res) => {
    alert("Test");
});

app.post('/signin', urlParser, 
    body('email').isEmail().withMessage('Must be email!'),
    body('password').notEmpty().withMessage('Password cannot be empty!')
,(req, res) => {
    var errs = validationResult(req);
    if(!errs.isEmpty()) {
        return res.status(400).json({errs: errs.array()})
    } else {
        sqlConn.query(`SELECT * FROM fillboard_user WHERE email='${req.body.email}'`, (err, qres, fields) => {
            if(err) throw err;
            if(qres.length == 0) {
                console.log('There is no user that exists with that email!')
            } else {
                bcrypt.compare(req.body.password, qres[0]['password']).then((result) => {
                    if(result == true) {
                        req.session.qres=qres;
                        req.session.username=qres[0]['username'];
                        res.redirect('/main');
                    } else {
                        console.log('Wrong username and password combo!')
                    }
                })
            }
        })
    }
});

// lines 144-148 needed to receive logout req
app.post('/logout', (req,res) => {
    res.redirect('/signup');
});

app.post('/signup', urlParser,
    body('username').isLength({min:1, max: 45}).withMessage('Username can not be empty!'),
    body('email').isEmail().withMessage('Must be email!'),
    body('password').notEmpty().withMessage('Password cannot be empty!'),
    body('confpassword').notEmpty().custom((pwrd, {req}) => pwrd === req.body.password).withMessage('Both passwords must match!')
 ,(req, res) => {
    var errs = validationResult(req);
    if(req.body.signin){
        res.redirect('/signin');
    }else{
        if(!errs.isEmpty()) {
            return res.status(400).json({errs: errs.array()})
        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                sqlConn.query(`INSERT INTO fillboard_user (username, email, password)VALUES ('${req.body.username}', '${req.body.email}', '${hash}');`);
            })
            res.redirect('/signin')
        }
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000!');
});
