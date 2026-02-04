var refresh_session = require("../schemas/refresh_session");
var { hash_refresh_token } = require("../token_modules/create_refresh_token");

async function control_refresh_token(req, res, next){

    var { refresh_token } = req.body;

    var hashed_refresh_token = hash_refresh_token(refresh_token);
    var refresh_session_filter = { refresh_token_hash: hashed_refresh_token };

    var refresh_session_detail = await refresh_session.findOne(refresh_session_filter).lean();
    if( !refresh_session_detail ) return res.status(403).json({ message:' invalid refresh token. ', success: false });

    var { _id, revoked_date,  expired_date } = refresh_session_detail;
    if( revoked_date || expired_date < new Date() ) {
        
        var refresh_session_update = {
            $set:{
                revoked_date: new Date()
            }
        };

        await refresh_session.findByIdAndUpdate(_id, refresh_session_update);
        
        return res.status(401).json({ message: " Refresh token expired or revoked." });
    }

    var refresh_session_update = {
        $set:{
            last_used_date: new Date()
        }
    };

    await refresh_session.findByIdAndUpdate(_id, refresh_session_update);
    if( !req.user_id ) req.user_id = (refresh_session_detail.user_id).toString();

    return next();
};

module.exports = {control_refresh_token};