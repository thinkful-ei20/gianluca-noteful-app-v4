
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const User = require('../models/user');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const seedUsers = require('../db/seed/users');
const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');
const seedTags = require('../db/seed/tags');

/** TODO: update to generate `hashed` passwords */
mongoose.connect(MONGODB_URI)
	.then(() => mongoose.connection.db.dropDatabase())
	.then(() => Promise.all(seedUsers.map(user => User.hashPassword(user.password))))
	.then(digest => {
		seedUsers.forEach((user, i) => {
			user.password = digest[i];
		});
	})
	.then(() => {
		return Promise.all([
			User.insertMany(seedUsers),

			Note.insertMany(seedNotes),

			Folder.insertMany(seedFolders),
			Folder.createIndexes(),

			Tag.insertMany(seedTags),
			Tag.createIndexes()
		]);
	})
	.then(() => mongoose.disconnect())
	.catch(err => {
		console.error(`ERROR: ${err.message}`);
		console.error(err);
	});