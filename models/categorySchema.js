const mongoose = require("mongoose")
const {Schema} = mongoose

const categorySchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    categoryOffer:{
        type:Number,
        default:0
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    saleCount:{
        type:Number,
        required:false,
        default:0
    }
},{ timestamps: true })

const Category = mongoose.model("Category",categorySchema)

module.exports = Category