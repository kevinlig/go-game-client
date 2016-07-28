import Request from 'superagent';
import Q from 'q';
import THREE from 'three';
import * as Mercator from 'globalmercator';

export const getTileCoords = (lat, lon, zoom = 15) => {
	const n = Math.pow(2, zoom);
	const x = n * ((lon + 180) / 360);

	const latRad = lat * (Math.PI / 180);
	const y = n * (1 - (Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI)) / 2;

	return {
		x: Math.floor(x),
		y: Math.floor(y),
		zoom: zoom
	};
}

export const getPixelCoords = (lat, lon, zoom, centerCoords = null) => {

	let tileCoords = getTileCoords(lat, lon, zoom);
	if (centerCoords) {
		tileCoords = centerCoords;
	}

	// calculate the size of each tile
	const bounds = Mercator.tileBounds(tileCoords.x, tileCoords.y, tileCoords.zoom);
	const center = {
		x: ((bounds[2] - bounds[0])/2) + bounds[0],
		y: ((bounds[3] - bounds[1])/2) + bounds[1]
	};

	const meters = Mercator.latLonToMeters(lat, lon);
	// correct the coordinates using the scene bounds and center
	const localCoords = {
		x: meters[0] - center.x,
		y: meters[1] + center.y
	};

	return localCoords;
}

export const downloadData = (x, y, zoom, offX = 0, offY = 0) => {
	const deferred = Q.defer();

	Request.get('https://vector.mapzen.com/osm/buildings,roads,water/' + zoom + '/' + (x + offX) + '/' + (y + offY) + '.json')
		.end((err, res) => {
			if (err) {
				deferred.reject(err);
			}
			else {
				const output = res.body;
				output.name = 'Tile' + (x + offX) + '/' + (y + offY)
				deferred.resolve(output);
			}
		});

	return deferred.promise;
}

export const loadData = (lat, lon, zoom, activeTiles = {}) => {
	const deferred = Q.defer();

	let tileCoords = getTileCoords(lat, lon, zoom);

	// calculate the size of each tile
	const bounds = Mercator.tileBounds(tileCoords.x, tileCoords.y, tileCoords.zoom);
	const tileWidth = bounds[2] - bounds[0];
	const tileHeight = bounds[3] - bounds[1];

	const downloadOps = [];
	const tileNames = [];

	// download the surrounding tiles too
	for (let x = -1; x <= 1; x++) {
		for (let y = -1; y <= 1; y++) {
			// check if these tiles are cached
			const tileName = 'Tile' + (tileCoords.x + x) + '/' + (tileCoords.y + y);
			tileNames.push(tileName);
			if (!activeTiles.hasOwnProperty(tileName)) {
				// this tile is not cached
				downloadOps.push(downloadData(tileCoords.x, tileCoords.y, tileCoords.zoom, x, y));
			}
		}
	}

	Q.all(downloadOps)
		.then((allData) => {
			const dataArr = [];

			deferred.resolve({
				data: allData,
				tile: tileCoords,
				bounds: bounds,
				visible: tileNames
			});
		});

	return deferred.promise;
}

export const distanceBetweenCoords = (first, second) => {
	// convert each set of coords to meters
	const firstMeters = Mercator.latLonToMeters(first[0], first[1]);
	const secondMeters = Mercator.latLonToMeters(second[0], second[1]);

	// calculate the straight line distance between the two
	const diffX = firstMeters[0] - secondMeters[0];
	const diffY = firstMeters[1] - secondMeters[1];

	return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
}
