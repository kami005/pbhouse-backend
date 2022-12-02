const mongoose = require('mongoose')

const Schema = mongoose.Schema

const logSchema = new Schema({
    table:{type:String},
    type:{type:String},
    from:{},
    to:{},
    by:{type:String},
    id:{type:String},
    name:{type:String},
    status:{type:String}
},{timestamps:true}
)



const Logs =mongoose.model('log', logSchema)

module.exports = Logs