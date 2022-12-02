const mongoose = require('mongoose')

const Schema = mongoose.Schema

const messageSchema = new Schema({
    senderID:{type:String},
    receiverID:{type:String},
    message:{type:String},
    type:{type:String},
    group:[],
    status:{type:String},
    otherInfo:{}
},{timestamps:true}
)



const Message =mongoose.model('message', messageSchema)

module.exports = Message