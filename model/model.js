const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    Name: {type : String, required : true},
    Email: {type : String, required : true},
    MobileNumber: {type : Number, required : true},
    Amount: {type : Number, required : true},

})

module.exports = mongoose.model("abc", UserSchema)