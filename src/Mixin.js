// Mixin ############################################################################

/**
 * Mix a key-value into Storm, protecting Storm from
 * having a pre-existing key overwritten. Of course,
 * items can be directly assigned to Storm via Storm.foo = foo;
 * but in this framework, I'm considering it a bad practice
 * @param  {String} name
 * @param  {*} prop
 * @private
 */
var _mixin = function(name, prop) {
	if (Storm[name] !== undefined) { return console.error(_errorMessage('mixin', 'Cannot mixin. "'+ name +'" already exists: '), name, Storm[name], prop); }
	Storm[name] = prop;
};

/**
 * Protect Storm from mixins that would overwrite pre-existing keys.
 * @param  {String|Object} name Name of the object
 * @param  {Object}         prop The object to mixin
 */
Storm.mixin = function(name, prop) {
	// Mix single
	if (_.isString(name)) {
		return _mixin(name, prop);
	}

	// Mix multiple
	var key;
	for (key in name) {
		_mixin(key, name[key]);
	}
};
