const mongoose = require('mongoose')

const Schema = mongoose.Schema
const customerSchema = new Schema({
    customerID:{type:Number, unique:true, required:true},
    customerName:{type:String, unique:true, required:true},
    contactNo:{type:String},
    address:{type:String},
    customerAddedBy:{type:String},
    customerType:{type:String},
    description:{type:String},
    isDeleted:{type:Boolean}
},{timestamps:true}
)



const Customer =mongoose.model('customer', customerSchema)

module.exports = Customer