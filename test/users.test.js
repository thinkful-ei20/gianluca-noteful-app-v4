
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
	const username = 'exampleUser';
	const password = 'examplePass';
	const fullname = 'Example User';

	before(function () {
		return mongoose.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	beforeEach(function () {
		return User.createIndexes();
	});

	afterEach(function () {
		return mongoose.connection.db.dropDatabase();
	});

	after(function () {
		return mongoose.disconnect();
	});

	describe('/api/users', () => {
		describe('POST', () => {
			it('Should create a new user', () => {
				const testUser = { username, password, fullname };

				let res;
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(_res => {
						res = _res;
						expect(res).to.have.status(201);
						expect(res.body).to.be.an('object');
						expect(res.body).to.have.keys('id', 'username', 'fullname');

						expect(res.body.id).to.exist;
						expect(res.body.username).to.equal(testUser.username);
						expect(res.body.fullname).to.equal(testUser.fullname);

						return User.findOne({ username });
					})
					.then(user => {
						expect(user).to.exist;
						expect(user.id).to.equal(res.body.id);
						expect(user.fullname).to.equal(testUser.fullname);
						return user.validatePassword(password);
					})
					.then(isValid => {
						expect(isValid).to.be.true;
					});
			});
			it('Should reject users with missing username', () => {
				const testUser = { password, fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(422);
						expect(res.body.message).to.equal('Missing field:\'username\' in request body');
					});
			});
			it('Should reject users with missing password', () => {
				const testUser = { username, fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(422);
						expect(res.body.message).to.equal('Missing field:\'password\' in request body');
					});
			});
			it('Should reject users with non-string username', () => {
				const testUser = { username : 10, password, fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(422);
						expect(res.body.message).to.equal('Incorrect field type: \'username\' expected string');
					});
			});
			it('Should reject users with non-string password', () => {
				const testUser = { username, password : 10, fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(422);
						expect(res.body.message).to.equal('Incorrect field type: \'password\' expected string');
					});
			});
			it('Should reject users with non-trimmed username', () => {
				const testUser = { username :' nontrimmed ', password, fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(422);
						expect(res.body.message).to.equal('Cannot start or end field: \'username\' with whitespace');
					});
			});
			it('Should reject users with non-trimmed password', () => {
				const testUser = { password :' nontrimmed ', username, fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(422);
						expect(res.body.message).to.equal('Cannot start or end field: \'password\' with whitespace');
					});
			});
			it('Should reject users with empty username', () => {
				const testUser = { username : '', password, fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(422);
						expect(res.body.message).to.equal('Must be at least 1 characters long');
					});
			});
			it('Should reject users with password less than 8 characters', () => {
				const testUser = { username, password : 'abcdefg', fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(422);
						expect(res.body.message).to.equal('Must be at least 8 characters long');
					});
			});
			it('Should reject users with password greater than 72 characters', () => {
				const testUser = { username, password : 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()-', fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(422);
						expect(res.body.message).to.equal('Must be at most 72 characters long');
					});
			});
			it('Should reject users with duplicate username', () => {
				const testUser = { username, password, fullname };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(() => {
						return chai.request(app).post('/api/users').send(testUser);
					})
					.then(res => {
						expect(res).to.have.status(400);
						expect(res.body.message).to.equal(`The 'username': ${username} already exists`);
					});
			});
			it('Should trim fullname', () => {
				const testUser = { username, password, fullname : ' fullname ' };
				return chai
					.request(app)
					.post('/api/users')
					.send(testUser)
					.then(res => {
						expect(res).to.have.status(201);
						expect(res.body.fullname).to.equal(testUser.fullname.trim());
					});
			});
		});
	});
});