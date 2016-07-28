import * as LoadingPage from './loadingPage.js';
import Firebase from 'firebase';
import Q from 'q';

import UserManager from './user/userManager.js';

let MapHelper;

class AppManager {
	constructor() {

		this.appState = 'preload';
		this.game;
		this.ui;

		this.userManager = new UserManager();
		this.battleManager;

		this.timer;
		this.foregroundState = true;

		this.subscribers = [];
	}

	subscribe(subscriber) {
		this.subscribers.push(subscriber);
	}

	notify(data) {
		this.subscribers.forEach((subscriber) => {
			subscriber(data);
		});
	}

	loadApp() {
		// show a loading screen if the app hasn't loaded in 300ms
		this.timer = window.setTimeout(() => {
			LoadingPage.showPreloadPage();
		}, 300);

		// async load the React UI layer
		require.ensure(['../ui/UIManager.jsx'], (require) => {
			const UI = require('../ui/UIManager.jsx');

			// setup the React elements
			this.ui = UI.installUI();
			this.ui.subscribeToApp();

			this.appReady();
		});
	}

	appReady() {
		this.appState = 'ready';
		window.clearTimeout(this.timer);
		LoadingPage.hidePreloadPage();

		// determine whether or not the user needs to login or register
		this.prepareFirebase()
			.then(() => {
				// start watching for foreground state changes
				window.setInterval(() => {
					// foreground state changed
					if (window.document.hasFocus() != this.foregroundState) {
						this.foregroundState = window.document.hasFocus();
						// document is in foreground
						if (this.foregroundState == true) {
							this.appFocused();
						}
					}
				}, 1000);
				return this.userManager.getUserState();
			})
			.then((state) => {
				if (state == 'loggedin') {
					// the user is already logged in, go to the game
					this.loadGame();
				}
				else if (state == 'register') {
					// user is logged into Google, but doesn't have a game account
					// the user needs to register
					this.ui.showRegistrationPage();
				}
				else {
					// user is not logged in, go to signin page
					this.appState = 'signin';
					this.ui.showSignInPage();
				}
			})
	}

	prepareFirebase() {
		const deferred = Q.defer();

		// make a dummy DB call to wait for Firebase to initialize
		const db = Firebase.database();
		db.ref('dummy')
		.once('value', (snapshot) => {
			deferred.resolve();
		});

		return deferred.promise;
	}

	appFocused() {
		// app returned to the foreground from a background state
		// user is logged in, restore
		this.userManager.setOnline();
	}

	loadGame() {
		this.appState = 'loading';

		

		// show a splash screen
		this.ui.splashScreen();

		// async load the ThreeJS layer
		require.ensure(['../game/game.js', './battle/battleManager.js', '../game/helpers/mapHelper.js'], (require) => {
			const Game = require('../game/game.js').default;
			this.game = new Game(window.innerWidth, window.innerHeight);
			
			MapHelper = require('../game/helpers/mapHelper.js');

			// start the battle manager
			const BattleManager = require('./battle/battleManager.js').default;
			this.battleManager = new BattleManager(this);

			this.startGame();
		});
	}

	startGame() {
		this.game.init('game');
		this.startLocationUpdates();
		this.battleManager.watchForChallenges();
	}

	startLocationUpdates() {

		const locationOptions = {
			enableHighAccuracy: true,
			maximumAge: 0
		};

		window.navigator.geolocation.getCurrentPosition((pos) => {
			this.game.loadMap(pos.coords.latitude, pos.coords.longitude);

		}, (err) => {
			let message = 'An error occurred while retrieving your location.';
			if (err.code == 1) {
				message = 'This game requires your location in order to run.';
			}
			else if (err.code == 2) {
				message = 'Your location could not be determined.';
			}

			this.ui.fullScreenError(message);

		}, locationOptions);

	}

	mapDidUpdate(lat, lon) {
		if (this.appState == 'loading') {
			// hide the loading screen, we are ready to go
			this.appState = 'game';
			this.ui.showGameUI();

			const locationOptions = {
				enableHighAccuracy: true,
				maximumAge: 0
			};

			// also start watching the location for updates
			window.navigator.geolocation.watchPosition((pos) => {
				this.game.loadMap(parseFloat(pos.coords.latitude), parseFloat(pos.coords.longitude));
			}, null, locationOptions);
		}
	}

	clickedItem(item) {
		// determine distance from item
		const distance = Math.round(MapHelper.distanceBetweenCoords([this.game.center.lat, this.game.center.lon], [item.lat, item.lon]));
		
		// you can only collect within 75m
		if (distance <= 75) {
			this.ui.showItemScreen(item);
		}
		else {
			// too far
			const meters = distance - 75;
			// always round feet up to account for meters being already rounded
			const feet = Math.ceil(meters * 3.281);
			window.alert("This item is too far for you to collect. Move " + feet + " ft closer.");
		}
	}
}

// make the app manager a singleton
const instance = new AppManager();
export default instance;