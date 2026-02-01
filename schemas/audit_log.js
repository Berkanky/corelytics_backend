const mongoose = require("mongoose");

const audit_log_schema = new mongoose.Schema(
  {
    user_id: {
      type: String
    },
    request_id: { 
        type: String, 
        default: null 
    },
    session_id: { 
        type: String, 
        default: null 
    },
    action: { 
        type: String, 
        required: false 
    },
    success: { 
        type: Boolean, 
        required: false 
    },
    http_status: { 
        type: Number, 
        default: null 
    },
    ip_address: { 
        type: String, 
        default: null 
    },
    user_agent: { 
        type: String, 
        default: null 
    },
    geo_country: { 
        type: String, 
        default: null 
    },
    created_date: { 
        type: Date, 
        default: new Date()
    },
    method:{
        type: String,
        required: false
    },
    path:{
        type: String,
        required: false
    },
    request_params:{
        type: String,
        required: false
    },
    request_body:{
        type: String,
        required: false
    },
    provider:{
        type: String,
        required: false
    }
  }
);

audit_log_schema.index({ UserId: 1, CreatedDate: -1 });
audit_log_schema.index({ Action: 1, CreatedDate: -1 });
audit_log_schema.index({ FlowId: 1, Step: 1 });
audit_log_schema.index({ TokenJtiHash: 1 });
audit_log_schema.index({ RequestId: 1 });

var auditlog = mongoose.model('auditlog', audit_log_schema);
module.exports = auditlog;