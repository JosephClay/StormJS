/* View =============================================================================
===================================================================================== */
var View = Storm.View = (function() {

	var View = function(opts) {
		Events.core.call(this);

		opts = opts || {};
		this._id = _uniqueId('View');
		this.elem = opts.elem || null;
		this.template = this.template || opts.template || '';
	};

	_extend(View.prototype, Events.core.prototype, {
		constructor: View,

		render: function() {},

		getElem: function() {
			return this.elem || (this.elem = this.render());
		},
		
		// Remove this view by taking the element out of the DOM, and removing any
		// applicable Storm.Events listeners.
		remove: function() {
			if (this.elem) { this.elem.remove(); }
			return this;
		},

		toString: function() {
			return '[Storm View]';
		}
	});

}());