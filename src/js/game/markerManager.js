import THREE from 'three';
import Request from 'superagent';
import Firebase from 'firebase';
import GeoFire from 'geofire';
import Q from 'q';

import Config from '../bakedConfig.js';

import * as MapHelper from './helpers/mapHelper.js';

export default class MarkerManager {
	constructor(game) {
		this.game = game;

		this.objectLoader = new THREE.ObjectLoader();

		this.markerMeshes = {};

		this.activeItems = {};
		this.itemList = [];
		this.itemData = {};
		this.nonBonus = [];
		
		this.currentWatcher;

		this.lastRequest = 0;

	}

	loadMesh(path) {
		const deferred = Q.defer();
	
		this.objectLoader.load(path, (data) => {
			deferred.resolve(data);
		});

		return deferred.promise;
	}

	loadMeshes() {
		// load the meshes that will be used for the markers
		// load the meses we'll be using
		const deferred = Q.defer();

		let marker;
		let modifierMarker;
		let conceptMarker;

		this.loadMesh('assets/marker.json')
			.then((data) => {
				marker = data;
				marker.rotation.x = Math.PI / 2;
				marker.position.z = 7;
				marker.scale.x = marker.scale.y = marker.scale.z = 200;

				return this.loadMesh('assets/gear.json')
			})
			.then((data) => {
				// load the gear icon
				const gear = data;
				gear.name = "MarkerIcon";
				gear.rotation.x = Math.PI / 2;
				gear.position.z = 20;
				gear.scale.x = gear.scale.y = gear.scale.z = 200;
				gear.material = new THREE.MeshPhongMaterial({color: 0x8E24AA, shininess: 0});

				// place the gear on top of a copy of the marker
				const itemMarker = marker.clone();
				itemMarker.material = new THREE.MeshPhongMaterial({color: 0x8E24AA, shininess: 0});
				
				// add a large cube around it for easier hit detection
				const cubeGeo = new THREE.BoxGeometry(15, 15, 28);
				// set the material to be invisible
				const cubeMat = new THREE.MeshPhongMaterial({color: 0x8E24AA, shininess: 0});
				cubeMat.visible = false;
				const hitCube = new THREE.Mesh(cubeGeo, cubeMat);
				hitCube.position.z = 14;

				// add it all to a group
				modifierMarker = new THREE.Object3D();
				modifierMarker.add(itemMarker);
				modifierMarker.add(gear);
				modifierMarker.add(hitCube);

				return this.loadMesh('assets/bubble.json');
			})
			.then((data) => {
				// load the bubble icon
				const bubble = data;
				bubble.name = "MarkerIcon";
				bubble.rotation.x = Math.PI / 2;
				bubble.position.z = 20;
				bubble.scale.x = bubble.scale.y = bubble.scale.z = 200;
				bubble.material = new THREE.MeshPhongMaterial({color: 0xF4511E, shininess: 0});

				// place the bubble on top of a copy of the marker
				const itemMarker = marker.clone();
				itemMarker.material = new THREE.MeshPhongMaterial({color: 0xF4511E, shininess: 0});

				// add a large cube around it for easier hit detection
				const cubeGeo = new THREE.BoxGeometry(15, 15, 28);
				// set the material to be invisible
				const cubeMat = new THREE.MeshPhongMaterial({color: 0xF4511E, shininess: 0});
				cubeMat.visible = false;
				const hitCube = new THREE.Mesh(cubeGeo, cubeMat);
				hitCube.position.z = 14;

				// add it all to a group
				conceptMarker = new THREE.Object3D();
				conceptMarker.add(itemMarker);
				conceptMarker.add(bubble);
				conceptMarker.add(hitCube);


				// save all the meshes
				this.markerMeshes = {
					modifier: modifierMarker,
					concept: conceptMarker
				};

				deferred.resolve();
			});

		return deferred.promise;
	}

