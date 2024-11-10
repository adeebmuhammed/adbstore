const mongoose = require("mongoose")
const {Schema} = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true
    },
    orderedItems:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        productName:{
            type:String,
            required:true
        },
        size:{
            type:String,
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        }
    }],
    totalprice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        type:Schema.Types.ObjectId,
        ref:"Address",
        required:true
    },
    invoiceDate:{
        type:Date
    },
    status:{
        type:String,
        required:true,
        enum:['Pending','Placed','Shipped','Delivered','Canceled','Return Request','Returned']
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:Schema.Types.ObjectId,
        ref:"Coupon",
        required:false
    },
    paymentMethod:{
        type:String,
        required:true
    },
    razorpayOrderId:{
        type:String,
        required:false
    }
},{ timestamps: true })


const Order = mongoose.model("Order",orderSchema)

module.exports = Order