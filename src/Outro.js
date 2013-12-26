	
	// Expose Storm as an AMD module
	if (typeof define !== 'undefined' && define.amd) {
		define('Storm', [], function() {
			return Storm;
		});
	}

}(this, _));