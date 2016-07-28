import React from 'react';

export default class HelpButton extends React.Component {

	clickedButton(e) {
		e.preventDefault();
		this.props.router.showHelpPage();
	}

	render() {
		return (
			<div className="game-button last">
				<a href="#" className="content" onClick={this.clickedButton.bind(this)}>
					<div className="icon ion-help" />
				</a>
			</div>
		)
	}
}