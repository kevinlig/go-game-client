export const showPreloadPage = () => {
	document.getElementById('game').innerHTML = '<div class="preloader-wrap"><div class="preloader">Loading...</div></div>';
}

export const hidePreloadPage = () => {
	document.getElementById('game').innerHTML = '';
}