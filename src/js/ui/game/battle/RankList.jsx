import React from 'react';

const defaultProps = {
	data: []
};

export default class RankList extends React.Component {
	clickedUser(item, e) {
		e.preventDefault();
		this.props.clickedUser(item);
	}

	render() {
		const listItems = this.props.data.map((item, index) => {

			let statusClass = 'offline';
			if (item.online == 1) {
				statusClass = 'online';
			}
			else if (item.online == 2) {
				statusClass = 'busy';
			}

			return <li key={index}>
					<a href="#" onClick={this.clickedUser.bind(this, item)}>
						{item.username}
						<div className={"player-status ion-record " + statusClass} />
					</a>
				</li>
		});

		return (
			<ol className="rank-list">
				{listItems}
			</ol>
		)
	}
}

RankList.defaultProps = defaultProps;