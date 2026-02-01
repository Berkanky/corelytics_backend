const mongoose = require("mongoose");

const images_schema = new mongoose.Schema({
    url: {
        type: String
    }
}, { _id: false });

const price_schema = new mongoose.Schema({
    current: {
        type: Number
    },
    original:{
        type: Number
    },
    discount_rate:{
        type: Number
    },
    currency:{
        type: String
    }
}, { _id: false });

const raw_schema = new mongoose.Schema({
    price_text: {
        type: String
    },
    badges:[]
}, { _id: false });

const product_schema = new mongoose.Schema({
    product_tracking_id:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'product_tracking',
        index: true
    },
    source: {
        type: String
    },
    product_code: {
        type: String
    },
    name:{
        type: String
    },
    brand:{
        type: String
    },
    category_path: [],
    images: [images_schema],
    price: price_schema,
    availability:{
        type: String
    },
    collected_at:{
        type: Date
    },
    raw: raw_schema,
    created_date:{
        type: Date
    }
});

var product = mongoose.model('product', product_schema);
module.exports = product;