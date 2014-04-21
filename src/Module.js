// Module ###########################################################################

/**
 * The name of the class
 * @const
 * @type {String}
 * @private
 */
var _MODULE = 'Module';

/**
 * A reusable module equipped with events
 * @class Storm.Module
 * @extends Storm.Events
 */
var Module = Storm.Module = function() {
	Events.call(this);

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_MODULE);
};

_.extend(Module.prototype, Events.prototype, /** @lends Storm.Module# */ {
	constructor: Module,
	
	/**
	 * Get the private id of the Module
	 * @return {Number} id
	 */
	getId: function() {
		return this._id;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_MODULE, {
			id: this._id
		});
	}
});
