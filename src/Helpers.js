/* Helper Methods ===================================================================
===================================================================================== */
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

/**
 * Object merger, could use _.extend (and indeed, _.extend is
 * used a lot) but the iterator is much slower than a native for
 * loop, increasing initialization time.
 * @return {Object}
 */
var _extend = function() {
	var args = arguments,
		base = args[0],
		idx = 1, length = args.length,
		key, merger;
	for (; idx < length; idx++) {
		merger = args[idx];
		
		for (key in merger) {
			base[key] = merger[key];
		}
	}

	return base;
};