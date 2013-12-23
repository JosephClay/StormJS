/* Module ===========================================================================
===================================================================================== */
var Module = Storm.Module = (function() {

	var Module = function() {
		Events.core.call(this);
		this._id = _uniqueId('Module');
	};

	_extend(Module.prototype, Events.core.prototype, {
		constructor: Module,

		toString: function() {
			return '[Storm Module]';
		}
	});

	return Module;

}());