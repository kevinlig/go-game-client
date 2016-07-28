import AppManager from './core/appManager.js';
import Firebase from 'firebase';
import Config from './bakedConfig.js';

// set up Firebase
Firebase.initializeApp(Config.firebase);


const app = AppManager;
app.loadApp();