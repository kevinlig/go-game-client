import React from 'react';

import UserButton from './buttons/UserButton.jsx';
import BattleButton from './buttons/BattleButton.jsx';
import HelpButton from './buttons/HelpButton.jsx';

export default class GameOverlay extends React.Component {
	componentDidMount() {
		// unblock touches
		this.props.app.game.gestureHandler.ignoreTouches = false;
	}
	render() {
		return (
			<div className="game-wrap">
				<UserButton {...this.props} />
				<BattleButton {...this.props} />
				<HelpButton {...this.props} />
			</div>
		)
	}
}