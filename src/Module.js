//###################################################################################
// Module ###########################################################################
//###################################################################################

var Module = Storm.Module = (function() {

	var Module = function() {
		Events.core.call(this);
		this._id = _uniqId('Module');
	};

	_extend(Module.prototype, Events.core.prototype, {
		constructor: Module,

		toString: function() {
			return '['+ STORM.name +' Module]';
		}
	});

	return Module;

}());