	/* Extension ========================================================================
	===================================================================================== */
	App.create = Events.extend = Cache.extend = DataContext.extend = Model.extend = Collection.extend = Comparator.extend = View.extend = Module.extend = = Extend;

	/* NoConflict =======================================================================
	===================================================================================== */
	/**
	 * Return the "Storm" global to its previous assignment
	 * and return Storm back to caller.
	 * @return {Storm}
	 */
	Storm.noConflict = function() {
		root.Storm = previousStorm;
		return this;
	};

	// Expose Storm as an AMD module
	if (typeof define !== 'undefined' && define.amd) {
		define('Storm', [], function() {
			return Storm;
		});
	}

}(this, _));