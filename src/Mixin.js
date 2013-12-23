/* Mixin ============================================================================
===================================================================================== */
var _mixin = function(name, prop) {
	if (Storm[name] !== undefined) { return console.error(STORM.name +': Cannot mixin, '+ name +' already exists: ', Storm[name]); }
	Storm[name] = prop;
};
/**
 * Protect Storm from mixins that would overwrite pre-existing keys.
 * @param  {String||Object} name Name of the object
 * @param  {Object}         prop The object to mixin
 */
Storm.mixin = function(name, prop) {
	// Mix single
	if (_.isString(name)) {
		_mixin(name, prop);
	}

	// Mix multiple
	var key;
	for (key in name) {
		_mixin(key, name[key]);
	}
};
