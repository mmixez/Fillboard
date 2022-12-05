var express = require('express');
var bp = require('body-parser');
var bcrypt = require('bcrypt');
var mysql = require('mysql');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require("fs");

var app = express();
var { body, validationResult } = require('express-validator');
const { getSystemErrorMap } = require('util');
const { Console } = require('console');
const { stringify } = require('querystring');
const { start } = require('repl');

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

const upload = multer({
    dest: __dirname + '/public/images/'
});

// url parser used to decipher input from forms
var urlParser = bp.urlencoded({ extended: false });

let sqlConn;

// process.env.DATABASE_URL is set on the Heroku cloud server
if (process.env.DATABASE_URL) {
    console.log("running production database setup");

    sqlConn = mysql.createPool(process.env.DATABASE_URL);

    sqlConn.on("connection", (connection) => {
        console.log('Successfully connected to SQL database!');
    });

} else {
    console.log("running local database setup");
    sqlConn = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        password: "MySQLAdmin", //might have to change this to your pwd
        database: "Fillboard"
    });

    // check db connection
    sqlConn.connect((err) => {
        if (err) console.log(err)
        else {
            console.log('Successfully connected to SQL database!');
        }
    })
}


app.get("/", express.static(path.join(__dirname, "./views/pages")));

//----------------------------------------- EVENT PAGE -----------------------------------------

app.get('/events', (req, res) => {
    sqlConn.query(`SELECT event_name, e.description , begin_date, end_date, id_event,
    min_participants, max_participants, sub_category_name, category_name, event_picture_path, cnty.name, l.city_name, l.zip, l.street_address, country_code
    FROM event e, sub_category sc, category c, location l, country cnty
    WHERE e.sub_category_idsub_category = sc.idsub_category AND sc.category_id_category = c.id_category AND e.location_idlocation = l.idlocation
    AND l.country_country_code = cnty.country_code ORDER BY begin_date ASC;`,
        function (err, qres_event, fields) {
            if (err) {
                throw err;
            }
            else {
                sqlConn.query(`SELECT * FROM country ORDER BY name ASC;`, function (err, qres_country, fields) {
                    if (err) {
                        throw err;
                    }
                    else {
                        sqlConn.query(`SELECT * FROM category ORDER BY category_name ASC;`, function (err, qres_category, fields) {
                            if (err) {
                                throw err;
                            }
                            else {
                                res.render('pages/events', {
                                    event_data: qres_event,
                                    country_data: qres_country,
                                    category_data: qres_category
                                });
                            }
                        })
                    }
                })
            }
        })
});

app.get('/events_search', (req, res) => {
    res.render('pages/events', {
        event_data: req.session.qres_event,
        country_data: req.session.qres_country,
        category_data: req.session.qres_category
    })
});

app.post('/search_for_events', urlParser,
    body('eventname'),
    body('country'),
    body('city'),
    body('zip'),
    body('street'),
    body('category'),
    body('sub_category'),
    (req, res) => {
        sqlConn.query(
            `SELECT event_name, e.description , begin_date, end_date, id_event,
        min_participants, max_participants, sub_category_name, category_name, event_picture_path, cnty.name, l.city_name, l.zip, l.street_address
        FROM event e, sub_category sc, category c, location l, country cnty
        WHERE e.sub_category_idsub_category = sc.idsub_category AND sc.category_id_category = c.id_category AND e.location_idlocation = l.idlocation
        AND l.country_country_code = cnty.country_code
        AND e.event_name LIKE  "%${req.body.eventname}%" AND cnty.name LIKE "%${req.body.country}%" 
        AND l.city_name LIKE "%${req.body.city}%" AND l.zip LIKE "%${req.body.zip}%" 
        AND l.street_address LIKE "%${req.body.street}%"
        AND c.category_name LIKE "%${req.body.category}%" AND sc.sub_category_name LIKE "%${req.body.sub_category}%" ORDER BY begin_date ASC;`,
            function (err, qres_event, fields) {
                if (err) {
                    throw err;
                }
                else {
                    sqlConn.query(`SELECT * FROM country ORDER BY name ASC;`, function (err, qres_country, fields) {
                        if (err) {
                            throw err;
                        }
                        else {
                            sqlConn.query(`SELECT * FROM category ORDER BY category_name ASC;`, function (err, qres_category, fields) {
                                if (err) {
                                    throw err;
                                }
                                else {
                                    req.session.qres_event = qres_event;
                                    req.session.qres_country = qres_country;
                                    req.session.qres_category = qres_category;
                                    res.redirect('/events_search');
                                }
                            })
                        }
                    })
                }
            })
    });

