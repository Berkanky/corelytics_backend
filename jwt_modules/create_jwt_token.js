const jwt = require("jsonwebtoken");
const crypto = require('crypto');

var is_prod = process.env.NODE_ENV === "production" ? true : false;

var { SECRET_KEY, JWT_ISSUER_PROD, JWT_AUDIENCE_PROD, JWT_ISSUER_DEV, JWT_AUDIENCE_DEV, JWT_TOKEN_ALGORITHM } = process.env;
if (!SECRET_KEY || SECRET_KEY.length < 32) throw new Error('SECRET_KEY zayıf veya tanımsız');

var issuer = is_prod ? JWT_ISSUER_PROD : JWT_ISSUER_DEV;
var audience = is_prod ? JWT_AUDIENCE_PROD : JWT_AUDIENCE_DEV;

if (!issuer)   throw new Error("JWT_ISSUER tanımsız");
if (!audience) throw new Error("JWT_AUDIENCE tanımsız");
if (!JWT_TOKEN_ALGORITHM) throw new Error("JWT_TOKEN_ALGORITHM tanımsız");

var create_jwt_token = async (req, res, UserId, expiresIn, session_id, temporary) => {

  var searched_vehicle_owner_id = null;
  if( req?.searched_vehicle_owner_id ) searched_vehicle_owner_id = req.searched_vehicle_owner_id;

  var jti = crypto.randomUUID();

  var payload = {
    UserId: UserId, 
    jti: jti, 
    session_id: session_id,
    searched_vehicle_owner_id: searched_vehicle_owner_id,
    temporary: temporary
  };

  if( searched_vehicle_owner_id == null ) delete payload.searched_vehicle_owner_id;

  var options = { 
    algorithm: JWT_TOKEN_ALGORITHM,
    issuer: issuer,
    audience: audience,
    expiresIn: expiresIn
  };

  try{

    var Token = jwt.sign( payload, SECRET_KEY, options);
    if( !Token ) return res.status(500).json({ message: 'Unexpected error generating session token. Please try again.' });
    
    return { Token, jti, session_id};

  }catch(err){
    var message = " Unable to generate session token. Please try again later.";
    throw message;
  }
};

module.exports = create_jwt_token;