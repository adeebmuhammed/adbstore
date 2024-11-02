const mongoose = require("mongoose")
const {Schema} = mongoose;

const cartSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            default:1
        },
        size:{
            type:String,
            required:true
        },
        price:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            required:true
        },
    }],
    discount:{
        type:Number,
        default:0,
        required:false
    },
    couponApplied:{
        type:Schema.Types.ObjectId,
        ref:"Coupon",
        required:false
    }
},{ timestamps: true })

const Cart = mongoose.model("Cart",cartSchema)

module.exports = Cart