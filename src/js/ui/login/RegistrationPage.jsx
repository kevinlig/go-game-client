import React from 'react';
import Config from '../../bakedConfig.js';

export default class RegistrationPage extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			username: "",
			message: 'Create a user name. Other players will you see using this name.',
			disabled: false
		};
	}
	submit(e) {
		e.preventDefault();

		if (this.state.disabled) {
			return;
		}

		const userManager = this.props.app.userManager;

		this.setState({
			disabled: true,
			message: "Registering account..."
		}, () => {
			if (this.state.username != '') {
				// check if the user name is free
				userManager.lookupUsername(this.state.username)
					.then(() => {
						return userManager.registerUser(this.state.username);
					})
					.then(() => {
						this.props.app.loadGame();
					})
					.catch(() => {
						this.setState({
							message: 'A user already exists with that name.',
							disabled: false
						});
					});
			}
		});
	}
	handleChange(e) {

		// only allow letters and numbers
		const newValue = e.target.value;
		const validation = /[^a-zA-Z0-9]/;
		if (validation.test(newValue)) {
			e.preventDefault();
			return;
		}

		this.setState({
			username: newValue
		});
	}
	render() {

		let disabledClass = '';
		if (this.state.disabled) {
			disabledClass = ' disabled';
		}

		return (
			<div className="login-wrap">
				<div className="login-content">
					<div className="logo">
						<img src="assets/logo.png" alt={Config.title} />
					</div>
					<div className="description">
						{this.state.message}
					</div>
					<form className="registration" onSubmit={this.submit.bind(this)}>
						<input className="form-control" type="text" placeholder="Username" value={this.state.username} onChange={this.handleChange.bind(this)} />
						<button type="submit" className={"btn btn-primary center-block" + disabledClass} disabled={this.state.disabled} onClick={this.submit.bind(this)}>Submit</button>
					</form>
				</div>
			</div>
		)
	}
}