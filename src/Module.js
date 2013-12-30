// Module ###########################################################################

var Module = Storm.Module = (function() {

	var Module = function() {
		Events.core.call(this);
		this._id = _uniqId('Module');
	};

	_.extend(Module.prototype, Events.core.prototype, {
		constructor: Module,

		toString: function() {
			return '['+ Storm.name +' Module]';
		}
	});

	return Module;

}());