// Unique Id ########################################################################

	/**
	 * Generate a unique id
	 * @param  {String}         prefix [optional] Defines a scope for the identifiers
	 * @return {Number||String} id
	 * @private
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
	 * Generates a unqiue id string - prefixed with the scope
	 * @param  {String} scope
	 * @return {String} id
	 * @private
	 */
	_uniqIdStr = Storm.uniqIdStr = function(scope) {	
		return (scope || 'id') + '' + _uniqId(scope);
	};