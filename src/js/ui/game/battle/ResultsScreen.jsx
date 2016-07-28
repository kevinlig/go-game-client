import React from 'react';
import Firebase from 'firebase';

export default class ResultsScreen extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			data: {
				challenger: {
					uid: '',
					user: {
						username: ''
					},
					attack: {
						state: 0,
						value: 0
					}
				},
				defender: {
					uid: '',
					user: {
						username: ''
					},
					attack: {
						state: 0,
						value: 0
					}
				},
				inventory: {
					concepts: {},
					modifiers: {},
					data: {
						concepts: {},
						modifiers: {}
					}
				},
				role: 'challenger'
			},
			modifier: "0",
			concept: "0",
			oppUid: '',
			didWin: 0,
			isDone: false,
			opponent: {
				skill: '',
				value: 0,
				diff: 0,
				uid: '',
				username: ''
			},
			player: {
				skill: '',
				value: 0,
				diff: 0,
				uid: '',
				username: ''
			},
			win: {
				diff: 0,
				bonus: 0
			}
		};
	}

	componentDidMount() {
		// block touches
		this.props.app.game.gestureHandler.ignoreTouches = true;

		this.setState({
			data: this.props.app.battleManager.battleData
		}, () => {
			// start watching for changes
			this.watchForChanges();
			this.processEvent();
		});
	}

	componentWillUnmount() {
		const uid = Firebase.auth().currentUser.uid;
		Firebase.database().ref('users/' + uid + '/battle/attack').off();
		Firebase.database().ref('users/' + this.state.oppUid + '/online').off();
	}

	clickedExit(e) {
		e.preventDefault();

		// set the online state back to online
		const uid = Firebase.auth().currentUser.uid;
		Firebase.database().ref('users/' + uid + '/online').set(1);

		this.props.router.showGameUI();
	}

	watchForChanges() {
		const uid = Firebase.auth().currentUser.uid;
		Firebase.database().ref('users/' + uid + '/battle/attack').on('value', (snapshot) => {
			const attackData = snapshot.val();
			this.props.app.battleManager.battleData[this.props.app.battleManager.battleData.role].attack = attackData;

			// reload the state
			this.setState({
				data: this.props.app.battleManager.battleData
			}, () => {
				this.processEvent();
			});
		});


		// also watch for the opponent going offline
		let oppRole = 'challenger';
		if (this.state.data.role == 'challenger') {
			oppRole = 'defender';
		}
		const oppUid = this.state.data[oppRole].uid;

		this.setState({
			oppUid: oppUid
		}, () => {

			Firebase.database().ref('users/' + oppUid + '/online').on('value', (snapshot) => {
				const data = snapshot.val();
				if ((data == 0 || data == 1) && !this.state.isDone) {
					// user has gone offline! forfeited!
					// stop watching
					Firebase.database().ref('users/' + oppUid + '/online').off();

					// process the forfeiture
					this.forfeitEvent();
				}
			});

		});
	}

	processEvent() {
		let didWin = 0;

		if (this.state.data.challenger.attack.state == 1 && this.state.data.defender.attack.state == 1) {
			// both sides have attacked
			// determine who won
			const playerRole = this.state.data.role;
			let opponentRole = 'defender';
			if (this.state.data.role == 'defender') {
				opponentRole = 'challenger';
			}

			// remember, attack data is swapped
			const playerScore = this.state.data[opponentRole].attack.value;
			const opponentScore = this.state.data[playerRole].attack.value;

			const playerSkill = this.state.data[opponentRole].attack.modifier.name + ' ' + this.state.data[opponentRole].attack.concept.name;
			const opponentSkill = this.state.data[playerRole].attack.modifier.name + ' ' + this.state.data[playerRole].attack.concept.name;

			if (opponentScore == 0) {
				// opponent forfeited
				didWin = 3;
			}
			else if (playerScore > opponentScore) {
				// we won
				didWin = 1;
			}
			else if (playerScore == opponentScore) {
				// tie
				didWin = 2;
			}

			this.setState({
				player: {
					skill: playerSkill,
					value: playerScore,
					uid: this.state.data[playerRole].uid,
					username: this.state.data[playerRole].user.username
				},
				opponent: {
					skill: opponentSkill,
					value: opponentScore,
					uid: this.state.data[opponentRole].uid,
					username: this.state.data[opponentRole].user.username
				},
				didWin: didWin,
				isDone: true
			}, () => {
				// stop monitoring for changes
				const uid = Firebase.auth().currentUser.uid;
				Firebase.database().ref('users/' + uid + '/battle/attack').off();
				// reset the game
				this.props.app.battleManager.finishBattle();

				if (didWin == 1 || didWin == 3) {
					// we won, now let's claim the points
					this.winEvent();
				}
			});
		}
	}

	winEvent() {
		// write the points to the database
		// but first read the number of points

		let differential = parseInt(this.state.player.value) - parseInt(this.state.opponent.value);
		let bonusMultiplier = 0;
		let originalPoints;

		const uid = Firebase.auth().currentUser.uid;
		Firebase.database().ref('users/' + uid + '/points').once('value')
			.then((snapshot) => {
				originalPoints = parseInt(snapshot.val());
			
				// now determine the level bonus
				return this.props.app.battleManager.fetchLevelDiff(this.state.player.uid, this.state.opponent.uid);
			})
			.then((levels) => {
				// calculate level differential
				const playerLevel = parseInt(levels[0]);
				const opponentLevel = parseInt(levels[1]);
				const levelDiff = opponentLevel - playerLevel;
				if (levelDiff > 0) {
					bonusMultiplier = levelDiff;
				}

				// now calculate the new points
				const total = Math.floor(differential + (differential * 0.5 * bonusMultiplier));
				const points = originalPoints + total;

				return Firebase.database().ref('users/' + uid + '/points').set(points);
			})
			.then(() => {
				// done!
				// set the state to render out this information
				this.setState({
					win: {
						diff: differential,
						bonus: bonusMultiplier
					}
				});
			});
	}

	forfeitEvent() {
		// get the information for the opponent
		const playerRole = this.state.data.role;
		let opponentRole = 'defender';
		if (this.state.data.role == 'defender') {
			opponentRole = 'challenger';
		}

		// remember, attack data is swapped
		const playerScore = this.state.data[opponentRole].attack.value;
		const playerSkill = this.state.data[opponentRole].attack.modifier.name + ' ' + this.state.data[opponentRole].attack.concept.name;



		this.setState({
			player: {
				skill: playerSkill,
				value: playerScore,
				uid: this.state.data[playerRole].uid,
				username: this.state.data[playerRole].user.username
			},
			opponent: {
				skill: '',
				value: 0,
				uid: this.state.data[opponentRole].uid,
				username: this.state.data[opponentRole].user.username
			},
			didWin: 3,
			isDone: true
		}, () => {
			// stop monitoring for changes
			const uid = Firebase.auth().currentUser.uid;
			Firebase.database().ref('users/' + uid + '/battle/attack').off();
			// reset the game
			this.props.app.battleManager.finishBattle();
			// we won, now let's claim the points
			this.winEvent();
		});

	}

	render() {

		let icon = "ion-android-time";
		let state = "Waiting for opponent attack...";
		let fullHeight = ' full-height';
		let showExit = ' hide';

		let showAnalysis = ' hide';

		if (this.state.isDone) {

			icon = 'ion-arrow-graph-down-right lost';
			state = 'You lost the battle';
			fullHeight = '';
			showExit = '';
			showAnalysis = '';

			if (this.state.didWin == 1) {
				icon = 'ion-trophy won'
				state = 'You won the battle!';
			}
			else if (this.state.didWin == 2) {
				icon = 'ion-arrow-swap'
				state = 'Tie - no winner';
			}
			else if (this.state.didWin == 3) {
				icon = 'ion-trophy won'
				state = 'Your opponent forfeited!';
			}

		}

		let analysis = '';

		if (this.state.didWin == 1 || this.state.didWin == 3) {
			analysis += '<br /><div class="alert alert-success">You earned <b>' + Math.floor((this.state.win.diff * 0.5 * this.state.win.bonus) + this.state.win.diff) + ' XP</b>!</div>';

			analysis += '<br /><ul><li><b>Attack Differential:</b> +' + this.state.win.diff + ' XP</li>';
			if (this.state.win.bonus > 0) {
				analysis += '<li>Your opponent was ' + this.state.win.bonus + ' rank(s) above you.</li>';
				analysis += '<li><b>Bonus:</b> +' + Math.floor(this.state.win.diff * 0.5 * this.state.win.bonus) +  ' XP<ul><li>(rank differential &times; 50% attack differential, rounded down)</li></ul></li>';
			}
			analysis += '<li><b>Total:</b> +' + Math.floor((this.state.win.diff * 0.5 * this.state.win.bonus) + this.state.win.diff) + ' XP</li></ul>';
		}

		let showOpponent = ''
		let showForfeit = ' hide';
		if (this.state.didWin == 3) {
			showOpponent = ' hide';
			showForfeit = '';
		}

		return (
			<div className="full-screen">
				<div className={"page-card" + fullHeight}>
					<div className="page-content">
						<div className="battle-content">
							<div className="text-title dark">
								Battle!
							</div>
							<div className="text-title text-center">
								<span>{this.state.data.challenger.user.username}</span>
								<br />
								vs.
								<br />	
								<span>{this.state.data.defender.user.username}</span>
							</div>

							<div className={"battle-icon text-center " + icon} />
							<div className="text-title dark text-center">
								{state}
							</div>

							<div className={"" + showAnalysis}>
								<div className="text-title">
									Battle Analysis
								</div>
								<div className="text-description">
									<b>You</b> attacked using <b>{this.state.player.skill}</b>, which caused <b>{this.state.player.value} damage</b>.<br />
									<div className={"" + showOpponent}>
										<b>{this.state.opponent.username}</b> attacked using <b>{this.state.opponent.skill}</b>, which caused <b>{this.state.opponent.value} damage</b>.
									</div>
									<div className={"" + showForfeit}>
										<b>{this.state.opponent.username}</b> forfeited the match by going offline or refreshing.
									</div>

									<br />
									<div dangerouslySetInnerHTML={{__html:analysis}} />
								</div>
							</div>
						</div>
					</div>

					<div className={"game-button middle" + showExit}>
						<a href="#" className="content" onClick={this.clickedExit.bind(this)}>
							<div className="icon ion-close-round" />
						</a>
					</div>
					
				</div>
			</div>
		)
	}
}