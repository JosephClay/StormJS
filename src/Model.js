// Model ############################################################################

/**
 * The name of the class
 * @const
 * @type {String}
 * @private
 */
var _MODEL = 'Model';

/**
 * The base data object for the application. Stores
 * and protects a piece of data and gives an interface
 * to follow and manipulate the data. Works in conjunction
 * with a Collection to organize data into sets
 *
 * @class Storm.Model
 * @extends Storm.Events
 *
 * @param {Object} data Key-value pairs.
 * @param {Object} [opts]
 */
var Model = Storm.Model = function(data, opts) {
	Events.call(this);

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_MODEL);

	/**
	 * Hold on to the passed options both for
	 * reference inside the model and for cloning
	 * @type {Object}
	 */
	this.options = opts;

	/**
	 * getters (recorded by key as a function)
	 * @type {Object}
	 */
	this._getters = {};

	/**
	 * setters (recorded by key as a function)
	 * @type {Object}
	 */
	this._setters = {};

	// Merge the data and the defaults
	data = _.extend({}, this.defaults, data);

	/**
	 * Protect the data, __ === secret... gentleman's agreement
	 * @type {Object}
	 */
	this.__data = this._duplicate(data);

	/**
	 * Create duplicate of the original data to
	 * compare against for checks and allow restoration.
	 * Make sure these are protected as well
	 * @type {Object}
	 */
	this.__originalData = this.__previousData = this._duplicate(data);

	/**
	 * If there's a Comparator, then bind it to this model
	 * @type {Storm.Comparator}
	 */
	if (this.comparator) { this.comparator.bind(this); }
};

