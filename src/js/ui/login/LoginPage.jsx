import React from 'react';
import Config from '../../bakedConfig.js';

export default class LoginPage extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			message: "Sign in with your Google account to start or continue playing if you've already registered."
		};
	}
	clickedButton(e) {
		e.preventDefault();

		this.props.app.userManager.loginUser()
			.then((userState) => {
				if (userState == 'register') {
					// user is logged into Google, but doesn't have a game account
					// the user needs to register
					this.props.app.ui.showRegistrationPage();
				}
				else if (userState == 'loggedin') {
					// the user is already logged in, go to the game
					this.props.app.loadGame();
				}
			})
			.catch((err) => {
				this.setState({
					message: err.message
				});
			});
	}
	render() {
		return (
			<div className="login-wrap">
				<div className="login-content">
					<div className="logo">
						<img src="assets/logo.png" alt={Config.title} />
					</div>
					<div className="description">
						{this.state.message}
					</div>
					<div className="sign-in">
						<a href="#" onClick={this.clickedButton.bind(this)}>
							<img src="assets/signin.png" alt="Sign in with Google" />
						</a>
					</div>
				</div>
			</div>
		)
	}
}