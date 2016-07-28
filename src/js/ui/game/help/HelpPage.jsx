import React from 'react';

export default class HelpPage extends React.Component {
	componentDidMount() {
		// block touches
		this.props.app.game.gestureHandler.ignoreTouches = true;
	}

	clickedExit(e) {
		e.preventDefault();
		this.props.router.showGameUI();
	}

	render() {
		return (
			<div className="full-screen">
				<div className="page-card">
					<div className="page-content">
						<div className="help-content">
							<div className="text-title dark">
								Help
							</div>
							<div className="text-title">
								Objective
							</div>
							<div className="text-content">
								Battle other players to achieve the top rank in the game.
							</div>

							<div className="text-title">
								Collecting Items
							</div>
							<div className="text-content">
								Using your smartphone, walk around your area looking for collectible items that are marked on the map. Items include:<br />
								<ul className="no-style">
									<li><span className="ion-gear-b modifier" />&nbsp;&nbsp; <b>Modifiers</b> are adjectives that describe a concept.</li>
									<li><span className="ion-chatbubble-working concept" />&nbsp;&nbsp; <b>Concepts</b> are nouns that form the base of a skill.</li>
								</ul>
								When you are near an item, tap on it to collect it.
								<br /><br />
								Combine <b>one modifier</b> with <b>one concept</b> to create a <b>skill</b>. Skills are created and used to attack other players.
								<br /><br />
								<b>TIP!</b> You cannot battle anyone or be challenged until you have collected at least one modifier and one concept.
							</div>

							<div className="text-title">
								Battling Players
							</div>
							<div className="text-content">
								<span className="button-icon ion-arrow-graph-up-right" /> &nbsp;&nbsp; &nbsp;&nbsp; This button shows you a ranked list of other players (players are ranked by XP). Tap on an online player (indicated by a green dot) to challenge them to a battle.
								<br /><br />
								When battling players, you will create a skill by picking a modifier and concept from your inventory. The player who deals the highest damage (the sum of the modifier and concept attack values) wins the battle. In the case of a tie, no one wins.
								<br /><br />
								The winner receives XP equal to the damage differential. The winner may also receive a bonus equal to 50% of the damage differential &times; the number of levels that the opponent outranks the winner by.
								<br /><br />
								<b>TIP!</b> You can earn significant XP by battling players with higher rank than you.<br /><br />
								<b>TIP!</b> If you disconnect or refresh the page during a battle, you forfeit the match. This means your opponent will earn XP equal to their entire attack value, <i>plus</i> any bonus they were eligible for.
							</div>

							<div className="text-title">
								Viewing Profile Information
							</div>
							<div className="text-content">
								<span className="button-icon ion-person" /> &nbsp;&nbsp; &nbsp;&nbsp; This button displays information about you, including your user name, rank, total XP, and your inventory. You can also log out by tapping the <span className="ion-power" /> button on this screen.
							</div>
							
							<br /><br />

							<div className="text-title dark">
								Licenses
							</div>
							<div className="text-content">
								Map data is &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors and <a href="http://whosonfirst.mapzen.com#License" target="_blank">Who's On First</a>.
								<br /><br />
								Depending on your location, the game server may utilize data from Google Places.
								<br /><img src="assets/google.png" alt="Powered by Google" />
								<br /><br />
								Additional disclosures:<br />
								<small>
									This application utilizes <a href="https://github.com/davvo/globalmercator" target="_blank">globalmercator</a>. &copy; 2016 David Ershag under a <a href="http://spdx.org/licenses/BSD-2-Clause" target="_blank">BSD-2-Clause license</a>.<br />
									The use of the Google Places API means you are bound by Google's <a href="https://www.google.com/intl/en/policies/terms" target="_blank">Terms of Service</a> and <a href="https://www.google.com/policies/privacy" target="_blank">Privacy Policy</a>.
								</small>
							</div>
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