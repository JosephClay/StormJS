/**
 * Memoizes a return value.
 * @function Storm.memo
 * @param {Function} getter
 * @return {Function} Function that returns whatever <code>getter</code> returns.
 */
var memo = Storm.memo = function(getter) {
	var secret;
	return function() {
		return secret || (secret = getter.call());
	};
};