	watchForItems(lat, lon) {

		// start watching for items near the current location

		const db = Firebase.database();
		const geoFire = new GeoFire(db.ref('/places'));
		this.currentWatcher = geoFire.query({
			center: [lat, lon],
			radius: 0.5
		});

		let newItems = [];
		
		this.currentWatcher.on('key_entered', (key, location) => {
			newItems.push(this.fetchItemData(key));
		});

		this.currentWatcher.on('key_exited', (key, location) => {
			this.removeItem(key);
		});

		this.currentWatcher.on('ready', () => {
			// perform all the inserts at once
			if (newItems.length > 0) {
				Q.all(newItems)
					.then(() => {
						this.changeCallback(lat, lon);
						newItems = [];
					});

			}
			else {
				this.changeCallback(lat, lon);
			}

		});

	}

	changeCallback(lat, lon) {
		this.cleanupItems();
		// require at least 2 minutes before the next request
		if (this.nonBonus.length < 8 && Math.floor(Date.now()/1000) - this.lastRequest > 120) {
			this.requestNewItems(lat, lon);
		}
	}

	fetchItemData(id) {
		const deferred = Q.defer();

		Firebase.database().ref('items/' + id).once('value')
			.then((snapshot) => {
				this.placeItem(snapshot.val());
				deferred.resolve();
			});

		return deferred.promise;
	}

	placeItem(item) {
		// check if the marker is already in the scene
		if (!item) {
			return;
		}

		if (this.activeItems.hasOwnProperty('item_' + item.id)) {
			// it exists, do nothing
			return;
		}

		// get the pixel coordinates to drop the marker at
		const pos = MapHelper.getPixelCoords(item.lat, item.lon, this.game.center.zoom, this.game.centerTileCoords);

		// determine the model to use
		let model = this.markerMeshes.modifier;
		if (item.data.type == "concept") {
			model = this.markerMeshes.concept;
		}

		// make a clone of the model and use that
		const mesh = model.clone();

		mesh.position.x = pos.x;
		mesh.position.y = pos.y;
		mesh.name = 'item_' + item.id;

		// save a reference to the mesh for later access
		this.activeItems['item_' + item.id] = mesh;
		this.itemData['item_' + item.id] = item;

		if (item.serviceId.indexOf('bonus_') == -1) {
			this.nonBonus.push(item);
		}

		this.game.scene.add(mesh);

		// update the current array of meshes for the touch raycaster
		this.itemList.push(mesh);
	}

	removeItem(id) {
		
		const mesh = this.activeItems[id];
		// remove the mesh from the scene
		this.game.scene.remove(mesh);

		// remove the item from the reference objects
		delete this.activeItems[id];
		delete this.itemData[id];

	}

	cleanupItems() {
		// remove unneeded items
		const unneeded = [];
		Object.keys(this.activeItems).forEach((id) => {
			const item = this.itemData[id];
			const distance = GeoFire.distance([item.lat, item.lon],[this.game.center.lat, this.game.center.lon]);

			if (distance > 0.3) {
				// too far away, get rid of it
				unneeded.push(id);
			}
		});

		unneeded.forEach((item) => {
			this.removeItem(item);
		});

		// update the current array of meshes for the touch raycaster
		this.itemList = [];
		this.nonBonus = [];
		for (const key in this.activeItems) {
			this.itemList.push(this.activeItems[key]);
			if (key.indexOf('bonus_') == -1) {
				this.nonBonus.push(this.activeItems[key]);
			}
		}
	}

	updateMapItems(lat, lon) {

		// cancel any previous watchers and restart
		if (this.currentWatcher) {
			this.currentWatcher.cancel();
		}

		this.watchForItems(lat, lon);

	}


	requestNewItems(lat, lon) {
		this.lastRequest = Math.floor(Date.now()/1000);
		Request.post(Config.requestApi)
			.send({
				data: {
					lat: lat,
					lon: lon
				}
			})
			.end((err, res) => {
				// do nothing
			});
	}

	colletItem(id) {
		// this should ideally happen server-side
		// remove the item from Firebase
	}
}