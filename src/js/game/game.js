import THREE from 'three';
import Q from 'q';
import _ from 'lodash';
import Mercator from 'globalmercator';
import * as MapHelper from './helpers/mapHelper.js';
import * as MapGenerator from './mapGenerator.js';
import GestureHandler from './gestureHandler.js';
import CameraManager from './cameraManager.js';
import MarkerManager from './markerManager.js';

import AppManager from '../core/appManager.js';

export default class Game {
	constructor(width, height) {
		this.height = height;
		this.width = width;

		this.app = AppManager;

		this.renderer;
		this.scene;
		this.camera;

		this.meshLoader;
		this.objectLoader;

		this.centerTileCoords;
		this.isDownloading = false;

		this.cameraManager;
		this.gestureHandler;
		this.markerManager;

		this.previousLocation = null;
		this.activeTiles = {};
		this.locationPin;
		this.ground;

		this.markerMeshes;

		this.centerPoint = {
			x: 0,
			y: 0
		};

		this.center = {
			lat: 0,
			lon: 0,
			zoom: 16
		};
	}

	init(domId) {
		//set up the renderer
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(this.width, this.height);
		// set the background color
		this.renderer.setClearColor(0xB3E5FC, 1);

		// create the scene object
		this.scene = new THREE.Scene();

		// create the camera
		this.camera = new THREE.PerspectiveCamera(75, this.width/this.height, .1, 10000);
		// position the camera south of the focus point and look north at it
		this.camera.position.z = 120;
		this.camera.position.x = 0;
		this.camera.position.y = -100;
		this.camera.up = new THREE.Vector3(0,0,1);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.scene.add(this.camera);

		// create a global light
		const light = new THREE.HemisphereLight(0xFFFFFF, 0x757575, 0.9);
		this.scene.add(light);

		// add a keylight
		const keylight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
		keylight.position.x = 0;
		keylight.position.y = -400;
		keylight.position.z = 120;
		this.scene.add(keylight);


		// nasty hack to import the ColladaLoader bc ThreeJS can't handle ES6 modules
		window.THREE = THREE;
		require('three/examples/js/loaders/ColladaLoader.js');
		this.meshLoader = new THREE.ColladaLoader();
		this.meshLoader.options.convertUpAxis = true;

		// set up the object that will handle camera rotation
		this.cameraManager = new CameraManager(this);

		// set up gesture detection
		this.gestureHandler = new GestureHandler(this);
		this.gestureHandler.bindGestures();

		// set up the marker manager
		this.markerManager = new MarkerManager(this);

		// watch for window resize events
		window.addEventListener('resize', this.windowResized.bind(this), false);

		document.getElementById(domId).appendChild(this.renderer.domElement);

		// start the render cycle
		this.render();
	}
	render() {
		window.requestAnimationFrame(this.render.bind(this));
		this.renderer.render(this.scene, this.camera);
	}


	parseTile(data, tilePosition) {
		// check to see if this tile is currently rendered on the map
		const tileName = data.name;
		if (this.activeTiles.hasOwnProperty(tileName)) {
			// it's active, don't re-create it
			return;
		}

		// calculate where to position the meshes in the scene
		const bounds = Mercator.tileBounds(tilePosition.x, tilePosition.y, tilePosition.zoom);
		const center = {
			x: ((bounds[2] - bounds[0])/2) + bounds[0],
			y: ((bounds[3] - bounds[1])/2) + bounds[1]
		};
		const buildings = MapGenerator.createBuildings(data.buildings, center);
		const roads = MapGenerator.createRoads(data.roads, center);
		const water = MapGenerator.createWater(data.water, center);

		const tileMesh = new THREE.Group();
		tileMesh.name = tileName;

		// add everything to the scene
		buildings.forEach((mesh) => {
			tileMesh.add(mesh);
		});
		roads.forEach((mesh) => {
			tileMesh.add(mesh);
		});
		water.forEach((mesh) => {
			tileMesh.add(mesh);
		});

		this.scene.add(tileMesh);
	}

	cleanupTiles(currentTiles) {
		// identify any active tiles that are no longer needed
		const retiredTiles = [];
		Object.keys(this.activeTiles).forEach((tileName) => {
			if (!currentTiles.hasOwnProperty(tileName)) {
				// tile is no longer active, remove it
				retiredTiles.push(tileName);
			}
		});

		// remove them
		retiredTiles.forEach((tileName) => {
			delete this.activeTiles[tileName];
			const tileMesh = this.scene.getObjectByName(tileName);
			this.scene.remove(tileMesh);
		});
	}