_.extend(Model.prototype, Events.prototype, /** @lends Storm.Model.prototype */ {
	constructor: Model,

	/**
	 * If not supporting complex data types (default), the model
	 * creates a reference-free version of the data to keep the
	 * data from being contaminated.
	 *
	 * If supporting complex data types, non-primitive values
	 * will be maintained in the model data, but exposes the
	 * possibility of contaminating the data object by outside
	 * sources
	 *
	 * @type {Boolean}
	 * @default false
	 */
	supportComplexDataTypes: false,

	/**
	 * The defaults to be merged into the
	 * data object when constructed
	 * @type {Object}
	 */
	defaults: {},

	/**
	 * Get the private id of the Model
	 * @return {Number} id
	 */
	getId: function() { return this._id; },

	/**
	 * Restores the data of the model back to the
	 * original value
	 * @param  {Object} opts
	 * @return {Storm.Model}
	 */
	restore: function(opts) {
		// Set the current data back to the original data
		this.__data = this._duplicate(this.__originalData);
		// Check if silent
		if (opts && !opts.isSilent) { return this; }

		// Let every property know that it has
		// been changed and fire a restore event
		var prop;
		for (prop in this.__data) {
			this.trigger('change:' + prop, this.__data[prop]);
			this.trigger('model:change', prop, this.__data[prop]);
		}
		this.trigger('model:restore');

		return this;
	},

	/**
	 * Adds a getter for the property
	 * @param  {String}   prop
	 * @param  {Function} func <code>{*} function({*} value)</code>
	 * @return {Storm.Model}
	 */
	getter: function(prop, func) {
		if (!_.isFunction(func)) { return console.error(_errorMessage(_MODEL, 'Getter must be a function.', prop, func)); }
		if (this._getters[prop]) { return console.error(_errorMessage(_MODEL, 'Getter is already defined', prop, func)); }
		this._getters[prop] = func;
		return this;
	},

	/**
	 * Adds a setter for the property
	 * @param  {String}   prop
	 * @param  {Function} func <code>{*} function({*} value)</code>
	 * @return {Storm.Model}
	 */
	setter: function(prop, func) {
		if (!_.isFunction(func)) { return console.error(_errorMessage(_MODEL, 'Setter must be a function', prop, func)); }
		if (this._setters[prop]) { return console.error(_errorMessage(_MODEL, 'Setter is already defined', prop, func)); }
		this._setters[prop] = func;
		return this;
	},

	/**
	 * Get a value from the Model, passing it through the getter
	 * method if one exists. An array can be passed to get multiple
	 * values or a string to get a single value
	 * @param  {String|Array.<String>} prop
	 * @return {*|Array.<*>}
	 */
	get: function(prop) {
		if (_.isArray(prop)) {
			// Reuse the array passed, replacing
			// each index with the value retrieved
			// from the model.
			var idx = prop.length;
			while (idx--) {
				prop[idx] = this._get(prop[idx]);
			}
			return prop;
		}

		return this._get(prop);
	},

	/**
	 * Private version of get. Gets single values
	 * @param {String} prop
	 * @return {*}
	 * @private
	 */
	_get: function(prop) {
		// If a getter is set, call the function to get the return value
		if (this._getters[prop]) {
			return this._getters[prop].call(null, this.__data[prop]);
		}

		// Otherwise, return the value
		return this.__data[prop];
	},

	/**
	 * Sets the value of a property in the Model. Values can be set
	 * in key-value pairs in an object, or as string + value as
	 * separate parameters
	 * @param {String|Object} prop
	 * @param {*} data
	 * @param {Object} opts
	 * @return {Storm.Model}
	 */
	set: function(prop, data, opts) {
		// If prop is not a string (is an object), then set
		// each key in the object to the value
		if (!_.isString(prop)) {
			var key;
			for (key in prop) {
				this._set(key, prop[key], opts);
			}
			return this;
		}

		// Otherwise, set the value
		this._set(prop, data, opts);
		return this;
	},

	/**
	 * Private version of set. Sets single values
	 * @param {String} prop
	 * @param {*}  data
	 * @param {Object} [opts]
	 * @private
	 */
	_set: function(prop, data, opts) {
		// If a setter is set
		if (this._setters[prop]) {
			data = this._setters[prop].call(null, data);
		}

		this._change(prop, data, opts);
	},

	/**
	 * Adds properties/values to the model data. Only works to add
	 * additional data to the model data, it will not modify any
	 * pre-existing data. An object can be passed to set multiple
	 * key-values or a string and value as separate parameters
	 * @param {String|Object} prop
	 * @param {*} data
	 * @param {Object} [opts]
	 * @return {Storm.Model}
	 */
	add: function(prop, data, opts) {
		// If the prop is not a string (is an object)
		// then add multiple key-values in one pass
		if (!_.isString(prop)) {
			var key;
			for (key in prop) {
				this._add(key, prop[key], opts);
			}
			return this;
		}

		this._add(prop, data, opts);
		return this;
	},

	/**
	 * Removes properties from the model data. Only works to remove
	 * data the pre-exists in the data. No remove event will be fired
	 * if the property has an undefined value. An array can be passed
	 * to remove multiple properties or a string as a single parameter
	 * @param {String|Array.<String>} prop
	 * @param {Object} [opts]
	 * @return {Storm.Model}
	 */
	remove: function(prop, opts) {
		if (_.isArray(prop)) {
			var idx = prop.length;
			while (idx--) {
				this._remove(prop[idx], opts);
			}
			return this;
		}

		this._remove(prop, opts);
	},

	/**
	 * Returns the previous value for the property
	 * @param  {String} prop
	 * @return {*}
	 */
	previous: function(prop) {
		return this.__previousData[prop];
	},

	/**
	 * Checks if the model data has the provided property
	 * @param  {String}  prop
	 * @return {Boolean}
	 */
	has: function(prop) {
		return _exists(prop) ? (prop in this.__data) : false;
	},

	/**
	 * Checks if the model data has changed from the original data.
	 * If a prop is passed, then it will check if that property's value
	 * has changed and not the entire model data
	 * @param  {String}  [prop]
	 * @return {Boolean}
	 */
	hasChanged: function(prop) {
		if (_exists(prop)) {
			return (this.__originalData[prop] === this.__data[prop]) ? false : true;
		}

		var key;
		for (key in this.__data) {
			if (this.hasChanged(key)) { return true; }
		}
		return false;
	},

	/**
	 * Returns a clone of the model
	 * @return {Storm.Model}
	 */
	clone: function() {
		return new this.constructor(this._duplicate(this.__data), this.options);
	},

	/**
	 * If not supporting complex data types (default), _duplicate
	 * creates a reference-free version of the data passed
	 * using native JSON.parse and JSON.stringify.
	 *
	 * If supporting complex data types, underscore's _.clone
	 * method is used, which will not create a reference-free
	 * version of complex data types, which may lead to pollution
	 * of the data, but will allow non-primitive values
	 *
	 * @param  {*} data
	 * @return {*}
	 * @private
	 */
	_duplicate: function(data) {
		// Keep null/undefined from being passed to JSON
		// or needlessly cloned as both are primitives
		if (!_exists(data)) { return data; }

		return this.supportComplexDataTypes ? _.clone(data) : JSON.parse(JSON.stringify(data));
	},

	/**
	 * Retrieve the model data
	 * @return {Object}
	 */
	retrieve: function() {
		return this.__data;
	},

	/**
	 * Duplicates the current model data and assigns it
	 * to previous data
	 * @private
	 */
	_backup: function() {
		// Previous data should not be a reference, but a separate object
		this.__previousData = this._duplicate(this.__data);
	},

	/**
	 * Adds a new property and data to the model data
	 * @param {String} prop
	 * @param {*} data
	 * @param {Object} [opts]
	 * @private
	 */
	_add: function(prop, data, opts) {
		this._backup();
		if (this.__previousData[prop] !== undefined) { return; } // This data isn't actually an addition

		this.__data[prop] = this._duplicate(data);

		if (this.__previousData[prop] === this.__data[prop]) { return; } // The data didn't actually change
		if (opts && opts.isSilent) { return; } // Check if silent
		this.trigger('add:' + prop, data);
		this.trigger('model:add', prop, data);
	},

	/**
	 * Removes a property from the model data
	 * @param {String} prop
	 * @param {Object} [opts]
	 * @private
	 */
	_remove: function(prop, opts) {
		this._backup();
		if (this.__previousData[prop] === undefined) { return; } // The property is not present

		var data = this.__data[prop];
		delete this.__data[prop];

		if (opts && opts.isSilent) { return; } // Check if silent
		this.trigger('remove:' + prop, data);
		this.trigger('model:remove', prop, data);
	},

	/**
	 * Changes a value on the model data
	 * @param  {String} prop
	 * @param  {*} data
	 * @param  {Object} [opts]
	 * @private
	 */
	_change: function(prop, data, opts) {
		this._backup();

		this.__data[prop] = this._duplicate(data);

		// Fire off change events
		if (_.isEqual(this.__previousData[prop], this.__data[prop])) { return; } // The data didn't actually change
		if (!this._validate()) { return (this.__data = this._duplicate(this.__previousData)); } // If invalid, revert changes
		if (opts && opts.isSilent) { return; } // Check if silent
		this.trigger('change:' + prop, data);
		this.trigger('model:change', prop, data);
	},

	/**
	 * Compares this model to another. Used by Collection for
	 * sorting. Checks for Storm.Comparator to use natively but
	 * can be overwritten
	 * @param  {Storm.Model} comparisonModel
	 * @return {Number} sort order (1, 0, -1)
	 */
	compareTo: function(comparisonModel) {
		if (!this.comparator || !comparisonModel || !comparisonModel.comparator) { return 0; }
		return this.comparator.getSortValue(this)
								.localeCompare(this.comparator.getSortValue(comparisonModel));
	},

	/**
	 * Validates the model when a value is changed via
	 * .set(). Looks for a .validate() method on the model.
	 * @return {Boolean}
	 * @default true
	 * @private
	 */
	_validate: function() {
		if (!this.validate) { return true; }
		var isValid = !!this.validate();
		if (!isValid) { this.trigger('model:invalid'); }
		return isValid;
	},

	/**
	 * Returns the data for serialization
	 * @return {Object}
	 */
	toJSON: function() {
		return this.__data;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_MODEL, {
			id: this._id
		});
	}
});

// Underscore methods that we want to implement on the Model.
_.each([
	'each',
	'isEqual',
	'isEmpty',
	'size',
	'keys',
	'values',
	'pairs',
	'invert',
	'pick',
	'omit'
], function(method) {
	Model.prototype[method] = function() {
		var args = _.toArray(arguments);

		// Add this Model's data as the first argument
		args.unshift(this.__data);

		// the method is the underscore methods with
		// an underscore context and the arguments with
		// the models first
		return _[method].apply(_, args);
	};
});
