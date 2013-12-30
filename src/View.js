// View #############################################################################

/**
 * A view at its most basic. Sets up a couple
 * defaults for cloning and commonly used methods
 * @class View
 * @param {Object} opts [optional]
 */
var View = Storm.View = function(opts) {
	Events.core.call(this);

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId('View');
	
	/** @type {Object} */
	this.options = opts || {};
	
	/** @type {Element} */
	this.elem = opts.elem || null;

	/** @type {String} id */
	this.template = this.template || opts.template || '';
};

_.extend(View.prototype, Events.core.prototype, {
	/** @constructor */
	constructor: View,
	
	/**
	 * Returns a clone of the view
	 * @return {View}
	 */
	clone: function() {
		return new this.constructor(this.options);
	},

	/**
	 * Here to be overwritten
	 */
	render: function() {},

	/**
	 * Returns the cached elem or caches and returns
	 * an elem using render
	 * @return {Element}
	 */
	getElem: function() {
		return this.elem || (this.elem = this.render());
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString('View', {
			id: this._id
		});
	}
});