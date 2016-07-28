import React from 'react';

export default class UserButton extends React.Component {

	clickedButton(e) {
		e.preventDefault();
		this.props.router.showUserScreen();
		return false;
	}

	render() {
		return (
			<div className="game-button first">
				<a href="#" className="content" onClick={this.clickedButton.bind(this)}>
					<div className="icon ion-person" />
				</a>
			</div>
		)
	}
}