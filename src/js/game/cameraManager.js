import THREE from 'three';

export default class CameraManager {
	constructor(game, gestureHandler) {
		this.game = game;

		this.currentPosition = game.camera.position;
		this.currentRotation = 0;
		this.tempRotation;

		this.rotationListener;

		this.cameraDistance = Math.sqrt(Math.pow(game.camera.position.x, 2) + Math.pow(game.camera.position.y, 2));
	}

	degreesToRadians(degrees) {
		return degrees * (Math.PI / 180);
	}

	radiansToDegrees(radians) {
		return radians * (180 / Math.PI);
	}

	rotateCamera(percentage) {

		// calculate the new rotation within the bounds of 0 to 360 degrees
		this.tempRotation = (this.currentRotation + (percentage * 360)) % 360;
		if (this.tempRotation < 0) {
			this.tempRotation = 360 + this.tempRotation;
		}
		
		// handle the fact that Y will always be positive
		let rotationSide = 1;
		if (this.tempRotation <= 90 || this.tempRotation > 270) {
			rotationSide = -1;
		}

		// calculate the x and y values for this rotation
		const radians = this.degreesToRadians(this.tempRotation);
		const x = Math.sin(radians) * this.cameraDistance;
		const y = Math.sqrt(Math.pow(this.cameraDistance, 2) - Math.pow(x, 2)) * rotationSide;

		this.positionCamera(x, y);
		
		// update rotation listener
		if (this.rotationListener) {
			this.rotationListener(this.tempRotation);
		}
	}

	endRotation() {
		this.currentRotation = this.tempRotation;
	}

	positionCamera(x, y) {
		const camera = this.game.camera;
		const scene = this.game.scene;

		// offset the camera around the map's focus point
		const center = this.game.centerPoint;

		camera.position.x = x + center.x;
		camera.position.y = y + center.y;
		camera.up = new THREE.Vector3(0,0,1);

		const gameCenter = new THREE.Vector3(center.x, center.y, 0);
		camera.lookAt(gameCenter);
	}

	registerForRotationChanges(target) {
		this.rotationListener = target;
	}

	unregisterForRotationChanges() {
		this.rotationListener = null;
	}
}