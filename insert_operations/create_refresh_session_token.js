var refresh_session = require("../schemas/refresh_session");

//create-refresh-token
var { create_refresh_token, hash_refresh_token } = require("../token_modules/create_refresh_token");

async function create_refresh_session_token(user_id, device_id, session_id){

    var created_refresh_token = create_refresh_token();
    var created_refresh_token_hash = hash_refresh_token(created_refresh_token);

    var refresh_session_filter = { user_id: user_id, revoked_date: null };
    var refresh_sessions = await refresh_session.find(refresh_session_filter).lean();

    for(var i = 0; i < refresh_sessions.length; i++){
        var refresh_session_row = refresh_sessions[i];
        var refresh_session_id = refresh_session_row._id.toString();
        var refresh_session_update = {
            $set:{
                revoked_date: new Date(),
                replaced_by_hash: created_refresh_token_hash
            }
        };
        await refresh_session.findByIdAndUpdate(refresh_session_id, refresh_session_update);
    };

    //var refresh_tl_days = 30;
    var refresh_ttl_minutes = 15;

    //var expired_date = new Date(Date.now() + refresh_tl_days * 24 * 60 * 60 * 1000);
    var expired_date = new Date(
    Date.now() + refresh_ttl_minutes * 60 * 1000
    );

    var new_refresh_token_obj = {
        user_id: user_id,
        device_id: device_id,
        session_id: session_id,
        refresh_token_hash: created_refresh_token_hash,
        expired_date: expired_date,
        created_date: new Date()
    };

    var new_refresh_session = new refresh_session(new_refresh_token_obj);
    await new_refresh_session.save();

    return { refresh_token: created_refresh_token };
};

module.exports = { create_refresh_session_token };