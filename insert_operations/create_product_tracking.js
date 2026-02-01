var product_tracking = require("../schemas/product_tracking");

async function create_product_tracking(body){

    var { url, time_range } = body;
    
    var new_product_tracking_obj = {
        url: url,
        created_date: new Date(),
        time_range: time_range,
        track_count: 0
    };

    var new_product_tracking = new product_tracking(new_product_tracking_obj);
    await new_product_tracking.save();

    return new_product_tracking._id.toString();
};

module.exports = { create_product_tracking };