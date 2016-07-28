import Firebase from 'firebase';
import Q from 'q';
import _ from 'lodash';

import Config from '../../bakedConfig.js';

export default class UserManager {
	constructor(app) {
		this.app = app;

		this.uid = Firebase.auth().currentUser.uid;

		this.battleRef = Firebase.database().ref('users/' + this.uid + '/battle');

		this.battleData = {
			challenger: {},
			defender: {},
			role: "",
			inventory: {}
		};

		this.lastState = 0;

	}

	watchForChallenges() {
		// notify if the user is challenged to a battle by someone else
		Firebase.database().ref('users/' + this.uid + '/battle/state').on('value', (snapshot) => {
			const battleState = snapshot.val();
			if (battleState == 1) {
				// we've been challenged!
				this.receivedChallenge();
			}

			this.lastState = battleState;
		});
	}

	fetchUserInfo(uid) {
		const deferred = Q.defer();

		Firebase.database().ref('users/' + uid).once('value')
			.then((snapshot) => {
				deferred.resolve(snapshot.val());
			});

		return deferred.promise;
	}

	fetchLevelDiff(firstUser, secondUser) {
		const deferred = Q.defer();

		let users;

		Firebase.database().ref('users').once('value')
			.then((snapshot) => {
				const userDict = snapshot.val();
				const userArr = [];
				// convert the dictionary to an array
				Object.keys(userDict).forEach((key) => {
					const user = userDict[key];
					userArr.push({
						uid: key,
						username: user.username,
						points: user.points
					});
				});

				// sort the array
				users = _.orderBy(userArr, ['points', 'uid', 'username'], ['desc', 'asc', 'asc']);

				// iterate through the array
				let firstUserLevel = 3;
				let secondUserLevel = 3;
				let i = 0;
				users.forEach((user) => {

					if (user.points < Config.minPoints) {
						// not enough points, lowest level
						user.level = 0;
					}
					else if (i == 0) {
						// top player
						user.level = 3;
					}
					else if (i < 4) {
						user.level = 2;
					}
					else {
						user.level = 1;
					}

					if (user.uid == firstUser) {
						firstUserLevel = user.level
					}
					else if (user.uid == secondUser) {
						secondUserLevel = user.level
					}

					i++;
				});

				deferred.resolve([firstUserLevel, secondUserLevel]);

			});

		return deferred.promise;
	}

	challengeUser(uid) {

		const deferred = Q.defer();

		// fetch the current user's information
		let currentUser;
		let opponentUser;

		this.fetchUserInfo(this.uid)
			.then((data) => {
				currentUser = data;
				// fetch the opponent's data
				return this.fetchUserInfo(uid);
			})
			.then((data) => {
				opponentUser = data;

				// update the target users' online status
				return Firebase.database().ref('users/' + uid + '/online').set(2);
			})
			.then(() => {
				// set your own status as busy
				return Firebase.database().ref('users/' + this.uid + '/online').set(2);	
			})
			.then(() => {
				// now create the battle object
				// state 1 indicates the user listed is challenger
				const battleObj = {
					state: 1,
					uid: this.uid,
					user: {
						username: currentUser.username,
						points: currentUser.points
					},
					attack: {
						state: 0,
						value: 0
					}
				};

				this.battleData.challenger = battleObj;

				return Firebase.database().ref('users/' + uid + '/battle').set(battleObj);
			})
			.then(() => {
				// write the player's own data
				// state 2 indicates the user listed is challengee
				const battleObj = {
					state: 2,
					uid: uid,
					user: {
						username: opponentUser.username,
						points: opponentUser.points
					},
					attack: {
						state: 0,
						value: 0
					}
				};

				this.battleData.defender = battleObj;
				this.battleData.role = "challenger";
				this.battleData.inventory = currentUser.inventory;

				return Firebase.database().ref('users/' + this.uid + '/battle').set(battleObj);
			})
			.then(() => {
				deferred.resolve();
			});

		return deferred.promise;
	}

	receivedChallenge() {
		// determine who challenged you

		let currentUser;
		let opponentUser;
		let opponentUid;
		
		this.fetchUserInfo(this.uid)
			.then((data) => {

				currentUser = data;
				opponentUid = data.battle.uid;

				return this.fetchUserInfo(opponentUid);
			})
			.then((data) => {
				opponentUser = data;

				// save the info
				this.battleData.challenger = currentUser.battle;
				this.battleData.defender = opponentUser.battle;
				this.battleData.role = "defender";
				this.battleData.inventory = currentUser.inventory;

				// show the battle screen
				this.app.ui.showBattleScreen();
			});

	}

	resetBattle() {
		Firebase.database().ref('users/' + this.uid + '/online').set(1);
	}

	performAttack(modifier, concept, data) {
		// consume the modifier and concept from the player's inventory
		
		// consume the modifier
		let modifierQty = null;
		let conceptQty = null;
		Firebase.database().ref('users/' + this.uid + '/inventory').once('value')
			.then((snapshot) => {
				const inventory = snapshot.val();
				modifierQty = parseInt(inventory.modifiers[modifier]) - 1;
				conceptQty = parseInt(inventory.concepts[concept]) - 1;

				// write the updates
				if (modifierQty < 1) {
					modifierQty = null;
				}
				if (conceptQty < 1) {
					conceptQty = null;
				}

				return Firebase.database().ref('users/' + this.uid + '/inventory/modifiers/' + modifier).set(modifierQty);
			})
			.then(() => {
				// now update the concept
				return Firebase.database().ref('users/' + this.uid + '/inventory/concepts/' + concept).set(conceptQty);
			})
			.then(() => {

				// check if the player is still eligible to battle
				return Firebase.database().ref('users/' + this.uid + '/inventory').once('value');
			})
			.then((snapshot) => {
				const inventory = snapshot.val();
				
				if (Object.keys(inventory.concepts).length < 2 || Object.keys(inventory.modifiers).length < 2) {
					// no longer eligible
					return Firebase.database().ref('users/' + this.uid + '/canBattle').set(0);
				}
			})
			.then(() => {
				// now write the attack to the battle object
				const total = parseInt(data.concepts[concept].value) + parseInt(data.modifiers[modifier].value);
				let opponentRole = "defender";
				if (this.battleData.role == "defender") {
					opponentRole = "challenger";
				}

				const attackObj = {
					state: 1,
					value: total,
					concept: data.concepts[concept],
					modifier: data.modifiers[modifier]
				};

				this.battleData[opponentRole].attack = attackObj;

				return Firebase.database().ref('users/' + this.battleData[opponentRole].uid + '/battle/attack').set(attackObj);
			})
			.then(() => {
				// show the results screen
				this.app.ui.showResultsScreen();
			})
	}

	finishBattle(points) {
		if (points > 0) {
			// player won
		}

		// reset the battle key
		this.battleData = {
			challenger: {},
			defender: {},
			role: "",
			inventory: {}
		};

		Firebase.database().ref('users/' + this.uid + '/battle').set({
			attack: {
				state: 0,
				value: 0
			},
			state: 0
		});
	}

}