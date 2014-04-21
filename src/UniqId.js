// Unique Id ########################################################################

/**
 * @typedef {Number} Id
 */

	/**
	 * Generates an ID number that is unique within the context of the current {@link Storm} instance.
	 * The internal counter does not persist between page loads.
	 * @function Storm.uniqId
	 * @param  {String} [prefix] Defines an optional scope (i.e., namespace) for the identifiers.
	 * @return {Id} Unique ID number.
	 */
var _uniqId = Storm.uniqId = (function() {

		var _scopedIdentifiers = {};

		return function(scope) {
			scope = scope || '';
			var inc = (_scopedIdentifiers[scope] || 0) + 1;
			return (_scopedIdentifiers[scope] = inc);
		};

	}()),
	/**
	 * Generates an ID number prefixed with the given string that is unique within the context of the current {@link Storm} instance.
	 * The internal counter does not persist between page loads.
	 * @function Storm.uniqIdStr
	 * @param  {String} prefix String to prepend the generated ID number with.  Also used to scope (namespace) the unique ID number.
	 * @return {String} Unique ID number prefixed with the given string.
	 * @private
	 */
	_uniqIdStr = function(prefix) {
		return (prefix || 'id') + '' + _uniqId(prefix);
	};
