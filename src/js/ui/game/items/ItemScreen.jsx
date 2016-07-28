import React from 'react';
import Firebase from 'firebase';
import Q from 'q';


const defaultProps = {
	item: {}
};

export default class ItemScreen extends React.Component {

	componentDidMount() {
		// block touches
		this.props.app.game.gestureHandler.ignoreTouches = true;
		this.claimItem();
	}

	clickedExit(e) {
		e.preventDefault();
		this.props.router.showGameUI();
	}


	claimItem() {

		const uid = Firebase.auth().currentUser.uid;

		const item = this.props.item;

		// remove the item from Firebase
		Firebase.database().ref('places/item_' + item.id).set(null)
			.then(() => {
				return Firebase.database().ref('duplicates/' + item.serviceId).set(null);		
			})
			.then(() => {
				return Firebase.database().ref('items/item_' + item.id).set(null);
			})
			.then(() => {
				// now fetch the inventory
				return Firebase.database().ref('users/' + uid + '/inventory').once('value');
			})
			.then((snapshot) => {
				const inventory = snapshot.val();

				const updates = [];

				let type = item.data.type + 's';

				// check if other versions of this item exist
				if (inventory[type].hasOwnProperty(item.data.code)) {
					// items exist
					// increment the count
					const count = parseInt(inventory[type][item.data.code]) + 1;
					updates.push(['/' + type, item.data.code, count]);
					
					// update the item data too
					updates.push(['/data/' + type, item.data.code, item.data]);
				}
				else {
					// other items don't exist, add it
					updates.push(['/' + type, item.data.code, 1]);
					
					// write the item data too
					updates.push(['/data/' + type, item.data.code, item.data]);
				}

				// write the updates
				const operations = [];
				updates.forEach((update) => {
					const updateOp = {
						[update[1]]: update[2]
					};
					operations.push(Firebase.database().ref('users/' + uid + '/inventory' + update[0]).update(updateOp));
				})
				return Q.all(operations);

			})
			.then(() => {
				// check if the user now has at least one modifier and one concept
				return Firebase.database().ref('users/' + uid + '/inventory').once('value')
			})
			.then((snapshot) => {
				const inventory = snapshot.val();
				let canBattle = 0;
				if (Object.keys(inventory.concepts).length > 1 && Object.keys(inventory.modifiers).length > 1) {
					canBattle = 1;
				}
				
				return Firebase.database().ref('users/' + uid + '/canBattle').set(canBattle);
			})
			.catch((err) => {
				console.log(err);
			})
	}

	render() {

		let itemHeader = 'ion-gear-b modifier';
		let oppType = 'concept';
		let name = this.props.item.data.name + ' _____';
		if (this.props.item.data.type == 'concept') {
			itemHeader = 'ion-chatbubble-working concept';
			oppType = 'modifier';
			name = '_____ ' + this.props.item.data.name;
		}

		let rarity = 'Frequent';
		if (parseFloat(this.props.item.data.percent) < 20) {
			rarity = 'Common';
		}
		else if (parseFloat(this.props.item.data.percent) < 15) {
			rarity = 'Occasional';
		}
		else if (parseFloat(this.props.item.data.percent) < 10) {
			rarity = 'Rare';
		}

		rarity += ' (accounts for ' + this.props.item.data.percent + '% of ' + this.props.item.data.type + 's)';

		return (
			<div className="full-screen">
				<div className="page-card">
					<div className="page-content">
						<div className="item-header">
							<div className="text-intro">
								You have collected...
							</div>
							<div className={"item-icon " + itemHeader} />
							<h2>{name}</h2>
							<div className="text-type">
								{this.props.item.data.type}
							</div>
						</div>
						<div className="item-content">
							<div className="item-attribute header first">
								Attack Value
							</div>
							<div className="item-attribute value">
								+{this.props.item.data.value} damage
							</div>

							<div className="item-attribute header">
								Rarity
							</div>
							<div className="item-attribute value">
								{rarity}
							</div>

							<div className="item-attribute header">
								Information
							</div>
							<div className="item-attribute value">
								Combine this {this.props.item.data.type} with a {oppType} to create a skill when attacking an opponent. The damage you will deal is the sum of the modifier and concept.
							</div>
						</div>
					</div>
					<div className="game-button middle">
						<a href="#" className="content" onClick={this.clickedExit.bind(this)}>
							<div className="icon ion-checkmark-round" />
						</a>
					</div>
				</div>
			</div>
		)
	}
}

ItemScreen.defaultProps = defaultProps;