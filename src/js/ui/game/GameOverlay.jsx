import React from 'react';

import UserButton from './buttons/UserButton.jsx';
import BattleButton from './buttons/BattleButton.jsx';
import HelpButton from './buttons/HelpButton.jsx';
import Compass from './Compass.jsx';

export default class GameOverlay extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			rotation: this.props.app.game.cameraManager.tempRotation
		};
	}

	componentDidMount() {
		// unblock touches
		this.props.app.game.gestureHandler.ignoreTouches = false;

		// listen for rotation changes
		this.props.app.game.cameraManager.registerForRotationChanges(this.updateRotation.bind(this));
	}

	componentWillUnmount() {
		this.props.app.game.cameraManager.unregisterForRotationChanges();
	}

	updateRotation(rotation) {
		this.setState({
			rotation: rotation
		});
	}

	render() {
		return (
			<div className="game-wrap">
				<Compass rotation={this.state.rotation} />
				<UserButton {...this.props} />
				<BattleButton {...this.props} />
				<HelpButton {...this.props} />
			</div>
		)
	}
}