const express = require('express');

const router = express.Router();

const db_connect = require('../db_connect')

const checkauth = require('../middlewares/check-auth')

router.post('/create-profile', checkauth, (req, res) => {
    var today = new Date().getTime();
    const user_profile = {
        client_id: req.decoded.payload.id,
        date_of_birth: req.body.date_of_birth,
        address: req.body.address,
        company_name: req.body.company_name,
        created_at: today,
        updated_at: today
    }
    db_connect.query('INSERT into clients_profile set ?', user_profile,
        function (err, result) {
            if (err) {
                res.status(400).json({
                    status: false,
                    msg: "user already exist"
                })
            } else if (!result.affectedRows) {
                res.status(400).json({
                    status: false,
                    msg: "user already exist1"
                })
            } else {
                res.status(200).json({
                    user: result,
                    status: true,
                    msg: "user created there profile",
                    mobile: result.mobile
                })
            }
        })
});

router.get('/profile',checkauth, (req, res) => {
    
    db_connect.query('select date_of_birth,address,company_name from clients_profile where client_id = ?',[req.decoded.payload.id],function(err,data){
        if(err){
            res.status(422).json({status:false,message:"Something Went Wrong"})
        }else{
            res.status(200).json({status:true,message:"Retrived Data Successfully",data:data})

        }
    })
})
//api for updating user profile //
router.put('/update-profile', checkauth, (req, res) => {
    var today = new Date().getTime();
    const user_update_profile = {
        client_id: req.decoded.payload.id,
        date_of_birth: req.body.date_of_birth,
        address: req.body.address,
        company_name: req.body.company_name,
        // created_at: today,
        updated_at: today
    }

    // console.log('update clients_profile SET date_of_birth=?,address=?,company_name=?,updated_at=? where client_id=?', [req.body.date_of_birth, req.body.address, req.body.company_name, req.decoded.payload.id])
    db_connect.query('UPDATE clients_profile SET date_of_birth=?,address=?,company_name=?,updated_at=? where client_id=?', [req.body.date_of_birth, req.body.address, req.body.company_name, today, req.decoded.payload.id],
        function (err, value) {
            if (!!err) console.log("Error in Query", err);
            else {
                res.status(200).json({
                    statusCode: 200,
                    status: "Success",
                    msg: "updated profile ",
                })
            }
        })

});
module.exports = router;