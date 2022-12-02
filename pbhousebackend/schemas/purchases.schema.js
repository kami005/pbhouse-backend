const mongoose = require('mongoose')

const Schema = mongoose.Schema
const purchaseSchema = new Schema({
    purchaseID:{type:Number, unique:true, dropDups: true},
    purchaseStatus:{type: String, required: true},
    orders:[{qty:{type: Number, required: true}, itemName:{type: String, required: true}, price:{type: Number, required: true}}],
    procuredBy:{type:String},
    supplierBill:{type:String},
    supplierInfo:{name:{type:String}, id:{type:Number}},
    subTotal:{type: Number},
    otherAmount:{type:Number},
    othterAmountTitle:{type:String},
    gTotal:{type:Number},
    paid:{type:Number},
    paymentStatus:{type: String, required: true},
    desc:{type: String},
    isDeleted:{type:Boolean}
},{timestamps:true}
)



const Purchase =mongoose.model('purchases', purchaseSchema)

module.exports = Purchase