app.post('/events_category_chosen', urlParser,
    body('category'),
    (req, res) => {
        sqlConn.query(`SELECT * from sub_category sc WHERE sc.category_id_category = "${req.body.category}";`,
            function (err, qres_event, fields) {
                if (err) {
                    throw err;
                }
                else {
                    sqlConn.query(`SELECT * FROM country ORDER BY name ASC;`, function (err, qres_country, fields) {
                        if (err) {
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

app.post('/event_back_main', (req, res) => {
    res.redirect('/main');
});

app.post('/create_event', urlParser,
    body('eventname').notEmpty().withMessage('heading can not be empty'),
    body('event_description'),
    body('country').notEmpty().withMessage("Please select country"),
    body('city').notEmpty().withMessage("Please select city"),
    body('zip').notEmpty().withMessage("Please select zip"),
    body('street').notEmpty().withMessage("Please select street"),
    body('category').notEmpty().withMessage("Please select category"),
    body('sub_category').notEmpty().withMessage("Please insert sub category"),
    body('start_date').notEmpty().withMessage("Please select start date"),
    body('end_date').notEmpty().withMessage("Please select end date"),
    body('min_participants').notEmpty().withMessage("Please select min participants"),
    body('max_participants').notEmpty().withMessage("Please select max participants"),
    (req, res) => {
        var errs = validationResult(req);

        if (!errs.isEmpty()) {
            res.render('./pages/error', {
                error: "Must fill all fields! Your event should have: Name, Description, Country, City, Zip Code, Street, Start and End date/times, Minimum and Maximum participants!"
            })
        } else {
            sqlConn.query(`SELECT country_code FROM country WHERE name = '${req.body.country}';`, (err, qres, fields) => {
                if (err) throw err;
                else {
                    sqlConn.query(`INSERT INTO location (country_country_code, city_name, zip, street_address) 
                    VALUES ('${qres[0]['country_code']}', '${req.body.city}', ${req.body.zip}, '${req.body.street}');`, (err, insert_location, fields) => {
                        if (err) throw err;
                        else {
                            sqlConn.query(`SELECT * from category WHERE category_name = '${req.body.category}';`, (err, qres_category, fields) => {
                                if (err) throw err;
                                else {
                                    sqlConn.query(`INSERT INTO sub_category (sub_category_name, category_id_category) 
                                                    VALUES ('${req.body.sub_category}', ${qres_category[0]['id_category']});`, (err, insert_sub_category, fields) => {
                                        if (err) throw err;
                                        else {
                                            sqlConn.query(`INSERT INTO event (event_name, description, begin_date, end_date, location_idlocation, 
                                                sub_category_idsub_category, min_participants, max_participants) 
                                                VALUES ('${req.body.eventname}', '${req.body.event_description}', 
                                                '${req.body.start_date}', '${req.body.end_date}', 
                                                ${insert_location.insertId}, ${insert_sub_category.insertId}, ${req.body.min_participants}, ${req.body.max_participants});`);

                                            // get event id that was just created
                                            sqlConn.query(`SELECT * FROM event WHERE event_name='${req.body.eventname}' AND description='${req.body.event_description}';`, (err, qres, fields) => {
                                                if (err) {
                                                    throw err;
                                                }
                                                else {
                                                    // if image uploaded => rename image to eventID.png, else => skip
                                                    const tempPath = path.join(__dirname, "./public/images/event_pictures/", `${req.session.username}.png`);
                                                    const targetPath = path.join(__dirname, "./public/images/event_pictures/", `${req.session.username}_${qres[0]['id_event']}.png`);
                                                    if (fs.existsSync(tempPath)) {
                                                        fs.rename(
                                                            tempPath,
                                                            targetPath,
                                                            err => {
                                                                if (err) { throw err; }
                                                            }
                                                        )
                                                    }
                                                    sqlConn.query(`UPDATE event SET event_picture_path = '${req.session.username}_${qres[0]['id_event']}' WHERE id_event='${qres[0]['id_event']}';`);
                                                }
                                            });
                                        }
                                    });
                                }
                            })
                        }
                    });
                }
            })
            res.redirect('/events')
        }
    }
);

app.post('/event_img', upload.single("fileToUpload"), urlParser, (req, res) => {
    if (!req.file) {
        res.redirect('/img_error');
    } else {
        const tempPath = req.file.path;
        const targetPath = path.join(__dirname, "./public/images/event_pictures/", `${req.session.username}.png`);

        if (path.extname(req.file.originalname).toLowerCase() === ".png") {
            fs.rename(tempPath, targetPath, err => {
                if (err) {
                    throw err;
                }
                res.redirect('/events');
            });
        } else {
            fs.unlink(tempPath, err => {
                if (err) {
                    throw err;
                }
                res.status(403).contentType("text/plain").end("Only .png files are allowed!");
            });
        }
    }
});

app.post('/join_event', urlParser,
    body('event_id'),
    (req, res) => {
        console.log("Joining event - Username: " + req.session.username + " event id: " + req.body.event_id)
        sqlConn.query(`SELECT id_fillboard_user FROM fillboard_user WHERE username = "${req.session.username}";`, (err, qres, fields) => {
            if (err) throw err;
            else {
                sqlConn.query(`INSERT INTO participates (user_id, event_id) VALUES (${qres[0]['id_fillboard_user']},${req.body.event_id});`
                    , (err) => {
                        if (err) {
                            if (err.code = "ER_DUP_ENTRY") {
                                res.render('./pages/error', {
                                    error: "You already joined this event!"
                                });
                            } else {
                                throw err;
                            }
                        } else {
                            res.redirect('/events');
                        }
                    })
            }

        })
    });

app.get('/join_event_error', (req, res) => {
    res.render('./pages/error', {
        error: "You already joined this event!"
    });
})

//----------------------------------------- PROFILE PAGE -----------------------------------------

app.get('/profile', (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username = '${req.session.username}';`, function (err, qres_user, fields) {
        if (err) {
            throw err;
        }
        else {
            sqlConn.query(`SELECT * FROM event e, participates p WHERE e.id_event = p.event_id AND user_id = ${req.session.id_fillboard_user} ORDER BY e.begin_date;`, function (err, qres_event, fields) {
                if (err) {
                    throw err;
                }
                else {
                    res.render('pages/profile', {
                        user_data: qres_user,
                        event_data: qres_event
                    });
                }
            })
        }
    })
});

app.get('/editProfile', (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username = '${req.session.username}';`, function (err, qres_user, fields) {
        if (err) {
            throw err;
        }
        else {
            res.render('pages/editProfile', {
                user_data: qres_user //this is the data property to access
            });
        }
    })
});

app.post('/profile_to_main', (req, res) => {
    res.redirect('/main');
});

app.post('/editProfile', (req, res) => {
    res.redirect('/editProfile');
});

//----------------------------------------- EDIT PROFILE PAGE -----------------------------------------

app.post("/uploadpfp", upload.single("pic"), (req, res) => {
    if (!req.file) {
        res.redirect('/img_error');
    } else {
        const tempPath = req.file.path;
        const targetPath = path.join(__dirname, "./public/images/user_pictures/", `${req.session.id_fillboard_user}pfp.png`);

        if (path.extname(req.file.originalname).toLowerCase() === ".png") {
            fs.rename(tempPath, targetPath, err => {
                if (err) {
                    throw err;
                }
                res.redirect('/profile');
            });
        } else {
            fs.unlink(tempPath, err => {
                if (err) {
                    throw err;
                }
                res.status(403).contentType("text/plain").end("Only .png files are allowed!");
            });
        }
    }
}
);

app.post("/uploadbackground", upload.single("pic"), (req, res) => {
    if (!req.file) {
        res.redirect('/img_error');
    } else {
        const tempPath = req.file.path;
        const targetPath = path.join(__dirname, "./public/images/user_pictures/", `${req.session.id_fillboard_user}background.png`);

        if (path.extname(req.file.originalname).toLowerCase() === ".png") {
            fs.rename(tempPath, targetPath, err => {
                if (err) {
                    throw err;
                }
                res.redirect('/profile');
            });
        } else {
            fs.unlink(tempPath, err => {
                if (err) {
                    throw err;
                }
                res.status(403).contentType("text/plain").end("Only .png files are allowed!");
            });
        }
    }
}
);

app.post('/saveProfile', urlParser, body('birthday'), body('gender'), body('biography'), (req, res) => {
    sqlConn.query(`UPDATE fillboard_user SET birthday="${req.body.birthday}", gender="${req.body.gender}", biography="${req.body.biography}" WHERE username="${req.session.username}";`);
    res.redirect('/profile');
});

//----------------------------------------- MAIN PAGE -----------------------------------------

app.get('/main', (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username = '${req.session.username}';`, function (err, qres_user, fields) {
        if (err) {
            throw err;
        }
        else {
            sqlConn.query(`SELECT p.idposts, heading, post_text, event_name, begin_date, end_date, username, post_picture_path, user_id_posts
            FROM posts p, event e, fillboard_user u WHERE p.event_id = e.id_event AND p.user_id_posts = u.id_fillboard_user 
            ORDER BY p.idposts DESC;`,
                function (err, qres_posts, fields) {
                    if (err) {
                        throw err;
                    }
                    else {

                        sqlConn.query(`SELECT * FROM category;`, function (err, qres_categories, fields) {
                            if (err) {
                                throw err;
                            } else {
                                sqlConn.query(`SELECT * FROM event;`, function (err, qres_events, fields) {
                                    if (err) {
                                        throw err;
                                    }
                                    else {
                                        sqlConn.query(`SELECT event_name FROM event e, fillboard_user u, participates p WHERE e.id_event = p.event_id AND u.id_fillboard_user = p.user_id AND u.username = 
                                        "${req.session.username}";`, function (err, qres_events_participated, fields) {
                                            if (err) {
                                                throw err;
                                            }
                                            else {
                                                let postIds = qres_posts.map(q => q.idposts);
                                                let postIdQuery = postIds.join(",");


                                                sqlConn.query(`SELECT f.username, c.* FROM comments c, fillboard_user f WHERE f.id_fillboard_user = c.user_id_comments AND idposts IN (${postIdQuery});`, function (err, qres_comments, fields) {
                                                    if (err) {
                                                        throw err;
                                                    }

                                                    for (let i = 0; i < qres_comments.length; i++) {
                                                        let comment = qres_comments[i];
                                                        let id = comment.idposts;
                                                        for (let j = 0; j < qres_posts.length; j++) {
                                                            let post = qres_posts[j];
                                                            if (post.idposts === id) {

                                                                if (post.comments === undefined) {
                                                                    post.comments = [comment];
                                                                } else {
                                                                    post.comments.push(comment);
                                                                }
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    res.render('pages/main', {
                                                        user_data: qres_user,
                                                        post_data: qres_posts,
                                                        category_data: qres_categories,
                                                        event_data: qres_events,
                                                        events_participated: qres_events_participated,
                                                    });
                                                });

                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
        }
    })
});

app.post('/search_for_events_main', urlParser,
    body('eventname'),
    (req, res) => {
        sqlConn.query(`SELECT event_name, e.description , begin_date, end_date, 
    min_participants, max_participants, sub_category_name, category_name, event_picture_path FROM event e, sub_category sc, category c 
    WHERE e.sub_category_idsub_category = sc.idsub_category AND sc.category_id_category = c.id_category 
    AND e.event_name LIKE  "%${req.body.eventname}%"`,
            function (err, qres_event, fields) {
                if (err) {
                    throw err;
                }
                else {
                    sqlConn.query(`SELECT * FROM country ORDER BY name ASC;`, function (err, qres_country, fields) {
                        if (err) {
                            throw err;
                        }
                        else {
                            sqlConn.query(`SELECT * FROM category ORDER BY category_name ASC;`, function (err, qres_category, fields) {
                                if (err) {
                                    throw err;
                                }
                                else {
                                    req.session.qres_event = qres_event;
                                    req.session.qres_country = qres_country;
                                    req.session.qres_category = qres_category;
                                    res.redirect('/events_search');
                                }
                            })
                        }
                    })
                }
            })
    });


app.get('/deletePost/:idposts', (req, res) => {
    sqlConn.query(`DELETE FROM comments WHERE idposts = '${req.params.idposts}';`, function (err, fields) {
        sqlConn.query(`DELETE FROM posts WHERE user_id_posts = '${req.session.id_fillboard_user}' AND idposts = '${req.params.idposts}';`, function (err, fields) {
            if (err) {
                throw err;
            }
            else {
                res.redirect('/main');
            }
        })
    })
});

app.post('/main_to_event', (req, res) => {
    res.redirect('/events');
});

app.post('/main_to_profile', (req, res) => {
    res.redirect('/profile');
});

app.post('/main', (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username = '${req.session.username}';`, function (err, qres, fields) {
        if (err) {
            throw err;
        }
        else {
            req.session.qres = qres;
        }
    })
    res.redirect('/main');
});

app.post('/logout', (req, res) => {
    res.redirect('/signup');
});

//----------------------------------------- MAIN PAGE: POST FUNCTIONALITY  -----------------------------------------

app.post('/post_text', urlParser,
    body('post_heading').isLength({ min: 1, max: 45 }).withMessage('heading can not be empty'),
    body('post_text').isLength({ min: 1, max: 200 }).withMessage('Text can not be empty!'),
    body('post_event'),
    (req, res) => {
        var errs = validationResult(req);

        if (!errs.isEmpty()) {
            res.render('./pages/error', {
                error: "Must fill all fields! Your post should have a Title and some Post Text!"
            })
        } else {
            sqlConn.query(`SELECT id_event FROM event WHERE event_name = "${req.body.post_event}";`, (err, event_id, fields) => {
                if (event_id == 0) {
                    res.render('./pages/error', {
                        error: "Must choose an event!"
                    })
                } else {
                    sqlConn.query(`INSERT INTO posts (heading, post_text, event_id, user_id_posts) VALUES 
                    ('${req.body.post_heading}', '${req.body.post_text}', '${event_id[0]['id_event']}', 
                    '${req.session.id_fillboard_user}');`, (err) => {

                    });

                    // get post id that was just created
                    sqlConn.query(`SELECT * FROM posts WHERE user_id_posts=${req.session.id_fillboard_user} AND post_text='${req.body.post_text}'`, (err, qres, fields) => {
                        if (err) throw err;
                        else {
                            // if image uploaded => rename image to username_postID.png, else => skip
                            const tempPath = path.join(__dirname, "./public/images/post_pictures/", `${req.session.username}.png`);
                            const targetPath = path.join(__dirname, "./public/images/post_pictures/", `${req.session.username}_${qres[0]['idposts']}.png`);
                            if (fs.existsSync(tempPath)) {
                                fs.rename(
                                    tempPath,
                                    targetPath,
                                    err => {
                                        if (err) { throw err; }
                                    }
                                )
                            }
                            sqlConn.query(`UPDATE posts SET post_picture_path = '${req.session.username}_${qres[0]['idposts']}' WHERE idposts = '${qres[0]['idposts']}';`);
                        }
                    });
                    res.redirect('/main')
                }
            })
        }
    });

app.get('/img_error', (req, res) => {
    res.render('./pages/error', {
        error: "No file selected. Try again!"
    });
})

app.post('/post_img', upload.single("fileToUpload"), urlParser, (req, res) => {

    if (!req.file) {
        res.redirect('/img_error');
    } else {
        const tempPath = req.file.path;
        const targetPath = path.join(__dirname, "./public/images/post_pictures/", `${req.session.username}.png`);

        if (path.extname(req.file.originalname).toLowerCase() === ".png") {
            fs.rename(tempPath, targetPath, err => {
                if (err) {
                    throw err;
                }
                res.redirect('/main');
            });
        } else {
            fs.unlink(tempPath, err => {
                if (err) {
                    throw err;
                }
                res.status(403).contentType("text/plain").end("Only .png files are allowed!");
            });
        }
    }
});

app.post('/comments_text', urlParser,
    body('comments_text').isLength({ min: 1, max: 200 }).withMessage('Text can not be empty!')
    , (req, res) => {
        var errs = validationResult(req);

        if (!errs.isEmpty()) {
            return res.status(400).json({ errs: errs.array() })
        } else {
            sqlConn.query(`INSERT INTO comments (comments_text, idposts, user_id_comments) VALUES 
            ('${req.body.comments_text}', '${req.body.idposts}', '${req.session.id_fillboard_user}');`, (err, qres, fields) => {

                if (err) throw err;
            });
        }
        res.redirect('/main');
    });



//----------------------------------------- LOGIN PAGE -----------------------------------------

app.get('/', (req, res) => {
    res.render('pages/signup')
});

app.get('/signin', (req, res) => {
    res.render('pages/login')
});

app.post('/signin', urlParser,
    body('email').isEmail().withMessage('Must be email!'),
    body('password').notEmpty().withMessage('Password cannot be empty!')
    , (req, res) => {
        var errs = validationResult(req);
        if (!errs.isEmpty()) {
            res.render('./pages/error', {
                error: "Something went wrong with signing in! Check all fields are correct."
            })
        } else {
            sqlConn.query(`SELECT * FROM fillboard_user WHERE email='${req.body.email}'`, (err, qres, fields) => {
                if (err) throw err;
                if (qres.length == 0) {
                    res.render('./pages/error', {
                        error: "No user with that email!"
                    })
                } else {
                    bcrypt.compare(req.body.password, qres[0]['password']).then((result) => {
                        if (result == true) {
                            console.log("SUCCESSFSUL LOGIN====", qres[0]);
                            req.session.qres = qres;
                            req.session.username = qres[0]['username'];
                            req.session.id_fillboard_user = qres[0]['id_fillboard_user'];
                            res.redirect('/main');
                        } else {
                            res.render('./pages/error', {
                                error: "Wrong username and password combo!"
                            })
                        }
                    })
                }
            })
        }
    });

//----------------------------------------- FRONT/SIGNUP PAGE -----------------------------------------

app.get('/signup', (req, res) => {
    res.render('pages/signup')
});

app.post('/signup', urlParser,
    body('username').isLength({ min: 1, max: 45 }).withMessage('Username can not be empty!'),
    body('email').isEmail().withMessage('Must be email!'),
    body('password').notEmpty().withMessage('Password cannot be empty!'),
    body('confpassword').notEmpty().custom((pwrd, { req }) => pwrd === req.body.password).withMessage('Both passwords must match!')
    , (req, res) => {
        var errs = validationResult(req);
        if (req.body.signin) {
            res.redirect('/signin');
        } else {
            if (!errs.isEmpty()) {
                res.render('./pages/error', {
                    error: "Something went wrong with signing up! Check all fields are correct."
                })

            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    sqlConn.query(`INSERT INTO fillboard_user (username, email, password)VALUES ('${req.body.username}', '${req.body.email}', '${hash}');`);
                })
                res.redirect('/signin')
            }
        }
    });

//----------------------------------------- IMAGE DISPLAY FUNCTIONALITY  -----------------------------------------

app.get("/pfp.png", (req, res, err) => {
    if (fs.existsSync(path.join(__dirname, "./public/images/user_pictures/", `${req.session.id_fillboard_user}pfp.png`))) {
        res.sendFile(path.join(__dirname, "./public/images/user_pictures/", `${req.session.id_fillboard_user}pfp.png`));
    } else {
        console.log()
        res.sendFile(path.join(__dirname, "./public/images/user_pictures/", `missing_pfp.png`));
    }
});

app.get("/pfp/:id_fillboard_user.png", (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE id_fillboard_user=${req.params.id_fillboard_user}`, (err, qres) => {
        if (err) throw err;
        else {
            if (fs.existsSync(path.join(__dirname, "./public/images/user_pictures/", `${qres[0]['id_fillboard_user']}pfp.png`))) {
                res.sendFile(path.join(__dirname, "./public/images/user_pictures/", `${qres[0]['id_fillboard_user']}pfp.png`));
            } else {
                console.log()
                res.sendFile(path.join(__dirname, "./public/images/user_pictures/", `missing_pfp.png`));
            }
        }
    })
});

app.get("/pfpPost/:username.png", (req, res) => {
    sqlConn.query(`SELECT * FROM fillboard_user WHERE username='${req.params.username}'`, (err, qres) => {
        if (err) throw err;
        else {
            if (fs.existsSync(path.join(__dirname, "./public/images/user_pictures/", `${qres[0]['id_fillboard_user']}pfp.png`))) {
                res.sendFile(path.join(__dirname, "./public/images/user_pictures/", `${qres[0]['id_fillboard_user']}pfp.png`));
            } else {
                console.log()
                res.sendFile(path.join(__dirname, "./public/images/user_pictures/", `missing_pfp.png`));
            }
        }
    })
});

app.get("/post_picture/:post_picture_name", (req, res) => {
    res.sendFile(path.join(__dirname, "./public/images/post_pictures/", `${req.params.post_picture_name}.png`));
});

app.get("/background.png", (req, res) => {
    res.sendFile(path.join(__dirname, "./public/images/user_pictures/", `${req.session.id_fillboard_user}background.png`));
});

app.get("/event_pictures/:event_picture_name", (req, res) => {
    res.sendFile(path.join(__dirname, "./public/images/event_pictures/", `${req.params.event_picture_name}.png`));
});

app.get("/event_picture/:event_picture_name", (req, res) => {
    res.sendFile(path.join(__dirname, "./public/images/event_pictures/", `${req.params.event_picture_name}.png`));
});


//------------------------------------------Aboutus page--------------------------------------------

// app.post('/main_to_aboutus', (req, res) => {
//     res.redirect('/main');
// });
app.get('/aboutus', (req, res) => {
    res.render('pages/aboutus')
});


//----------------------------------------- SERVER LISTEN  -----------------------------------------

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port 3000!');
});
