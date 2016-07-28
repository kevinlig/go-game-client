import THREE from 'three';
import Mercator from 'globalmercator';

// based on http://barankahyaoglu.com/dev/openstreetmap-in-unity3d/

export const createBuildings = (data, center) => {

	const buildings = [];

	for (const item of data.features) {
		if (item.geometry.type == 'Polygon') {
			// get the coordinates of the building
			const shapeCoords = [];

			for (const coords of item.geometry.coordinates[0]) {
				// convert each coordinate from lat/lon to meters
				const meters = Mercator.latLonToMeters(coords[1], coords[0]);
				// correct the coordinates using the scene bounds and center
				const localCoords = {
					x: meters[0] - center.x,
					y: meters[1] + center.y
				};
				
				shapeCoords.push(new THREE.Vector3(localCoords.x, localCoords.y, 0));
			}

			// build the shape
			const shape = new THREE.Shape(shapeCoords);
			const geometry = new THREE.ExtrudeGeometry(shape, {
				amount: 5,
				bevelEnabled: false
			});
			const material = new THREE.MeshPhongMaterial({color: 0xE0E0E0, shininess: 0, opacity: 0.8, transparent: true});
			const mesh = new THREE.Mesh(geometry, material);
			buildings.push(mesh);
		}
	}
	return buildings;
}

export const createRoads = (data, center) => {
	
	const roads = [];

	for (const item of data.features) {

		// get the coordinates of each road
		const shapeCoords = [];

		const roadShape = new THREE.Geometry();
		let coordinates = item.geometry.coordinates[0];
		if (item.geometry.type == 'LineString') {
			coordinates = item.geometry.coordinates;
		}

		for (const coords of coordinates) {
			// convert each coordinate from lat/lon to meters
			const meters = Mercator.latLonToMeters(coords[1], coords[0]);
			// correct the coordinates using the scene bounds and center
			const localCoords = {
				x: meters[0] - center.x,
				y: meters[1] + center.y
			};
			roadShape.vertices.push(new THREE.Vector3(localCoords.x, localCoords.y, 0.1));
		}
		const material = new THREE.LineBasicMaterial({ color: 0x616161, linewidth: 2});
		const mesh = new THREE.Line(roadShape, material);
		roads.push(mesh);
	}

	return roads;
}

const createWaterShape = (coords) => {
	// build the shape
	const shape = new THREE.Shape(coords);
	const geometry = new THREE.ExtrudeGeometry(shape, {
		amount: 0,
		bevelEnabled: false
	});
	const material = new THREE.MeshPhongMaterial({color: 0x0288D1});
	const mesh = new THREE.Mesh(geometry, material);

	return mesh;
}

export const createWater = (data, center) => {

	const water = [];

	for (const item of data.features) {
		// water could be polygon or multipolygon
		if (item.geometry.type == 'Polygon') {
			const shapeCoords = [];
			for (const coords of item.geometry.coordinates[0]) {
				const meters = Mercator.latLonToMeters(coords[1], coords[0]);
				const localCoords = {
					x: meters[0] - center.x,
					y: meters[1] + center.y
				};
				
				shapeCoords.push(new THREE.Vector3(localCoords.x, localCoords.y, -1));
			}

			water.push(createWaterShape(shapeCoords));
		}
		else if (item.geometry.type == 'MultiPolygon') {

			for (const parent of item.geometry.coordinates[0]) {
				const shapeCoords = [];
				for (const coords of parent) {
					const meters = Mercator.latLonToMeters(coords[1], coords[0]);
					const localCoords = {
						x: meters[0] - center.x,
						y: meters[1] + center.y
					};
					
					shapeCoords.push(new THREE.Vector3(localCoords.x, localCoords.y, -1));
				}

				water.push(createWaterShape(shapeCoords));
			}
		}
	}

	return water;
}

export const createGround = (bounds) => {
	const tileWidth = bounds[2] - bounds[0];
	const tileHeight = bounds[3] - bounds[1];

	const groundMaterial =  new THREE.MeshPhongMaterial({color: 0xAED581, shininess: 0});
	const ground = new THREE.Mesh(new THREE.PlaneGeometry(tileWidth * 3.5, tileHeight * 3.5), groundMaterial);
	ground.position.z = -0.5;
	
	return ground;
}