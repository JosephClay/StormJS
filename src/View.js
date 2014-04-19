// View #############################################################################

/**
 * The name of this class
 * @const
 * @type {String}
 * @private
 */
var _VIEW = 'View';

/**
 * A view at its most basic. Sets up a couple
 * defaults for cloning and commonly used methods
 * @class Storm.View
 * @extends Storm.Events
 * @param {Object} [opts]
 */
var View = Storm.View = function(opts) {
	Events.call(this);

	opts = opts || {};

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_VIEW);

	/** @type {Object} */
	this.options = opts || {};

	/** @type {Element} */
	this.elem = opts.elem || null;

	/** @type {String} */
	this.template = this.template || opts.template || '';
};

_.extend(View.prototype, Events.prototype, /** @lends Storm.View# */ {
	constructor: View,

	/**
	 * Get the private id of the view
	 * @return {Number} id
	 */
	getId: function() { return this._id; },

	/**
	 * Returns a clone of the view
	 * @return {Storm.View}
	 */
	clone: function() {
		return new this.constructor(this.options);
	},

	/**
	 * Generates the HTML markup for the view.
	 * Must be overridden by subclasses.
	 * @function
	 * @return {String} HTML markup.
	 */
	render: _noop,

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
		return _toString(_VIEW, {
			id: this._id
		});
	}
});
