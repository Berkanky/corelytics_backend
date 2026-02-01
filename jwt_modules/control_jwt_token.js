const jwt = require("jsonwebtoken");

var extract_service_token = require("../functions/extract_service_token");
var format_date = require("../functions/format_date");

var { NODE_ENV, SECRET_KEY, JWT_ISSUER_PROD, JWT_AUDIENCE_PROD, JWT_ISSUER_DEV, JWT_AUDIENCE_DEV, JWT_TOKEN_ALGORITHM } = process.env;

if( !NODE_ENV ) throw "NODE_ENV required. ";
if( !SECRET_KEY ) throw "SECRET_KEY required. ";
if (!JWT_ISSUER_PROD) throw "JWT_ISSUER_PROD required. ";
if (!JWT_AUDIENCE_PROD) throw "JWT_AUDIENCE_PROD required. ";
if (!issuer) throw "JWT_ISSUER required. ";
if (!audience) throw "JWT_AUDIENCE required. ";
if (!JWT_TOKEN_ALGORITHM) throw "JWT_TOKEN_ALGORITHM required. ";

var is_prod = NODE_ENV === "production" ? true : false;

if (!SECRET_KEY || SECRET_KEY.length < 32) throw new Error('SECRET_KEY zayıf veya tanımsız');

var issuer = is_prod ? JWT_ISSUER_PROD : JWT_ISSUER_DEV;
var audience = is_prod ? JWT_AUDIENCE_PROD : JWT_AUDIENCE_DEV;

var options = {
  algorithms: [JWT_TOKEN_ALGORITHM],
  issuer,
  audience,          
  clockTolerance: 5
};

var control_jwt_token = async (req, res, next) => {

  var Token = extract_service_token(req);
  if( !Token) return res.status(401).json({ message:' Session token required.'});

  try{
    var decoded = jwt.verify(Token, SECRET_KEY, options);

    req.UserId = decoded.UserId;
    req.session_id = decoded.session_id;
    req.jti = decoded.jti;
    req.Token = Token;
    req.temporary = decoded.temporary;                

    req.session_end_date = format_date(String(new Date(decoded.exp * 1000)));
    req.session_start_date = format_date(String(new Date(decoded.iat * 1000)));

    if( 'searched_vehicle_owner_id' in decoded && decoded.searched_vehicle_owner_id !== null ) req.searched_vehicle_owner_id = decoded?.searched_vehicle_owner_id;

    return next();
  }catch (err) {
    return res.status(401).json({ message: "Your session token is invalid or has expired. Please log in again." });
  }
};

module.exports = control_jwt_token;