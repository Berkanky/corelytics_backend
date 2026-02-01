var product_tracking = require("../schemas/product_tracking");

async function update_product_tracking_track_date(_id){

    var product_tracking_update = {
        $set: {
            track_date: new Date()
        },
        $inc: { track_count: 1 }
    };

    var updated_product_tracking = await product_tracking.findByIdAndUpdate(_id, product_tracking_update);

    return updated_product_tracking ? true : false;
};

module.exports = { update_product_tracking_track_date };