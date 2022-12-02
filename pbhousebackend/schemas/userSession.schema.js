const mongoose= require('mongoose')

const Schema = mongoose.Schema
const sessionSechma = new Schema({
    isDeleted:{type:Boolean, require: true},
    username:{type: String, required: true},
    description:{type: String, required: true},
    duration:{type: Number, required: true},
    date:{type: Date, required: true},
    token:{type:String, require: true},
    device:{type:Object, require:false}
},{timestamps:true}
)


const userSession = mongoose.model('userSession', sessionSechma)

module.exports = userSession