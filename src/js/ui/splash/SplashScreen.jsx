import React from 'react';
import Config from '../../bakedConfig.js';

export default class SplashScreen extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<div className="splash-wrap">
				<div className="splash-content">
					<div className="warning">
						<div className="ion-alert-circled icon" />
						Be aware of your surroundings.<br />
						Do not use while operating heavy machinery. 
					</div>
					
					<div className="logo">
						<img src="assets/logo.png" alt={Config.title} />
					</div>

					<div className="spinner" />

					<div className="disclaimer">
						{Config.disclaimer}
					</div>

				</div>
			</div>
		)
	}
}