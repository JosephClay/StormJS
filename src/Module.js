// Module ###########################################################################

/**
 * A reusable module equipped with events
 * @class Module
 */
var Module = Storm.Module = function() {
	Events.core.call(this);
	
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId('Module');
};

_.extend(Module.prototype, Events.core.prototype, {
	/** @constructor */
	constructor: Module,

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString('Module', {
			id: this._id
		});
	}
});
