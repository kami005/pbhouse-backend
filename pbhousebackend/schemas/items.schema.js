const mongoose = require('mongoose')

const Schema = mongoose.Schema
const itemSchema = new Schema({
itemID:{type:Number, unique:true, required: true,},
itemName:{type: String, required: true, unique:true},
pPrice:{type:Number, required: true },
sPrice:{type:Number, required: true},
qty:{type:Number},
stockOut:{type:Boolean},
type: {type:String},
model: {type: String},
vendor:{type:String},
desc:{type: String},
itemAddedBy:{type: String},
isDeleted:{type:Boolean}
}, 
{timestamps:true})


const Item =mongoose.model('items', itemSchema)

module.exports = Item