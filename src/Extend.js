/* Extend ===========================================================================
===================================================================================== */
// https://github.com/JosephClay/Extend.git
/**
 * Prototypical class extension
 * @param {Function} constructor   optional
 * @param {Object}   extension     optional
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
	_extend(fn, this);

	// Duplicate the prototype
	var NoOp = function() {};
	NoOp.prototype = this.prototype;
	fn.prototype = new NoOp();

	// Merge the prototypes
	_extend(fn.prototype, this.prototype, extension);
	fn.prototype.constructor = constructor || fn;

	return fn;
};