	loadMap(lat, lon, zoom = 16) {

		let tilePosition;
		let tileBounds;

		// if the user location updated before the previous downloads finish, wait for those before trying to update again
		// this should prevent duplicate meshes
		if (this.isDownloading) {
			return;
		}

		// determine if we need to download anything at all or just move the location marker
		if (this.previousLocation) {
			const distance = MapHelper.distanceBetweenCoords(this.previousLocation, [lat,lon]);
			if (distance <= 10) {
				// at distances of less than 10m, we really don't care at all
				return;
			}
			else if (distance <= 300) {
				// we've moved less than 300m, don't update the map, just the markers
				this.fastUpdateLocation(lat, lon, zoom);
				return;
			}
			else {
				this.previousLocation = [lat, lon];
			}
		}
		else {
			this.previousLocation = [lat, lon];
		}
		this.isDownloading = true;
		MapHelper.loadData(lat, lon, zoom, this.activeTiles)
			.then((data) => {

				tilePosition = data.tile;
				tileBounds = data.bounds;

				// if this isn't our first load, we should position the meshes relative to the original tile we started at
				if (this.centerTileCoords) {
					tilePosition = this.centerTileCoords;
				}
				else {
					this.centerTileCoords = data.tile;
				}

				const requestedTiles = {};

				// parse only the new tiles
				data.data.forEach((tile) => {
					this.parseTile(tile, tilePosition);
				});

				// keep the required tiles that are already required
				data.visible.forEach((tile) => {
					requestedTiles[tile] = 1;
				})

				this.cleanupTiles(requestedTiles);

				// center the camera
				this.center.lat = lat;
				this.center.lon = lon;
				this.center.zoom = zoom;

				// calculate the center point and put the camera there
				this.centerPoint = MapHelper.getPixelCoords(lat, lon, zoom, this.centerTileCoords);
				this.cameraManager.rotateCamera(0);

				if (!this.locationPin) {
					this.dropPin();
				}
				else {
					this.updatePin();
				}

				if (Object.keys(this.markerManager.markerMeshes).length == 0) {
					// load the marker meshes
					return this.markerManager.loadMeshes();
				}
			})
			.then(() => {
				// load markers
				this.markerManager.updateMapItems(lat, lon);

				// notify the app manager that the map is ready
				this.app.mapDidUpdate(lat, lon);
				this.isDownloading = false;
			});
	}

	fastUpdateLocation(lat, lon, zoom) {
		// we don't need to load anything new, just reposition the camera and location pin
		// center the camera
		this.center.lat = lat;
		this.center.lon = lon;
		this.center.zoom = zoom;

		// calculate the center point and put the camera there
		this.centerPoint = MapHelper.getPixelCoords(lat, lon, zoom, this.centerTileCoords);
		this.cameraManager.rotateCamera(0);
		this.updatePin();
		this.app.mapDidUpdate(lat, lon);
	}

	dropPin() {
		this.meshLoader.load('/assets/location.dae', (collada) => {
			this.locationPin = collada.scene.children[0].children[0];
			this.locationPin.material = new THREE.MeshPhongMaterial({color: 0x1565C0, shininess: 0});
			this.locationPin.position.x = this.centerPoint.x;
			this.locationPin.position.y = this.centerPoint.y;
			this.locationPin.position.z = 2;
			this.locationPin.rotation.x = Math.PI / 2;
			this.locationPin.scale.x = this.locationPin.scale.z = 150;
			this.locationPin.scale.y = 200;
			this.locationPin.name = "LocationPin";

			this.scene.add(this.locationPin);

			// also create the ground
			const bounds = Mercator.tileBounds(this.centerTileCoords.x, this.centerTileCoords.y, this.centerTileCoords.zoom);
			const center = {
				x: ((bounds[2] - bounds[0])/2) + bounds[0],
				y: ((bounds[3] - bounds[1])/2) + bounds[1]
			};
			this.ground = MapGenerator.createGround(bounds);
			this.scene.add(this.ground);

		});
	}

	updatePin() {
		this.locationPin.position.x = this.centerPoint.x;
		this.locationPin.position.y = this.centerPoint.y;
		this.ground.position.x = this.centerPoint.x;
		this.ground.position.y = this.centerPoint.y;
	}

	windowResized() {
		this.height = window.innerHeight;
		this.width = window.innerWidth;

		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();

	}

}