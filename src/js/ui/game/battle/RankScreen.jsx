import React from 'react';
import Firebase from 'firebase';
import _ from 'lodash';

import RankList from './RankList.jsx';

import Config from '../../../bakedConfig.js';

export default class RankScreen extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			topLevel: [],
			secondLevel: [],
			thirdLevel: [],
			lowestLevel: []
		};
	}

	componentDidMount() {
		// block touches
		this.props.app.game.gestureHandler.ignoreTouches = true;

		// listen for Firebase user changes
		this.listener = Firebase.database().ref('users').on('value', (snapshot) => {
			this.parseUsers(snapshot.val());
		});
	}

	componentWillUnmount() {
		// stop listening for changes
		Firebase.database().ref('users').off();
	}

	parseUsers(data) {
		// convert into an array of users
		const unsortedPlayers = [];
		Object.keys(data).forEach((key) => {
			const player = data[key];
			player.identifier = key;
			player.points = parseFloat(player.points);
			unsortedPlayers.push(player);
		});

		const sortedPlayers = _.orderBy(unsortedPlayers, ['points', 'identifier', 'username'], ['desc', 'asc', 'asc']);
		
		// iterate through the sorted players
		const topLevel = [];
		const secondLevel = [];
		const thirdLevel = [];
		const lowestLevel = [];
		let i = 0;
		sortedPlayers.forEach((player) => {
			if (player.canBattle < 1) {
				// players without enough items to battle automatically show as offline
				player.online = -1;
			}

			if (player.points < Config.minPoints) {
				// not enough points to qualify for rank
				lowestLevel.push(player);
			}
			
			else if (i == 0) {
				// top player
				topLevel.push(player);
			}
			else if (i < 4) {
				// second tier
				secondLevel.push(player);
			}
			else {
				thirdLevel.push(player);
			}
		
			i++;
		});

		this.setState({
			topLevel: topLevel,
			secondLevel: secondLevel,
			thirdLevel: thirdLevel,
			lowestLevel: lowestLevel
		});
	}

	clickedExit(e) {
		e.preventDefault();
		this.props.router.showGameUI();
	}

	clickedUser(user) {
		// check if the user is able to battle anyone
		if (this.props.app.userManager.canBattle == 0) {
			// user doesn't have enough items to battle
			window.alert('You cannot battle anyone until you have collected at least one modifier and one concept.');
			return;
		}

		// check if they clicked themselves
		if (user.identifier == Firebase.auth().currentUser.uid) {
			// ignore this
			window.alert('You cannot battle yourself.');
		}
		// now check if the user is online
		else if (user.online != 1) {
			// not available, alert the player
			let message = "You cannot battle this player because they are not online right now.";
			if (user.online == -1) {
				message = "You cannot battle this player because they have not collected at least one modifier and one concept.";
			}
			else if (user.online == 2) {
				message = "You cannot battle this player because they are currently battling someone else.";
			}

			window.alert(message);
		}
		else {
			// challenge the player!
			this.props.app.battleManager.challengeUser(user.identifier)
				.then(() => {
					this.props.router.showBattleScreen();
				});
		}
	}

	render() {

		let topLevel = "No players have achieved this rank.";
		let secondLevel = "No players have achieved this rank.";
		let thirdLevel = "No players have achieved this rank.";
		let lowestLevel = "No players have achieved this rank.";

		if (this.state.topLevel.length > 0) {
			topLevel = <RankList data={this.state.topLevel} clickedUser={this.clickedUser.bind(this)} />;
		}
		if (this.state.secondLevel.length > 0) {
			secondLevel = <RankList data={this.state.secondLevel} clickedUser={this.clickedUser.bind(this)} />;
		}
		if (this.state.thirdLevel.length > 0) {
			thirdLevel = <RankList data={this.state.thirdLevel} clickedUser={this.clickedUser.bind(this)} />;
		}
		if (this.state.lowestLevel.length > 0) {
			lowestLevel = <RankList data={this.state.lowestLevel} clickedUser={this.clickedUser.bind(this)} />;
		}

		return (
			<div className="full-screen">
				<div className="page-card">
					<div className="page-content">
						<div className="battle-content">
							<div className="text-title dark">
								Players
							</div>

							<div className="text-description">
								Tap on an online player (indicated by a green <span className="ion-record online" />) to challenge them to a battle.
							</div>

							<div className="text-title">
								{Config.levels[0]}
							</div>

							{topLevel}

							<div className="text-title">
								{Config.levels[1]}
							</div>

							{secondLevel}

							<div className="text-title">
								{Config.levels[2]}
							</div>

							{thirdLevel}

							<div className="text-title">
								{Config.levels[3]}
							</div>

							{lowestLevel}
							
						</div>
					</div>
					<div className="game-button middle">
						<a href="#" className="content" onClick={this.clickedExit.bind(this)}>
							<div className="icon ion-close-round" />
						</a>
					</div>
				</div>
			</div>
		)
	}
}