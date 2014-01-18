var memo = Storm.memo = function(getter) {
	var secret;
	return function() {
		return secret || (secret = getter.call());
	};
};