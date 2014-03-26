// Comparator #######################################################################

	/**
	 * The name of the class
	 * @const
	 * @type {String}
	 * @private
	 */
var _COMPARATOR = 'Comparator',
	/**
	 * Stores sort types to use to compare models
	 * Default is alphabetical (0)
	 * @readonly
	 * @enum {Number}
	 * @default alphabetical
	 */
	_SORT = {
		alphabetical: 0,
		numeric: 1,
		date: 2
	},

	/**
	 * Reverse look-up for _SORT
	 * @type {Object}
	 */
	_SORT_NAMES = _.invert(_SORT),

	/**
	 * Add a sort type to the _SORT object
	 * @param {String} type
	 */
	_addSort = function(type) {
		// The type has already been defined
		if (type in _SORT) { return; }

		// Using _.size ensures a unique id
		// for the type passed
		_SORT[type] = _.size(_SORT);
	},

	/**
	 * Caching of the sort value by model id
	 * @type {Object}
	 */
	_store = {};

/**
 * Used by the Collection to sort Models. Having
 * a separate object used by the model normalizes
 * sorting and allows optimization by caching values
 * @class Storm.Comparator
 * @param {String} key the key on the model used for comparison
 * @param {Storm.Comparator.SORT} [type]
 */
var Comparator = Storm.Comparator = function(key, type) {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_COMPARATOR);

	/**
	 * The model key to use to sort
	 * @type {String}
	 * @private
	 */
	this._key = key;

	/**
	 * The type of sorting we'll be doing
	 * @type {Storm.Comparator.SORT}
	 * @default alphabetical
	 * @private
	 */
	this._type = type || _SORT.alphabetical;
};

_.extend(Comparator, /** @lends Storm.Comparator# */ {

	/**
	 * Default string to use if no value is present to
	 * compare against.
	 * @type {String}
	 */
	HOISTING_STR: '___',

	/**
	 * Expose _SORT as its values are needed
	 * in order to setup specific Comparators
	 * @readonly
	 * @enum {Number}
	 * @default alphabetical
	 */
	SORT: _SORT,

	/**
	 * Add a sort type to the Comparator
	 * as a global option
	 * @param {String|Array.<String>} type
	 */
	addSort: function(type) {
		// If is an array, add multiple types
		if (_.isArray(type)) {
			var idx = 0, length = type.length;
			for (; idx < length; idx++) {
				_addSort(type[idx]);
			}
		} else {
			_addSort(type);
		}

		// Refresh the sort names after addition
		_SORT_NAMES = _.invert(_SORT);
	}
});

Comparator.prototype = {
	constructor: Comparator,

	/**
	 * Bind to the key on the model that the comparator
	 * watches. If the key changes, invalidate the sort
	 * value so that it's recalculated
	 * @param  {Storm.Model} model
	 */
	bind: function(model) {
		model.on('change:' + this._key, _.bind(this.invalidateSortValue, this, model));
	},

	/**
	 * Invalidates the sort value of a model
	 * by deleting it from the store
	 * @param  {Storm.Model} model
	 * @return {Storm.Comparator}
	 */
	invalidateSortValue: function(model) {
		delete this.store[model.getId()];
		return this;
	},

	/**
	 * Get the value to sort by
	 * @param  {Storm.model}  model
	 * @return {*}
	 */
	getSortValue: function(model) {
		var id = model.getId();
		if (_store[id]) { return _store[id]; }

		if (!this[_SORT_NAMES[this._type]]) { return console.error(_errorMessage('Comparator', 'No method for the sort type assigned'), this._type, _SORT_NAMES[this._type]); }
		var value = this[_SORT_NAMES[this._type]].call(this, model);

		_store[id] = value;
		return value;
	},

	/**
	 * Default alphabetical sort.
	 * This method gets the value from the model
	 * and ensures a string return value
	 * @param  {Storm.Model}  model
	 * @return {String} value
	 */
	alphabetical: function(model) {
		var value = model.get(this._key);
		value = _.exists(value) ? (value + '').toLocaleLowerCase() : Comparator.HOISTING_STR;
		return value;
	},

	/**
	 * Default numeric sort.
	 * This method gets the value from the model
	 * and ensures a number return value
	 * @param  {Storm.Model}  model
	 * @return {Number} value
	 */
	numeric: function(model) {
		var value = model.get(this._key) || 0;
		value = +value;
		return value;
	},

	/**
	 * Default date sort.
	 * This method gets the value from the model
	 * and ensures a date return value
	 * @param  {Storm.Model}  model
	 * @return {Date}   value
	 */
	date: function(model) {
		var value = model.get(this._key) || new Date();
		value = _.isDate(value) ? value : new Date(value);
		return value;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_COMPARATOR, {
			id: this._id,
			key: this._key,
			type: _SORT_NAMES[this._type]
		});
	}
};
