/**
 * Memoizes the return value.
 * @param {Function} getter
 * @returns {Function} Function that returns whatever {@code getter} returns.
 * @lends Storm
 */
var memo = Storm.memo = function(getter) {
	var secret;
	return function() {
		return secret || (secret = getter.call());
	};
};
