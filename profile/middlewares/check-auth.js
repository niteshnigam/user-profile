const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        const jwt_token = req.headers.authorization;
        console.log(jwt_token);
         jwt.verify(jwt_token, 'SCERET',function(err, decoded) {
            if (err) {
                return res.status(401).json({"error": true, "message": 'Unauthorized access.' });
            }else{
            req.decoded = decoded;
            console.log(req.decoded,decoded,"decodedata")
            next();
            }
        })
       
    }catch(error){
        console.log(error)
        return res.status(401).json({
            message: 'Auth failed'
        })
    }
};