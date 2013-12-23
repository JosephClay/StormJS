/* Unique Id ========================================================================
===================================================================================== */
var _uniqIdentifier = 0,
	_scopedIdentifiers = {},
	/**
	 * Generate a unique id
	 * @param  {String}         prefix [optional] Defines a scope for the identifiers
	 * @return {Number||String} id
	 */
	_uniqId = Storm.uniqId = function(scope) {
		if (!_exists(scope)) { return _uniqIdentifier += 1; }

		return (_scopedIdentifiers[scope] || (_scopedIdentifiers[scope] = 0)) += 1;
	},
	_uniqIdStr = Storm.uniqIdStr = function(scope) {	
		return scope + '' + _uniqId(scope);
	};