// View #############################################################################

/**
 * A view at its most basic. Sets up a couple
 * defaults for cloning and commonly used methods
 * @param {Object} opts [optional]
 */
var View = Storm.View = function(opts) {
	Events.core.call(this);

	this.options = opts || {};
	this._id = _uniqId('View');
	this.elem = this.options.elem || null;
	this.template = this.template || this.options.template || '';
};

_.extend(View.prototype, Events.core.prototype, {
	constructor: View,

	clone: function() {
		return new this.constructor(this.options);
	},

	render: function() {
		return Storm.$();
	},

	getElem: function() {
		return this.elem || (this.elem = this.render());
	},

	toString: function() {
		return '['+ Storm.name +' View, id: '+ this._id +']';
	}
});