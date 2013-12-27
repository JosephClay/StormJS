//###################################################################################
// Comparator #######################################################################
//###################################################################################

/**
 * Used by the Collection to sort Models. Having
 * a separate object used by the model normalizes
 * sorting and allows optimization by caching values
 * (especially when dealing with string comparions)
 */
var Comparator = Storm.Comparator = (function() {
	
	var _SORT = {
			alphabetical: 0,
			numeric: 1,
			date: 2
		};

	var Comparator = function(key, type) {
		this._key = key;
		this._type = type || _SORT.alphabetical;
		this._store = {};
	};

	Comparator.HOISTING_STR = '___';
	Comparator.SORT = _SORT;

	Comparator.prototype = {
		constructor: Comparator,
		
		/**
		 * Bind to the key on the model that the comparator
		 * watches. If the key changes, invalidate the sort
		 * value so that it's recalculated
		 * @param  {Storm.Model} model
		 */
		bind: function(model) {
			var self = this;
			model.on(this._key + '.change', function() {
				self.invalidateSortValue(model);
			});
		},

		/**
		 * Invalidates the sort value of a model
		 * by deleting it from the store
		 * @param  {Storm.Model} model
		 * @return {this}
		 */
		invalidateSortValue: function(model) {
			delete this.store[model.getId()];
			return this;
		},

		/**
		 * Get the value to sort by
		 * @param  {Storm.model}  model
		 * @return {value}
		 */
		getSortValue: function(model) {
			var id = model.getId(),
				value;
			if (this._store[id]) { return this._store[id]; }

			if (this._type === _SORT.date) { // Date

				value = this.dateValue(model);

			} else if (this._type === _SORT.numeric) { // Number

				value = this.numericValue(model);

			} else { // String by default

				value = this.alphabeticalValue(model);

			}

			this._store[id] = value;
			return value;
		},

		alphabeticalValue: function(model) {
			var value = model.get(this._key) || '';
			value = (value ? value.toLocaleLowerCase() : Comparator.HOISTING_STR);
			return value;
		},
		numericValue: function(model) {
			var value = model.get(this._key) || 0;
			value = +value;
			return value;
		},
		dateValue: function(model) {
			var value = model.get(this._key) || new Date();
			value = _.isDate(value) ? value : new Date(value);
			return value;
		},

		toString: function() {
			return '['+ STORM.name +' Comparator]';
		}
	};

	return Comparator;

}());