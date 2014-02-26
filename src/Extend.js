// Extend ###########################################################################

/**
 * Prototypical class extension
 * From: https://github.com/JosephClay/Extend.git
 * @param {Function} [constructor]
 * @param {Object}   [extension]
 */
var Extend = Storm.Extend = function(constructor, extension) {
	var hasConstructor = (typeof constructor === 'function');
	if (!hasConstructor) { extension = constructor; }

	var self = this,
		fn = function() {
			var ret = self.apply(this, arguments);
			if (hasConstructor) {
				ret = constructor.apply(this, arguments);
			}
			return ret;
		};

	// Add properties to the object
	_.extend(fn, this);

	// Duplicate the prototype
	var NoOp = function() {};
	NoOp.prototype = this.prototype;
	fn.prototype = new NoOp();

	// Merge the prototypes
	_.extend(fn.prototype, this.prototype, extension);
	fn.prototype.constructor = constructor || fn;

	return fn;
};
