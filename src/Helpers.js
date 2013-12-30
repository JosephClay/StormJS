// Helpers ##########################################################################

// Small polyfill for console
var console = console || {};
console.log = console.log || function() {};
console.error = console.error || console.log;

// Existance check
var _exists = function(value) {
	return (value !== null && value !== undefined);
};

var _stringFormat = (function() {

	var _REGEX = new RegExp('{([^}])+}', 'g');

	return function(str, fill) {
		return str.replace(_REGEX, function(capture, value) {
			return fill[value] || '';
		});
	};

}());