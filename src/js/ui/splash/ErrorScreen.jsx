import React from 'react';

const defaultProps = {
	message: ''
};

export default class ErrorScreen extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<div className="splash-wrap">
				<div className="splash-content">
					<div className="warning">
						<div className="ion-android-sad icon black" />
						{this.props.message}
					</div>
				</div>
			</div>
		)
	}
}

ErrorScreen.defaultProps = defaultProps;