const mongoose = require('mongoose')

const Schema = mongoose.Schema

const expenseSchema = new Schema({
    cat:{type:String},
    title:{type:String},
    amount:{type:Number},
    addedBy:{type:String},
    status:{type:String},
    isDeleted:{type:Boolean},
    date:{type:Date}, 
    supplier:{name:{type:String}, id:{type:String}},
    purchases:[],
    items:[],
},{timestamps:true}
)



const Expense =mongoose.model('expense', expenseSchema)

module.exports = Expense