import React from 'react';
import ReactDOM from 'react-dom';

import AppManager from '../core/appManager.js';

import LoginPage from './login/LoginPage.jsx';
import RegistrationPage from './login/RegistrationPage.jsx';

import SplashScreen from './splash/SplashScreen.jsx';
import ErrorScreen from './splash/ErrorScreen.jsx';

import GameOverlay from './game/GameOverlay.jsx';

import HelpPage from './game/help/HelpPage.jsx';

import ItemScreen from './game/items/ItemScreen.jsx';
import UserScreen from './game/user/UserScreen.jsx';
import RankScreen from './game/battle/RankScreen.jsx';
import BattleScreen from './game/battle/BattleScreen.jsx';
import ResultsScreen from './game/battle/ResultsScreen.jsx';

export class UIManager extends React.Component {
	constructor(props) {
		super(props);

		this.app = null;
		this.state = {
			content: null
		};
	}

	subscribeToApp() {
		this.app = AppManager;
		this.app.subscribe(this.receivedAppData.bind(this));
	}

	receivedAppData(data) {
		console.log(data);
	}

	showSignInPage() {
		this.setState({
			content: <LoginPage app={this.app} />
		});
	}

	showRegistrationPage() {
		this.setState({
			content: <RegistrationPage app={this.app} />
		});
	}

	hide() {
		this.setState({
			content: null
		});
	}

	splashScreen() {
		this.setState({
			content: <SplashScreen app={this.app} />
		});
	}

	fullScreenError(error) {
		this.setState({
			content: <ErrorScreen message={error} />
		});
	}

	showGameUI() {
		this.setState({
			content: <GameOverlay app={this.app} router={this} />
		});
	}

	showHelpPage() {
		this.setState({
			content: <HelpPage app={this.app} router={this} />
		});
	}

	showItemScreen(item) {
		this.setState({
			content: <ItemScreen app={this.app} router={this} item={item} />
		});
	}

	showUserScreen() {
		this.setState({
			content: <UserScreen app={this.app} router={this} />
		});
	}

	showRankScreen() {
		this.setState({
			content: <RankScreen app={this.app} router={this} />
		});
	}

	showBattleScreen() {
		this.setState({
			content: <BattleScreen app={this.app} router={this} />
		});
	}

	showResultsScreen() {
		this.setState({
			content: <ResultsScreen app={this.app} router={this} />
		});
	}

	render() {
		let content = this.state.content;

		return (
			<div className="ui">
				{content}
			</div>
		)
	}
}

export const installUI = () => {
	return ReactDOM.render(
		<UIManager />,
		document.getElementById('app')
	);
}