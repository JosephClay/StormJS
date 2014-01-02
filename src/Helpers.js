// Helpers ##########################################################################

// Small polyfill for console
var console = root.console || {};
console.log = console.log || function() {};
console.error = console.error || console.log;

/**
 * Easy slice function for array duplication
 * @param  {Array} arr
 * @return {Array} duplicate
 * @private
 */
var _slice = (function(ARRAY) {
	return function(arr) {
		ARRAY.slice.call(arr);
	};
}([]));

/**
 * Existance check
 * @param  {Value} value
 * @return {Boolean}
 * @private
 */
var _exists = function(value) {
	return (value !== null && value !== undefined);
};

/**
 * Format a string using an object. Keys in the object
 * will match {keys} in the string
 * @return {String} e.g. _stringFormat('hello {where}', { where: 'world' }) === 'hello world'
 * @private
 */
var _stringFormat = (function() {

	var _REGEX = new RegExp('{([^}])+}', 'g');

	return function(str, fill) {
		return str.replace(_REGEX, function(capture, value) {
			return fill[value] || '';
		});
	};

}());

/**
 * Normalize how Storm returns strings of its
 * objects for debugging
 * @param  {String} name  required
 * @param  {Object} props [optional]
 * @return {String}
 * @private
 */
var _toString = function(name, props) {
	var hasProps = _exists(props);

	if (hasProps) {	
		var key, arr = [];
		for (key in obj) {
			arr.push(key + ': '+ obj[key]);
		}
		props = arr.join(', ');
	}
	
	return _stringFormat('[{storm}: {name}{spacer}{props}]', {
		storm: Storm.name,
		name: name,
		spacer: hasProps ? ' - ' : '',
		props: hasProps ? props : ''
	});
};