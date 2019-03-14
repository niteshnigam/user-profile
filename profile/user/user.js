//import db js file//
const db_connect = require('../db_connect');

//importing express module//
const express = require('express');

//importing the mail js file//
const mail = require('../mail');

//create a router for routing//
const router = express.Router();

// import this module for random string//
const uuidv4 = require('uuidv4');

//import the bcrypt module// 
const bcrypt = require('bcrypt');
const saltRounds = 10;

//import jwt
const jwt = require('jsonwebtoken');

//validating the email//
function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

//api for signup//
router.post('/signup', (req, res) => {
    var today = new Date().getTime();
    const signup1 = {
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
        status: 0,
        token: uuidv4(),
        current_at: today,
        update_at: today
    }
    console.log(signup1)
    if (!req.body.name) {
        res.status(400).json({
            status: 400,
            msg: "name required"
        })
        return

    } else if (!validateEmail(req.body.email)) {
        res.status(412).json({
            msg: "invalid email",
        })
        return

    } else if (!req.body.mobile && req.body.mobile.length != 10) {
        res.status(412).json({
            status: false,
            msg: "invalid mobile no."
        })
        return
    } else if (req.body.password !== req.body.confirmpassword) {
        res.status(412).json({
            status: false,
            msg: "password and confirm password are not same"
        })
        return
    }
    //use bcrypting for hashing and salting//
    bcrypt.hash(signup1['password'], saltRounds, function (err, hash) {

        signup1.password = hash;
        // console.log(hash);
        db_connect.query('INSERT into clients_data set ?', signup1,
            function (err, result) {
                console.log(err)
                if (err) {
                    res.status(400).json({
                        status: false,
                        msg: "user already exist"
                    })
                } else {
                    mail.mailSend({ email: req.body.email, token: signup1.token, url: 'http://localhost:4800/verify/' })
                    res.status(200).json({
                        user: result,
                        status: true,
                        msg: "user registered successfully",
                        mobile: result.mobile
                    })
                }
            })
    });
})

//this api for verification the link at the time of reset password//
router.get('/verify-resetpassword/:token', function (req, res) {

    let token = req.params.token;

    var today = new Date().getTime()
    // console.log('select * from clients_data where ' + today + '<= (SELECT update_at from clients_data where token= '+token+' and status=0 )+120000 and token= '+token+'  and status=0')

    db_connect.query('select * from clients_data where ' + today + '<= (SELECT update_at from clients_data where token= ? and status=1 )+900000 and token= ?  and status=1', [token, token], (err, data) => {
        console.log(data)
        if (!!err)
            console.log("Error in Query", err);

        else {

            if (data.length) {
                console.log("Query successfully executed.");
                db_connect.query(`UPDATE clients_data set status= true WHERE id = ${data[0].id}`, (err, value) => {
                    if (!!err) console.log("Error in Query", err);
                    else {
                        res.status(200).json({
                            statusCode: 200,
                            status: "Success",
                            msg: "email verified",
                        })
                    }
                });
            } else {
                res.status(400).json({
                    statusCode: 400,
                    status: "Failed",
                    msg: "Token expired",
                })
            }
        }


    });
})
//api for email verification at signup and login time//
router.get('/verify/:token', function (req, res) {

    let token = req.params.token;

    var today = new Date().getTime()

    db_connect.query('select * from clients_data where ' + today + '<= (SELECT update_at from clients_data where token= ? and status=0 )+120000 and token= ?  and status=0', [token, token], (err, data) => {
        console.log(data)
        if (!!err)
            console.log("Error in Query", err);

        else {

            if (data.length) {
                console.log("Query successfully executed.");
                db_connect.query(`UPDATE clients_data set status= true, token=null WHERE id = ${data[0].id}`, (err, value) => {
                    if (!!err) console.log("Error in Query", err);
                    else {
                        res.status(200).json({
                            statusCode: 200,
                            status: "Success",
                            msg: "email verified",
                        })
                    }
                });
            } else {
                res.status(400).json({
                    statusCode: 400,
                    status: "Failed",
                    msg: "Token expired",
                })
            }
        }


    });
})
//api for user-login//
router.post('/login', (req, res) => {
    if (!req.body.email) {
        res.status(412).json({
            statuscode: (412),
            msg: "email is required"
        })
    } else if (!req.body.mobile && req.body.mobile != 10) {
        res.status(412).json({
            statusCode: (412),
            msg: "mobile no. is required/invalid mobile no."
        })
    } else if (!req.body.password) {
        res.status(412).json({
            statusCode: 412,
            msg: "password is required"
        })
    }

    const token = uuidv4();
    const today = new Date().getTime();
    db_connect.query('select id,email,password,mobile,status from clients_data where email=? and mobile=?', [req.body.email, req.body.mobile], (error, user) => {
       //    console.log(error, 'select email,password,mobile,status from clients_data where email=' + req.body.email + ' and mobile=' + req.body.mobile + '')
        if (user.length == 0) {
            return res.status(412).json({
                statusCode: (412),
                msg: "user not exist"
            })
        } else if (error) {
            return res.status(412).json({
                msg: error.message
            })
        } else if (user[0].status == 0) {
            db_connect.query('UPDATE clients_data SET  token =? ,update_at =? where email=?', [token, today, req.body.email], (err, user) => {
                if (!err && user.affectedRows) {
                    mail.mailSend({ email: req.body.email, token: token, url: 'http://localhost:4800/verify/' })
                    res.status(401).json({
                        status: 401,
                        msg: "please verify your email"
                    })
                } else {
                    res.status(422).json({
                        status: 422,
                        msg: "Something went wrong ,Please try again."
                    })
                }
            })
        } else {
            console.log(user)
            bcrypt.compare(req.body.password, user[0].password, function (err, flag) {
                console.log(flag)
                if (flag) {
                    let payload = { subject: user[0].email, id:user[0].id}
                    // const token = jwt.sign(
                    //     user, config.secret, { expiresIn: config.tokenLife})
                    let jwt_token = jwt.sign(
                        {
                            payload
                        },
                        'SCERET',
                        {
                            expiresIn: "1h"
                        }
                    );
                    return res.status(200).send({
                        message: "Succesfully login",
                        data: {
                            email: req.body.email,
                            jwt_token: jwt_token
                        }
                    })
                } else {
                    return res.status(422).send({
                        message: "Authentication failed"
                    })
                }
            });

        }

    })
})

