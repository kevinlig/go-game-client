import React from 'react';
import Firebase from 'firebase';
import Q from 'q';
import _ from 'lodash';

import Config from '../../../bakedConfig.js';

import InventoryTable from './InventoryTable.jsx';

export default class UserScreen extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			user: {
				username: '',
				inventory: {
					concepts: {},
					modifiers: {},
					data: {
						concepts: {},
						modifiers: {}
					}
				}
			},
			rank: ''
		};
	}

	componentDidMount() {
		// block touches
		this.props.app.game.gestureHandler.ignoreTouches = true;

		this.fetchUserData();
	}

	fetchUserData() {
		const uid = Firebase.auth().currentUser.uid;
		Firebase.database().ref('/users/' + uid).once('value')
			.then((snapshot) => {
				this.setState({
					user: snapshot.val()
				}, () => {
					this.calculateRank(uid);
				});
			});
	}

	calculateRank(uid) {
		// check to see if the user is at least a level 2
		let rank = Config.levels[3];
		if (parseInt(this.state.user.points) >= Config.minPoints) {

			// get the top 4 players by points
			Firebase.database().ref('users').orderByChild('points').limitToLast(4).once('value')
				.then((snapshot) => {
					const results = snapshot.val();
					const players = [];
					Object.keys(results).forEach((result) => {
						players.push({
							points: parseInt(results[result].points),
							uid: result
						});
					});
					const topPlayers = _.orderBy(players, ['points', 'uid'], ['desc', 'asc']);
					
					let position = -1;
					for (let i = 0; i < topPlayers.length; i++) {
						if (topPlayers[i].uid == uid) {
							position = i;
						}
					}

					if (position == -1) {
						// not in the top 4
						rank = Config.levels[2];
					}
					else if (position == 0) {
						// top player
						rank = Config.levels[0];
					}
					else {
						// in between
						rank = Config.levels[1];
					}

					this.setState({
						rank: rank
					});
				});


		}
		else {
			this.setState({
				rank: rank
			});
		}
	}

	clickedExit(e) {
		e.preventDefault();
		this.props.router.showGameUI();
	}

	clickedLogOut(e) {
		e.preventDefault();
		const confirm = window.confirm("Are you sure you want to log out?");
		if (confirm) {
			this.props.app.userManager.logOut();
		}
	}


	render() {

		let modifiers = 'You have no modifiers right now. Collect some!';
		if (Object.keys(this.state.user.inventory.modifiers).length > 1) {
			modifiers = <InventoryTable data={this.state.user.inventory} target="modifiers" />;
		}

		let concepts = 'You have no concepts right now. Collect some!';
		if (Object.keys(this.state.user.inventory.concepts).length > 1) {
			concepts = <InventoryTable data={this.state.user.inventory} target="concepts" />;
		}


		return (
			<div className="full-screen">
				<div className="page-card">
					<div className="page-content">
						<div className="user-header">
							<div className="text-intro">
								User Profile
							</div>
							<div className="item-icon ion-person" />
							<h2>{this.state.user.username}</h2>
							<div className="text-type">
								{this.state.rank} ({this.state.user.points} XP)
							</div>
						</div>						

						<div className="user-content">
							<div className="text-title dark">
								Inventory
							</div>

							<div className="text-title">
								Modifiers
							</div>
							{modifiers}

							<div className="text-title">
								Concepts
							</div>
							{concepts}
						</div>

					</div>
					
					<div className="game-button middle">
						<a href="#" className="content" onClick={this.clickedExit.bind(this)}>
							<div className="icon ion-close-round" />
						</a>
					</div>
					<div className="game-button last">
						<a href="#" className="content" onClick={this.clickedLogOut.bind(this)}>
							<div className="icon ion-power" />
						</a>
					</div>
				
				</div>
			</div>
		)
	}
}
