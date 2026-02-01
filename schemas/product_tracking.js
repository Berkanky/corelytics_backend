const mongoose = require("mongoose");

const product_tracking_schema = new mongoose.Schema({
    url:{
        type: String,
        required: true
    },
    created_date:{
        type: Date,
        required: true
    },
    time_range:{
        type: String,
        enum: ["daily", "weekly", "monthly"],
        required: true
    },
    track_date:{
        type: Date
    },
    track_count:{
        type: Number
    }
});

var product_tracking = mongoose.model('product_tracking', product_tracking_schema);
module.exports = product_tracking;