// api for the forget password//
router.put('/forgot-password', (req, res) => {
    if (!req.body.email || !req.body.mobile) {
        res.status(401).json({
            statuscode: ["REQUIRED_FIELD_MISSING"],
            msg: "email or mobile required"
        })
    } // } else {
    //     res.status(401).json({
    //         msg: error.message
    //     })
    // }

    const token = uuidv4();
    const today = new Date().getTime();
    db_connect.query('select email,mobile from clients_data where email =? or mobile =?', [req.body.email, req.body.mobile], (error, user) => {
        if (!user) {
            return res.status(500).send({
                message: "user not exist"
            })
        } else if (error) {
            return res.status(500).send({
                message: error.message
            })
        } else if (user[0].email || user[0].mobile) {
            var email = user[0].email
            db_connect.query('UPDATE clients_data SET token =? ,update_at =? where email=?', [token, today, req.body.email], (err, user) => {
                if (!err && user.affectedRows) {
                    mail.mailSend({ email: email, token: token, url: 'http://localhost:4800/verify-resetpassword/' })
                    res.status(401).json({
                        status: 401,
                        msg: "please verify your email for changing the password"
                    })
                } else {
                    res.status(422).json({
                        status: 422,
                        msg: "Something went wrong ,Please try again."
                    })
                }
            })
        }
    })
})

//api for change password//
router.put('/change-password/:token', (req, res) => {

    let token = req.params.token
    var today = new Date().getTime();
    // const token = uuidv4();
    db_connect.query('select * from clients_data where ' + today + '<= (SELECT update_at from clients_data where  token= ? and status=1 )+900000 and token= ? and status=1', [token, token], (err, data) => {
        console.log(data)
        if (!!err)
            console.log("Error in Query", err);

        else {
            bcrypt.hash(req.body.password, saltRounds, function (err, hash) {

                req.body.password = hash;
                if (data.length) {
                    console.log("Query successfully executed.");
                    db_connect.query(`UPDATE clients_data set password =? , token = null WHERE id =?`, [req.body.password, data[0].id], (err, value) => {
                        if (!!err) console.log("Error in Query", err);
                        else {
                            res.status(200).json({
                                statusCode: 200,
                                status: "Success",
                                msg: "password is successfully changed",
                            })
                        }
                    });
                } else {
                    res.status(400).json({
                        statusCode: 400,
                        status: "Failed",
                        msg: "Token expired",
                    })
                }
            })
        }
    });
})

module.exports = router; 