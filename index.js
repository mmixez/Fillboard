var express = require('express');
var bp = require('body-parser');
var bcrypt = require('bcrypt');
var mysql = require('mysql');

var app = express();
var {body, validationResult} = require('express-validator');

app.set('views', 'views');
app.set('view engine', 'ejs');
app.use(bp.json());

app.use('/public', express.static('public'));

// shows which port is listening
var listener = app.listen(3000, function(){
    console.log('Listening on port ' + listener.address().port);
});

/* for some reason localhost:3000 doesn't work here but the above code does
app.listen(3000, () => {
    console.log('Server running on port 3000!');
}); */

var urlParser = bp.urlencoded({extended: false});

// This is the DB Connection
var sqlConn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "0906clcl",
    database: "fillboard"
});

sqlConn.connect((err) => {
    if(err) console.log(err)
    else  {
        console.log('Successfully connected to SQL database!')
    }
});

app.get('/', (req, res) => {
    res.render('pages/home')
});

app.get('/signup', (req, res) => {
    res.render('pages/signup')
});

app.get('/signin', (req, res) => {
    res.render('pages/login')
});

// This is hardcoded for ian username - the value needs to be forwarded in the url probably
// See in main.ejs how the values are accessed from the query result
// http://localhost:3000/main?username=ian (there MUST be username = 'ian' in the DB)
app.get('/main', (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username = 'ian';`, function (err, qres, fields) {
        if(err){
            throw err; 
        }
        else {
            res.render('pages/main', {
                query_data: qres // this is the data property to access
            });
        }
    })
});

app.post('/post_text', urlParser,
    body('post_heading').isLength({min:1, max: 45}).withMessage('heading can not be empty'),
    body('post_text').isLength({min:1, max: 200}).withMessage('Text can not be empty!')
 ,(req, res) => {
    var errs = validationResult(req);
    if(!errs.isEmpty()) {
        return res.status(400).json({errs: errs.array()})
    } else {
        // event id is hardcoded for now !!! TODO: change 
        sqlConn.query(`INSERT INTO posts (heading, post_text, event_id) VALUES ('${req.body.post_heading}', '${req.body.post_text}', 3);`);
        res.redirect('/main')
    }
});

//an example how to read data from the frontend and read them from the DB
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
                        res.redirect('/main');
                    } else {
                        console.log('Wrong username and password combo!')
                    }
                })
            }
        })
    }
});

//an example to store data from the frontend to the DB
app.post('/signup', urlParser,
    body('username').isLength({min:1, max: 45}).withMessage('Username can not be empty!'),
    body('email').isEmail().withMessage('Must be email!'),
    body('password').notEmpty().withMessage('Password cannot be empty!'),
    body('confpassword').notEmpty().custom((pwrd, {req}) => pwrd === req.body.password).withMessage('Both passwords must match!')
 ,(req, res) => {
    var errs = validationResult(req);
    if(!errs.isEmpty()) {
        return res.status(400).json({errs: errs.array()})
    } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            sqlConn.query(`INSERT INTO fillboard_user (username, email, password)VALUES ('${req.body.username}', '${req.body.email}', '${hash}');`);
        })
        res.redirect('/signin')
    }
});