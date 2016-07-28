import React from 'react';

export default class BattleButton extends React.Component {

	clickedButton(e) {
		e.preventDefault();
		this.props.router.showRankScreen();
	}

	render() {
		return (
			<div className="game-button middle">
				<a href="#" className="content" onClick={this.clickedButton.bind(this)}>
					<div className="icon primary ion-arrow-graph-up-right" />
				</a>
			</div>
		)
	}
}