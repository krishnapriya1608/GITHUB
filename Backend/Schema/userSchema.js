const mongoose=require('mongoose')


const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["customer","waiter","kitchen","delivery","admin"],
        default:"customer"
    },
    otp:{
        type:String,

    },
    otpExpireAt:{
        type:Date,


    },
    isActive:{
        type:Boolean,
        default:false
    },
    resetPasswordToken: String,
    resetPasswordExpiry: Date

})
const user=mongoose.model('user',userSchema)
module.exports=user