const mongoose = require('mongoose')

const Schema = mongoose.Schema
const saleSchema = new Schema({
    saleID:{type:Number, unique:true, dropDups: true},
    saleStatus:{type: String, required: true},
    orders:[{qty:{type: Number, required: true}, itemName:{type: String, required: true}, price:{type: Number, required: true}, 
    pPrice:{type: Number, required: false}, unitDisc:{type:Number}}],
    soldBy:{type:String},
    customerInfo:{name:{type:String}, id:{type:Number}},
    subTotal:{type: Number},
    pAmount:{type: Number},
    discount:{type:Number},
    otherAmount:{type:Number},
    othterAmountTitle:{type:String},
    gst:{type:Number},
    gTotal:{type: Number},
    amountReceived:{type:Number},
    paymentStatus:{type: String, required: true},
    desc:{type: String},
    isDeleted:{type:Boolean}
},{timestamps:true}
)



const Sale =mongoose.model('sales', saleSchema)

module.exports = Sale