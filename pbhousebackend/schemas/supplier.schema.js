const mongoose = require('mongoose')

const Schema = mongoose.Schema
const supplierSchema = new Schema({
    id:{type:Number, unique:true, required:true},
    name:{type:String, unique:true, required:true},
    contactNo:{type:String},
    address:{type:String},
    addedBy:{type:String},
    type:{type:String},
    desc:{type:String},
    supplies:[{itemName:String, freq:Number}],
    isDeleted:{type:Boolean}
},{timestamps:true}
)

const Supplier =mongoose.model('supplier', supplierSchema)

module.exports = Supplier