'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Credential = mongoose.model('Credential'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, credential;

/**
 * Credential routes tests
 */
describe('Credential CRUD tests', function() {
	beforeEach(function(done) {
		// Create user credentials
		credentials = {
			username: 'username',
			password: 'password'
		};

		// Create a new user
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		});

		// Save a user to the test db and create new Credential
		user.save(function() {
			credential = {
				name: 'Credential Name'
			};

			done();
		});
	});

	it('should be able to save Credential instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Credential
				agent.post('/credentials')
					.send(credential)
					.expect(200)
					.end(function(credentialSaveErr, credentialSaveRes) {
						// Handle Credential save error
						if (credentialSaveErr) done(credentialSaveErr);

						// Get a list of Credentials
						agent.get('/credentials')
							.end(function(credentialsGetErr, credentialsGetRes) {
								// Handle Credential save error
								if (credentialsGetErr) done(credentialsGetErr);

								// Get Credentials list
								var credentials = credentialsGetRes.body;

								// Set assertions
								(credentials[0].user._id).should.equal(userId);
								(credentials[0].name).should.match('Credential Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Credential instance if not logged in', function(done) {
		agent.post('/credentials')
			.send(credential)
			.expect(401)
			.end(function(credentialSaveErr, credentialSaveRes) {
				// Call the assertion callback
				done(credentialSaveErr);
			});
	});

	it('should not be able to save Credential instance if no name is provided', function(done) {
		// Invalidate name field
		credential.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Credential
				agent.post('/credentials')
					.send(credential)
					.expect(400)
					.end(function(credentialSaveErr, credentialSaveRes) {
						// Set message assertion
						(credentialSaveRes.body.message).should.match('Please fill Credential name');
						
						// Handle Credential save error
						done(credentialSaveErr);
					});
			});
	});

	it('should be able to update Credential instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Credential
				agent.post('/credentials')
					.send(credential)
					.expect(200)
					.end(function(credentialSaveErr, credentialSaveRes) {
						// Handle Credential save error
						if (credentialSaveErr) done(credentialSaveErr);

						// Update Credential name
						credential.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Credential
						agent.put('/credentials/' + credentialSaveRes.body._id)
							.send(credential)
							.expect(200)
							.end(function(credentialUpdateErr, credentialUpdateRes) {
								// Handle Credential update error
								if (credentialUpdateErr) done(credentialUpdateErr);

								// Set assertions
								(credentialUpdateRes.body._id).should.equal(credentialSaveRes.body._id);
								(credentialUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Credentials if not signed in', function(done) {
		// Create new Credential model instance
		var credentialObj = new Credential(credential);

		// Save the Credential
		credentialObj.save(function() {
			// Request Credentials
			request(app).get('/credentials')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Credential if not signed in', function(done) {
		// Create new Credential model instance
		var credentialObj = new Credential(credential);

		// Save the Credential
		credentialObj.save(function() {
			request(app).get('/credentials/' + credentialObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', credential.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Credential instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Credential
				agent.post('/credentials')
					.send(credential)
					.expect(200)
					.end(function(credentialSaveErr, credentialSaveRes) {
						// Handle Credential save error
						if (credentialSaveErr) done(credentialSaveErr);

						// Delete existing Credential
						agent.delete('/credentials/' + credentialSaveRes.body._id)
							.send(credential)
							.expect(200)
							.end(function(credentialDeleteErr, credentialDeleteRes) {
								// Handle Credential error error
								if (credentialDeleteErr) done(credentialDeleteErr);

								// Set assertions
								(credentialDeleteRes.body._id).should.equal(credentialSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Credential instance if not signed in', function(done) {
		// Set Credential user 
		credential.user = user;

		// Create new Credential model instance
		var credentialObj = new Credential(credential);

		// Save the Credential
		credentialObj.save(function() {
			// Try deleting Credential
			request(app).delete('/credentials/' + credentialObj._id)
			.expect(401)
			.end(function(credentialDeleteErr, credentialDeleteRes) {
				// Set message assertion
				(credentialDeleteRes.body.message).should.match('User is not logged in');

				// Handle Credential error error
				done(credentialDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Credential.remove().exec();
		done();
	});
});