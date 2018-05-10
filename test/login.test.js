const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

const User = require('../models/user');

const expect = chai.expect;
chai.use(chaiHttp);

describe.only('Noteful API - Login', function () {

	const fullname = 'Example User';
	const username = 'exampleUser';
	const password = 'password';

	before(function () {
		return mongoose.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	beforeEach(function () {
		return User.hashPassword(password)
			.then(digest => User.create({ fullname, username, password: digest }));
	});


	afterEach(function () {
		return mongoose.connection.db.dropDatabase();
	});

	after(function () {
		return mongoose.disconnect();
	});

	// TESTS GO HERE

});