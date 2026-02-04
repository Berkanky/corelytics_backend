const express = require("express");
const app = express.Router();

//joi schemas
var create_product_tracking_service_schema = require("../joi_schemas/create_product_tracking_service_schema");
var auth_device_service_schema = require("../joi_schemas/auth_device_service_schema");
var auth_refresh_service_schema = require("../joi_schemas/auth_refresh_service_schema");

//middlewares
var rate_limiter = require("../middleware/rate_limiter");
var set_service_action_name = require("../middleware/set_service_action_name");
var create_session_id = require("../middleware/create_session_id");
var { control_access_token } = require("../middleware/control_access_token");
var { control_refresh_token } = require("../middleware/control_refresh_token");
var user_control = require("../middleware/user_control");

//shemas
var product_tracking = require("../schemas/product_tracking");
var user = require("../schemas/user");
var refresh_session = require("../schemas/refresh_session");

//insert functions
var { create_access_token } = require("../token_modules/create_access_token");
var { create_product_tracking } = require("../insert_operations/create_product_tracking");
var { create_refresh_session_token } = require("../insert_operations/create_refresh_session_token");

//functions
var format_date = require("../functions/format_date");

//encryptions
var sha_256 = require("../encryption_modules/sha_256");

//Health service.
app.get(
    "/health",
    async(req, res) => { 
        try{
          return res.status(200).json({
            issuer: 'corelytics_backend',
            success: true,
            request_date: new Date()
          });
        }catch(err){
            console.log(err);
            return res.status(500).json({message: err });
        }
    }
);

//auth-device service.
app.post(
  "/auth-device",
  rate_limiter,
  create_session_id,
  set_service_action_name({action_name: 'auth-device'}),
  async(req, res) => {
    
    var { device_id } = req.body;

    var { error } = auth_device_service_schema.validate(req.body, { abortEarly: false });
    if( error) return res.status(400).json({errors: error.details.map(detail => detail.message), success: false });

    try{  

      var user_id;

      var hashed_device_id = sha_256(device_id);
      var user_filter = { device_id: hashed_device_id };

      var user_detail = await user.findOne(user_filter).lean();
      if( !user_detail ){
        
        var new_user_obj = { 
          device_id: hashed_device_id,
          created_date: new Date(),
          login_date: new Date(),
          updated_date: new Date()
        };

        var new_user = new user(new_user_obj);
        await new_user.save();

        user_id = new_user._id.toString();

      } else if( user_detail ){

        user_id = user_detail._id.toString();

        var user_update = {
          $set:{
            login_date: new Date()
          },
          $unset:{
            last_login_date: ''
          }
        };

        await user.findByIdAndUpdate(user_id, user_update);
      }

      var { access_token } = await create_access_token(req, res, user_id, "5m", req.session_id);
      var { refresh_token } = await create_refresh_session_token(user_id, device_id, req.session_id);

      return res.status(200).json({ 
        message:' Login successful.', 
        success: true,
        access_token,
        refresh_token
      });
    }catch(err){
      console.error(err);
      return res.status(500).json({ message:' auth-device service error. ', success: false });
    }
  }
);

//refresh access token service.
app.post(
  "/refresh-token",
  rate_limiter,
  control_refresh_token,
  user_control,
  create_session_id,
  set_service_action_name({action_name: 'auth-refresh'}),
  async(req, res) => {

    var { error } = auth_refresh_service_schema.validate(req.body, { abortEarly: false });
    if( error) return res.status(400).json({errors: error.details.map(detail => detail.message), success: false });

    try{
      var { access_token } = await create_access_token(req, res, req.user_id, "5m", req.session_id);
      
      return res.status(200).json({ 
        message:' refresh-token successful. ', 
        success: true,
        access_token,
      });

    }catch(err){
      console.error(err);
      return res.status(500).json({ message:' auth-refresh service error. ', success: false });
    }
  }
);

//get-user-details
app.get(
  "/user-details",
  rate_limiter,
  control_access_token,
  user_control,
  set_service_action_name({action_name: 'user-details'}),
  async(req, res) => {
    try{  

      var user_detail = req.user_detail;

      user_detail.created_date = format_date(String(user_detail.created_date));
      if( user_detail.last_login_date ) user_detail.last_login_date = format_date(String(user_detail.last_login_date));
      if( user_detail.updated_date ) user_detail.updated_date = format_date(String(user_detail.updated_date));

      return res.status(200).json({ message: ' User information has been successfully retrieved.', success: true, user_detail: user_detail });
    }catch(err){
      console.error(err);
      return res.status(500).json({ message:' user-details service error. '});
    }
  }
);

//create-product-tracking service.
app.post(
  "/create-product-tracking",
  rate_limiter,
  control_access_token,
  user_control,
  set_service_action_name({action_name: 'create-product-tracking'}),
  async(req, res) => {

    var { url } = req.body;
    
    var { error } = create_product_tracking_service_schema.validate(req.body, { abortEarly: false });
    if( error) return res.status(400).json({errors: error.details.map(detail => detail.message), success: false });
      
    try{

      var product_tracking_detail = await product_tracking.findOne({ url });
      if( product_tracking_detail ) return res.status(409).json({ message:' This product has already been added to the watchlist.', success: false });

      await create_product_tracking(req.body);

      return res.status(200).json({ message:' The product to be tracked has been successfully created.', success: true });
    }catch(err){
      console.error(err);
      return res.status(500).json({ message:' create-product-tracking service error. ', success: false });
    }
  }
);

module.exports = app;