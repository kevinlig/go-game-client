import THREE from 'three';

export default class GestureHandler {
	constructor(game) {
		this.game = game;

		this.boundCallbacks = {};
		this.didDrag = false;
		this.startX;
		this.startY;

		this.ignoreTouches = false;
	}

	bindGestures() {
		this.boundCallbacks.mouseUp = this.mouseUp.bind(this);
		this.boundCallbacks.mouseMove = this.mouseMove.bind(this);
		this.boundCallbacks.touchEnd = this.touchEnd.bind(this);
		this.boundCallbacks.touchMove = this.touchMove.bind(this);

		window.addEventListener('mousedown', this.mouseDown.bind(this), false);
		window.addEventListener('touchstart', this.touchStart.bind(this), false);
	}

	mouseDown(e) {

		if (this.ignoreTouches) {
			return;
		}

		// once a gesture has started, bind the end and move events
		this.didDrag = false;
		this.startX = e.clientX;
		this.startY = e.clientY;

		window.addEventListener('mouseup', this.boundCallbacks.mouseUp, false);
		window.addEventListener('mousemove', this.boundCallbacks.mouseMove, false);
		
	}
	touchStart(e) {

		if (this.ignoreTouches) {
			return;
		}
		
		// once a gesture has started, bind the end and move events
		this.didDrag = false;
		this.startX = e.touches[0].clientX;
		this.startY = e.touches[0].clientY;

		window.addEventListener('touchend', this.boundCallbacks.touchEnd, false);
		window.addEventListener('touchmove', this.boundCallbacks.touchMove, false);
	}

	mouseUp(e) {
		// gesture has ended, unbind the end and move events
		this.game.cameraManager.endRotation();

		if (!this.didDrag) {
			this.tapOccurred();
		}

		window.removeEventListener('mouseup', this.boundCallbacks.mouseUp, false);
		window.removeEventListener('mousemove', this.boundCallbacks.mouseMove, false);
	}
	touchEnd(e) {
		// gesture has ended, unbind the end and move events
		this.game.cameraManager.endRotation();

		if (!this.didDrag) {
			this.tapOccurred();
		}
		
		this.didDrag = false;

		window.removeEventListener('touchend', this.boundCallbacks.touchEnd, false);
		window.removeEventListener('touchmove', this.boundCallbacks.touchMove, false);
	}

	mouseMove(e) {
		e.preventDefault();

		
		const moveX = e.clientX - this.startX;
		// calculate the percentage of the window width that you have moved (then halve it so the max distance is 50%)
		let percentageX = (moveX * 0.5) / window.innerWidth;
		
		if (Math.abs(percentageX) > 0.001) {
			this.didDrag = true;
		}

		this.didDrag = false;

		// invert the rotation direction if the gesture occurred in the bottom half of the screen to prevent dragging against rotation
		if (this.startY > (window.innerHeight / 2)) {
			percentageX = percentageX * -1;
		}
		
		// pass this information along to the camera manager
		this.game.cameraManager.rotateCamera(percentageX);
		
	}
	touchMove(e) {
		e.preventDefault();

		const moveX = e.touches[0].clientX - this.startX;
		// calculate the percentage of the window width that you have moved (then halve it so the max distance is 50%)
		let percentageX = (moveX * 0.5) / window.innerWidth;
		if (Math.abs(percentageX) > 0.001) {
			this.didDrag = true;
		}

		// invert the rotation direction if the gesture occurred in the bottom half of the screen to prevent swiping against rotation
		if (this.startY > (window.innerHeight / 2)) {
			percentageX = percentageX * -1;
		}
		
		// pass this information along to the camera manager
		this.game.cameraManager.rotateCamera(percentageX);
	}

	tapOccurred() {
		const x = (this.startX / window.innerWidth ) * 2 - 1;
		const y = - (this.startY / window.innerHeight ) * 2 + 1;

		// ignore touches at the bottom 80px
		if (y < -1 + (160 / window.innerHeight)) {
			return;
		}

		// const ray = new THREE.Raycaster(this.game.camera.position, vector.sub(this.game.camera.position).normalize());
		const ray = new THREE.Raycaster();
		ray.setFromCamera(new THREE.Vector2(x, y), this.game.camera);

		const intersects = ray.intersectObjects(this.game.markerManager.itemList, true);
		if (intersects.length > 0) {
			// we found something
			const parent = intersects[0].object.parent;
			const itemId = parent.name;

			// get the item data from the marker manager
			const data = this.game.markerManager.itemData[itemId];
			this.game.app.clickedItem(data);
		}

	}
}