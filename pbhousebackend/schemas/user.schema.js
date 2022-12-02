const mongoose= require('mongoose')
const bycrypt = require('bcrypt')
const Schema = mongoose.Schema
const userSchema= new Schema({
    username:{
        type: String,
        required: true,
        unique:true,
        trim:true,
        minLength:3
    },
    userType:{
        type: String,
        trim:true,
    },
    fName:{
        type: String,
        required: true,
        unique:false,
        trim:true,
        minLength:3
    },
    lName:{
        type: String,
        required: true,
        unique:false,
        trim:true,
        minLength:3
    },
    email:{
        type: String,
        required: true,
        unique:true,
        trim:true,
        minLength:3
    },
    password:{
        type: String,
        required: true,
        unique:false,
        trim:true,
        minLength:3
    },
    address:{
        type: String,
        required: false,
        unique:false,
        trim:true
    },
    rights:[],
    status:{
    type:String, }

},{timestamps:true}
)

userSchema.methods.generateHash= function (password){
    return bycrypt.hashSync(password, bycrypt.genSaltSync(8), null)
}
userSchema.methods.validPassword = function (password){
    return bycrypt.compareSync(password, this.password)
}
const User = mongoose.model('User', userSchema)

module.exports = User