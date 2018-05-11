
const { Strategy: LocalStrategy } = require('passport-local');
const User = require('../models/user');

// ===== Define and create basicStrategy =====
const localStrategy = new LocalStrategy((username, password, done) => {
	let user;
	User.findOne({ username })
		.then(results => {
			user = results;
			if (!user) {
				return Promise.reject({
					reason: 'LoginError',
					message: 'Incorrect username',
					location: 'username'
				});
			}
			return user.validatePassword(password);
		})
		.then(isValid => {
			if (!isValid) {
				return Promise.reject({
					reason: 'LoginError',
					message: 'Incorrect password',
					location: 'password'
				});
			}
			return done(null, user);
		})
		.catch(err => {
			if (err.reason === 'LoginError') {
				err.status = 401;
				return done(err);
			}
			return done(err);
		});
});

module.exports = localStrategy;
