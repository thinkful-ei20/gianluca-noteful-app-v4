

const mongoose = require('mongoose');

const folderSchema = mongoose.Schema({
	name: { type: String, unique: true }
}, { timestamps: true });

folderSchema.set('toObject', {
	transform: function (doc, ret) {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
	}
});

module.exports = mongoose.model('Folder', folderSchema);
