import React from 'react';

export default class Compass extends React.Component {	
	render() {
		return (
			<div className="compass" style={{transform: 'rotate(' + this.props.rotation + 'deg)'}} />
		)
	}
}