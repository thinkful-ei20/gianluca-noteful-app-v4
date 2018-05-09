

const mongoose = require('mongoose');

const tagSchema = mongoose.Schema({
	name: { type: String, required: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
}, { timestamps: true });

tagSchema.index({ name: 1, userId: 1}, { unique: true });

tagSchema.set('toObject', {
	transform: function (doc, ret) {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
	}
});

module.exports = mongoose.model('Tag', tagSchema);
