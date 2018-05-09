
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

/* ======== Validate ID's ======== */

function validateFolderId(folderId, userId) {
	if(!folderId) {
		return Promise.resolve();
	}
	return Folder.findOne({_id: folderId, userId})
		.then(result => {
			if(!result) {
				return Promise.reject('Invalid Folder');
			}
		});
}

function validateTagIds(tags, userId) {
	if (!tags) {
		return Promise.resolve();
	}
	return Tag.find({ $and: [{ _id: { $in: tags }, userId }] })
		.then(results => {
			if (tags.length !== results.length) {
				return Promise.reject('Invalid Tag');
			}
		});
}

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {

	const { searchTerm, folderId, tagId } = req.query;
	const filter = {};

	if (searchTerm) {
		// filter.title = { $regex: searchTerm };
		filter.$or = [{ 'title': { $regex: searchTerm } }, { 'content': { $regex: searchTerm } }];
	}

	if (folderId) {
		filter.folderId = folderId;
	}

	if (tagId) {
		filter.tags = tagId;
	}

	filter.userId = req.user.id;

	Note.find(filter)
		.populate('tags')
		.sort({ 'updatedAt': 'desc' })
		.then(results => {
			res.json(results);
		})
		.catch(err => {
			next(err);
		});
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

	const { id } = req.params;
	const userId = req.user.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('The `id` is not valid');
		err.status = 400;
		return next(err);
	}

	Note.findOne({_id: id, userId})
		.populate('tags')
		.then(result => {
			if (result) {
				res.json(result);
			} else {
				next();
			}
		})
		.catch(err => {
			next(err);
		});
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

	const { title, content, folderId, tags = [] } = req.body;
	const userId = req.user.id;

	/***** Never trust users - validate input *****/
	if (!title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
		const err = new Error('The `folderId` is not valid');
		err.status = 400;
		return next(err);
	}

	if (tags) {
		tags.forEach((tag) => {
			if (!mongoose.Types.ObjectId.isValid(tag)) {
				const err = new Error('The `id` is not valid');
				err.status = 400;
				return next(err);
			}
		});
	}

	const folderIdPromise = validateFolderId(folderId, userId);
	const tagsIdPromise = validateTagIds(tags, userId);

	Promise.all([folderIdPromise, tagsIdPromise])
		.then(() => {
			return Note.create({ title, content, folderId, tags, userId });
		})
		.then(result => {
			res
				.location(`${req.originalUrl}/${result.id}`)
				.status(201)
				.json(result);
		})
		.catch(err => {
			if(err === 'Invalid Folder') {
				err = new Error('The folder is not valid');
				err.status = 400;
			}
			if(err === 'Invalid Tag') {
				err = new Error('The tag is not valid');
				err.status = 400;
			}
			next(err);
		});
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

	const { id } = req.params;
	const { title, content, folderId, tags = [] } = req.body;
	const userId = req.user.id;

	/***** Never trust users - validate input *****/
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('The `id` is not valid');
		err.status = 400;
		return next(err);
	}

	if (!title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
		const err = new Error('The `folderId` is not valid');
		err.status = 400;
		return next(err);
	}

	if (tags) {
		tags.forEach((tag) => {
			if (!mongoose.Types.ObjectId.isValid(tag)) {
				const err = new Error('The `tags.id` is not valid');
				err.status = 400;
				return next(err);
			}
		});
	}

	const folderIdPromise = validateFolderId(folderId, userId);
	const tagsIdPromise = validateTagIds(tags, userId);

	Promise.all([folderIdPromise, tagsIdPromise])
		.then(() => {
			return Note.findOneAndUpdate({_id: id, userId}, { title, content, folderId, tags }, { new: true })
		})
		.then(result => {
			if (result) {
				res.json(result);
			} else {
				next();
			}
		})
		.catch(err => {
			if(err === 'Invalid Folder') {
				err = new Error('The folder is not valid');
				err.status = 400;
			}
			if(err === 'Invalid Tag') {
				err = new Error('The tag is not valid');
				err.status = 400;
			}
			next(err);
		});
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

	const { id } = req.params;
	const userId = req.user.id;

	Note.findOneAndRemove({_id: id, userId})
		.then(() => {
			res.status(204).end();
		})
		.catch(err => {
			next(err);
		});
});

module.exports = router;
