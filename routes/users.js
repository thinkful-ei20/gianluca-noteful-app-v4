
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const { User } = require('../models/user');

/* why use this instead of app.use(express.json()); ??*/
//router.use(bodyParser.json());

/* ========== POST/CREAT A USER ========== */
router.post('/', (req, res, next) => {

	/* ========== POST validation ========== */

	const requiredFields = ['username', 'password'];
	const missingField = requiredFields.find(field => !(field in req.body));

	/* Check if requried fields are in the request */
	if(missingField) {
		res.status(400).json({
			code: 400,
			reason: 'ValidationError',
			message: 'Missing Field',
			location: missingField
		});
	}

	/* Check if request body contains appropriate data types  */
	const stringFields = ['username','password','fullname'];
	const nonStringField = stringFields.find( field => field in req.body && typeof req.body[field] !== 'string');

	if(nonStringField) {
		res.status(400).json({
			code: 400,
			reason: 'ValidationError',
			message: 'Incorrect field type: expected string',
			location: nonStringField
		});
	}

	/* Check that username and password fields are 'trimmed' */
	const trimmedFields = ['username', 'password'];
	const nonTrimmedField = trimmedFields.find(field => req.body[field].trim() !== req.body[field]);

	if(nonTrimmedField) {
		res.status(400).json({
			code: 400,
			reason: 'ValidationError',
			message: 'Cannot start or end with whitespace',
			location: nonTrimmedField
		});
	}

	const sizedFields = {
		username: {
			min: 1
		},
		password: {
			min: 8,
			// bcrypt truncates after 72 characters, so let's not give the illusion
			// of security by storing extra (unused) info
			max: 72
		}
	};
	const tooSmallField = Object.keys(sizedFields).find(
		field =>
			'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
	);
	const tooLargeField = Object.keys(sizedFields).find(
		field =>
			'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
	);

	if (tooSmallField || tooLargeField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: tooSmallField
				? `Must be at least ${sizedFields[tooSmallField]
					.min} characters long`
				: `Must be at most ${sizedFields[tooLargeField]
					.max} characters long`,
			location: tooSmallField || tooLargeField
		});
	}

	/* ========== end of POST validation ========== */

	// username and password come in pre-trimmed, otherwise we throw an error
	// before this

	let {username, password, fullname = ''} = req.body;
	fullname = fullname.trim();

	// return User.find({username})
	// 	.count()
	// 	.then(count => {
	// 		if (count > 0) {
	// 			// There is an existing user with the same username
	// 			return Promise.reject({
	// 				code: 422,
	// 				reason: 'ValidationError',
	// 				message: 'Username already taken',
	// 				location: 'username'
	// 			});
	// 		}
	// 		// If there is no existing user, hash the password
	// 		return User.hashPassword(password);
	// 	})

	return User.hashPassword(password)
		.then(digest => {
			return User.create({
				username,
				password: digest,
				fullname
			});
		})
		.then(user => {
			return res.status(201).location(`/api/users/${user.id}`).json(user);
		})
		.catch(err => {
			if(err.code === 11000) {
				err = new Error('The Usernam already exists');
				err.status = 400;
			}
			next(err);
		});
});

module.exports = router;
