import React from 'react';
import _ from 'lodash';

export default class InventoryTable extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			data: null
		};
	}

	componentDidMount() {
		this.parseData();
	}

	componentDidUpdate(prevProps, prevState) {
		if (!_.isEqual(prevProps.data, this.props.data)) {
			this.parseData();
		}
	}

	parseData() {
		const items = this.props.data[this.props.target];

		if (Object.keys(items).length > 0) {
			const rows = [];

			const itemKeys = Object.keys(items);
			
			for (let i in itemKeys) {
				const item = itemKeys[i];

				if (item == 'dummy') {
					continue;
				}

				const itemData = this.props.data.data[this.props.target][item];

				const quantity = parseInt(this.props.data[this.props.target][item]);

				const row = <tr key={i}>
					<td>{itemData.name}</td>
					<td>{itemData.value}</td>
					<td>{quantity}</td>
				</tr>;

				if (quantity > 0) {
					rows.push(row);
				}
			}

			this.setState({
				data: rows
			});

		}
		else {
			this.setState({
				data: null
			});
		}
	}

	render() {
		
		return (
			<table className="table table-striped">
				<thead>
					<tr>
						<th>
							Name
						</th>
						<th>
							Damage
						</th>
						<th>
							Quantity
						</th>
					</tr>
				</thead>
				<tbody>
				{this.state.data}
				</tbody>
			</table>
		)
	}
}