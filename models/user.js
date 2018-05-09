
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
	fullname: {type: String},
	username: {type: String, unique:true, required:true},
	password: {type: String, required:true}
});

userSchema.set('toObject', {
	transform: function(doc, ret) {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		delete ret.password;
	}
});

userSchema.methods.validatePassword = function (password) {
	return bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = function (password) {
	return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('User', userSchema);
