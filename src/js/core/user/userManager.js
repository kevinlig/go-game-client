import Firebase from 'firebase';
import Q from 'q';

export default class UserManager {
	constructor() {

		this.activePlayer = {};
		this.canBattle = 0;
		this.isOffline = false;
		this.inBattle = false;
		this.offlineTime;
	}

	getUserState() {

		const deferred = Q.defer();

		let state = 'loggedout';

		// check if a user is already logged in
		const currentUser = Firebase.auth().currentUser;

		if (!currentUser) {
			// this.appState = 'signin';
			// this.ui.showSignInPage();
			deferred.resolve('loggedout');
		}
		else {
			// extend login session
			currentUser.reload();

			// check if the user has an existing game account or if it's a new player
			this.verifyUser(currentUser.uid)
				.then((result) => {
					deferred.resolve(result);
				});
		}

		return deferred.promise;
	}

	verifyUser(uid) {
		const deferred = Q.defer();

		// forcibly create an entry so that the user ID is queryable
		Firebase.database().ref('users/' + uid + '/exists').set(true)
			.then(() => {
				// now lookup the parent entry to check if the user already exists
				return Firebase.database().ref('users/' + uid).once('value')
			})
			.then((snapshot) => {

				// tell the Firebase server to set the user's online status to 0 if the client disconnects
				Firebase.database().ref('users/' + uid + '/online')
					.onDisconnect().set(0);
				// also tell the Firebase server to terminate any battles on disconnect
				Firebase.database().ref('users/' + uid + '/battle/state')
					.onDisconnect().set(0);

				// now set up a watcher for when the page goes into the background on mobile devices
				this.watchForBackground();

				// also watch for battle eligibility changes
				Firebase.database().ref('users/' + uid + '/canBattle').on('value', (event) => {
					this.canBattle = event.val();
				});

				if (snapshot.val().hasOwnProperty('username')) {
					// this is a valid user
					this.activePlayer = snapshot.val();
					this.canBattle = snapshot.val().canBattle;

					// set the user as online
					Firebase.database().ref('users/' + uid + '/online').set(1)
						.then(() => {
							deferred.resolve('loggedin');
						});
				}
				else {
					// user has not signed in before
					deferred.resolve('register');
				}
			});

		return deferred.promise;
	}

	lookupUsername(username) {
		const deferred = Q.defer();

		// check if the user name exists
		// forcibly create an entry so that the row exists
		Firebase.database().ref('names/' + username + '/test').set(true)
			.then(() => {
				// now check to see if there is a user key
				return Firebase.database().ref('names/' + username).once('value');
			})
			.then((snapshot) => {
				if (snapshot.val().hasOwnProperty('user')) {
					// username is taken!
					deferred.reject('');
					return;
				}
				else {
					deferred.resolve(snapshot.val());
				}
			});

		return deferred.promise;
	}

	registerUser(username) {

		const deferred = Q.defer();

		const email = Firebase.auth().currentUser.email;
		const uid = Firebase.auth().currentUser.uid;

		// register the user account
		Firebase.database().ref('users/' + uid).set({
			username: username,
			exists: true,
			points: 0,
			online: 1,
			canBattle: 0,
			inventory: {
				dummy: true,
				concepts: {
					dummy: true
				},
				modifiers: {
					dummy: true
				},
				data: {
					concepts: {
						dummy: true
					},
					modifiers: {
						dummy: true
					}
				}
			},
			battle: {
				state: 0
			}
		})
		.then(() => {
			// write the user account to the username list
			return Firebase.database().ref('names/' + username).set({
				user: uid
			});
		})
		.then(() => {
			// watch for battle eligibility changes
			Firebase.database().ref('users/' + uid + '/canBattle').on('value', (event) => {
				this.canBattle = event.val();
			});
			deferred.resolve(username);
		});

		return deferred.promise;
	}

	loginUser() {

		const deferred = Q.defer();

		const provider = new Firebase.auth.GoogleAuthProvider();
		Firebase.auth().signInWithPopup(provider)
			.then((result) => {
				this.verifyUser(result.user.uid)
					.then((type) => {
						deferred.resolve(type);
					});
			})
			.catch((err) => {
				deferred.reject(err);
			});

		return deferred.promise;
	}

	logOut() {
		// mark as offline
		const uid = Firebase.auth().currentUser.uid;

		// cancel watchers
		Firebase.database().ref('/users/' + uid + '/canBattle').off();

		Firebase.database().ref('/users/' + uid + '/online').set(0)
			.then(() => {
				// now sign out
				return Firebase.auth().signOut();
			})
			.then(() => {
				// logged out
				// refresh the page
				window.location.reload();
			});
	}

	setOnline() {
		if (Firebase.auth().currentUser) {
			this.isOffline = false;
			Firebase.database().ref('users/' + Firebase.auth().currentUser.uid + '/online').set(1);
		}
	}

	setOffline() {
		this.isOffline = true;
		this.offlineTime = new Date().getTime();
		const uid = Firebase.auth().currentUser.uid;
		Firebase.database().ref('users/' + uid + '/online').set(0);
	}

	watchForBackground() {
		document.addEventListener('visibilitychange', this.appFocusChanged.bind(this));
		document.addEventListener('webkitvisibilitychange', this.appFocusChanged.bind(this));

	}

	appFocusChanged() {
		// check if we went away to the background
		if (!this.isOffline && !this.inBattle) {
			this.setOffline();
		}
		else if (this.isOffline && !this.inBattle) {
			// we came back
			this.setOnline();

			// refresh the page if this was more than 5 minutes ago
			if (new Date().getTime() - this.offlineTime > (5 * 60 * 1000)) {
				window.location.reload();
			}
		}
	}

}