const mongoose = require("mongoose")
const {Schema} = mongoose;

const couponSchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expireOn:{
        type:Date,
        required:true
    },
    offerPrice:{
        type:Number,
        required:true
    },
    minimumPrice:{
        type:Number,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    code:{
        type:String,
        required:true,
        unique:true
    },
    image:{
        type:[String],
        required:true
    }
},{ timestamps: true })

const Coupon = mongoose.model("Coupon",couponSchema)

module.exports = Coupon