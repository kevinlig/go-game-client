import React from 'react';

export default class BattleScreen extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			data: {
				challenger: {
					user: {
						username: ''
					}
				},
				defender: {
					user: {
						username: ''
					}
				},
				inventory: {
					concepts: {},
					modifiers: {},
					data: {
						concepts: {},
						modifiers: {}
					}
				}
			},
			modifier: "0",
			concept: "0"
		};
	}

	componentDidMount() {
		// block touches
		this.props.app.game.gestureHandler.ignoreTouches = true;

		this.setState({
			data: this.props.app.battleManager.battleData
		});
	}

	clickedExit(e) {
		e.preventDefault();
		this.props.router.showGameUI();
	}

	pickedModifier(e) {
		this.setState({
			modifier: e.target.value
		});
	}

	pickedConcept(e) {
		this.setState({
			concept: e.target.value
		});
	}


	confirmAttack(e) {
		e.preventDefault();
		this.props.app.battleManager.performAttack(this.state.modifier, this.state.concept, this.state.data.inventory.data);
	}

	render() {

		let skill = 'No skill created yet.';
		let damage = '';
		let buttonClass = ' hide';
		if (this.state.modifier != "0" && this.state.concept != "0") {
			skill = this.state.data.inventory.data.modifiers[this.state.modifier].name + " " + this.state.data.inventory.data.concepts[this.state.concept].name;
			damage = this.state.data.inventory.data.modifiers[this.state.modifier].value + this.state.data.inventory.data.concepts[this.state.concept].value + " damage";
			buttonClass = '';
		}
		else if (this.state.modifier != "0") {
			skill = this.state.data.inventory.data.modifiers[this.state.modifier].name + " ___";
			damage = this.state.data.inventory.data.modifiers[this.state.modifier].value + " damage";
		}
		else if (this.state.concept != "0") {
			skill = " ___" + this.state.data.inventory.data.concepts[this.state.concept].name;
			damage = this.state.data.inventory.data.concepts[this.state.concept].value + " damage";
		}

		let modifiers = Object.keys(this.state.data.inventory.modifiers).map((key, index) => {
			const quantity = this.state.data.inventory.modifiers[key];
			if (key != 'dummy' && quantity > 0) {
				const item = this.state.data.inventory.data.modifiers[key];
				return <option value={item.code} key={index}>{item.name + " +" + item.value + " damage (" + quantity + " qty)"}</option>;
			}
		});

		let concepts = Object.keys(this.state.data.inventory.concepts).map((key, index) => {
			const quantity = this.state.data.inventory.concepts[key];
			if (key != 'dummy' && quantity > 0) {
				const item = this.state.data.inventory.data.concepts[key];
				return <option value={item.code} key={index}>{item.name + " +" + item.value + " damage (" + quantity + " qty)"}</option>;
			}
		});

		return (
			<div className="full-screen">
				<div className="page-card full-height">
					<div className="page-content">
						<div className="battle-content">
							<div className="text-title dark">
								Battle!
							</div>
							<div className="text-title text-center">
								<span>{this.state.data.challenger.user.username}</span>
								<br />
								vs.
								<br />	
								<span>{this.state.data.defender.user.username}</span>
							</div>

							<br />

							<div className="text-title dark text-center">
								Selected Skill:
							</div>
							<div className="text-title dark text-center">
								{skill}
							</div>
							<div className="text-title text-center">
								{damage}
							</div>
							<br />

							<div className="text-description">
								Create a skill by selecting a <b>modifier</b> followed by a <b>concept</b> from your inventory.
							</div>

							<div className="text-title">
								Available Modifiers
							</div>
							<select value={this.state.modifier} onChange={this.pickedModifier.bind(this)}>
								<option value="0"></option>
								{modifiers}
							</select>

							<div className="text-title">
								Available Concepts
							</div>

							<select value={this.state.concept} onChange={this.pickedConcept.bind(this)}>
								<option value="0"></option>
								{concepts}
							</select>

							<br /><br />
							<div className={"text-center" + buttonClass}>
								<button className="btn btn-primary" onClick={this.confirmAttack.bind(this)}>Attack</button>
							</div>
						</div>
					</div>
					
				</div>
			</div>
		)
	}
}