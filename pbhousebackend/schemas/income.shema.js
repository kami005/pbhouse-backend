const mongoose = require('mongoose')

const Schema = mongoose.Schema

const incomeShchema = new Schema({
    cat:{type:String},
    title:{type:String},
    amount:{type:Number},
    addedBy:{type:String},
    status:{type:String},
    date:{type:Date}, 
    customer:{name:{type:String}, id:{type:String}},
    isDeleted:{type:Boolean},
    sales:[],
    items:[],
},{timestamps:true}
)



const Income =mongoose.model('income', incomeShchema)

module.exports = Income