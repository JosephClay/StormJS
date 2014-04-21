/*global window */
/*global document */
(function(window, document) {

	if (!('onhashchange' in window)) { return; }

	var _menu = document.getElementById('Menu');
	if (!_menu) { return; }

	var _handleChange = function() {
		var anchorHash = document.location.hash.substr(1),
			prevMatch = _menu.getElementsByClassName('active')[0],
			match = _menu.querySelectorAll('a[href="#'+ anchorHash +'"]')[0];
		
		if (prevMatch) {
			prevMatch.className = (prevMatch.className || '').replace(' active', '');
		}

		if (match) {
			match.className += ' active';
		}
	};

	window.onhashchange = _handleChange;
	_handleChange();

}(window, document));
