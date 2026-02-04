const mongoose = require("mongoose");

const user_schema = new mongoose.Schema({
    device_id: {
        type: String,
        required: true
    },
    created_date: {
        type: Date,
        required: true
    },
    login_date: {
        type: Date
    },
    last_login_date: {
        type: Date
    },
    updated_date: {
        type: Date
    }
});

var user = mongoose.model('user', user_schema);
module.exports = user;