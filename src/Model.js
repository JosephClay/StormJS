//###################################################################################
// Model ############################################################################
//###################################################################################

var Model = Storm.Model = (function() {

	var Model = function(data, options, collectionData) {
		Events.core.call(this);

		this._id = _uniqueId('Model');

		this.__data = {}; // The current model, __ === super secret!
		this.options = {};

		this.originalData = {}; // The state of the original data, saved to compare against
		this.previousData = {}; // The previous state of the model

		this.promises = {}; // Events (recorded by key as a promise)
		this.getters = {}; // The getters (recorded by key as a function)
		this.setters = {}; // The setters (recorded by key as a function)

		this._setup(data, options);
	};

	_extend(Model.prototype, Events.core.prototype, {
		constructor: Model,
		
		_setup: function(data, options) {
			// Make sure options and data are defined
			data = this._duplicate(data || {});
			var def = this.options.defaults || this.defaults;

			// Merge these so that it's only done once
			var mergedDefaultsAndData = _.extend({}, def, data);
			// These need to be separate objects from the merged data
			this.originalData = _.extend({}, mergedDefaultsAndData);
			this.previousData = _.extend({}, mergedDefaultsAndData);
			this.__data = _.extend({}, mergedDefaultsAndData);

			if (this.comparator) { this.comparator.bind(this); }
		},

		getId: function() { return this._id; },

		/* Getter | Setter ******************************************************************/
		getter: function(prop, f) {
			if (_.isFunction(f)) { this.getters[prop] = f; }
			return this;
		},
		setter: function(prop, f) {
			if (_.isFunction(f)) { this.setters[prop] = f; }
			return this;
		},

		/* Get | Set ******************************************************************/
		get: function() {
			var args = this._parseGetSetArguments(arguments);

			// If a getter is set, call the function to get the return value
			if (this.getters[args.prop]) {
				var result = this.getters[args.prop].call(null, this, this.__data[args.prop]);
				return result;
			}

			// Otherwise, return the value
			return this.__data[args.prop];
		},
		set: function() {
			var args = this._parseGetSetArguments(arguments);

			// If a setter is set, let the event call it
			if (this.setters[args.prop]) {
				args.data = this.setters[args.prop].call(null, this, args.data);

				this._change(args);
				return this;
			}

			// Otherwise, call the change ourselves with the prop/data
			this._change(args);
			return this;
		},
		_parseGetSetArguments: function(args) {
			// If prop is an object, then get the key, value
			// and options is actually where data is
			var prop = args[0];
			if (!_.isString(prop)) {
				var key, value;
				for (key in prop) { value = prop[key]; }

				return {
					prop: key,
					data: value,
					settings: args[1] || {}
				};
			}

			// Else, we accept a key and a value
			// and an options object
			return {
				prop: prop,
				data: args[1],
				settings: args[2] || {}
			};
		},

		/* Add | Remove ********************************************************************/
		add: function(prop, data, settings) {
			if (!_.isString(prop)) {
				var key;
				for (key in prop) {
					data = prop[key];
					prop = key;
					break;
				}
			}

			this._add(prop, data, settings);
		},
		remove: function(prop, settings) { this._remove(prop, settings); },

		/* Previous *****************************************************************/
		previous: function(prop) {
			return this.previousData[prop];
		},

		/* Has | Has Changed ********************************************************/
		has: function(prop) {
			return (prop in this.__data);
		},
		hasChanged: function(prop) {
			if (prop) { return (this.originalData[prop] === this.__data[prop]) ? false : true; }

			var key;
			for (key in this.__data) {
				if (this.hasChanged(key)) { return true; }
			}
			return false;
		},

		/* Keys | Values ************************************************************/
		keys: function() {
			var keys = [], key;
			for (key in this.__data) { keys.push(key); }
			return keys;
		},
		values: function() {
			var values = [], key;
			for (key in this.__data) { values.push(this.__data[key]); }
			return values;
		},

		/* Clone ********************************************************************/
		clone: function() {
			return new this.constructor(this.__data, this.options);
		},

		_duplicate: function(data) {
			return data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined;
		},

		/* Data Retrieval ***********************************************************/
		retrieve: function() {
			return this.__data;
		},

		/* Add | Remove | Change ***********************************************************/
		_backup: function() {
			// Previous data should not be a reference, but a separate object
			this.previousData = this._duplicate(this.__data);
			return this;
		},
		_add: function(prop, data, settings) {
			this._backup();

			this.__data[prop] = this._duplicate(data);

			if (this.previousData[prop] === this.__data[prop]) { return this; } // The data didn't actually change
			if (settings && settings.isSilent) { return this; } // Check if silent
			this.trigger(prop + '.add', data);
			this.trigger('model:add', prop, data);
		},
		_remove: function(prop, settings) {
			this._backup();

			delete this.__data[prop];

			if (this.previousData[prop] === undefined) { return this; } // The data didn't actually change
			if (settings && settings.isSilent) { return this; } // Check if silent
			this.trigger(prop + '.remove');
			this.trigger('model:remove', prop);
		},
		_change: function(config) {
			this._backup();

			var prop = config.prop,
				data = this._duplicate(config.data);

			this.__data[prop] = data;

			// Fire off a change events
			if (_.isEqual(this.previousData[prop], this.__data[prop])) { return this; } // The data didn't actually change
			if (config.settings.isSilent) { return this; } // Check if silent
			this.trigger(prop + '.change', prop, data);
			this.trigger('model:change', prop, data);
			this.trigger('change:' + prop, data);

			return this;
		},

		/* Comparator ***********************************************************/
		compareTo: function(comparisonModel) {
			if (!this.comparator || !comparisonModel) { return console.log('Storm: no Comparator set, returning'); }
			return this.comparator.getSortValue(this)
									.localeCompare(this.comparator.getSortValue(comparisonModel));
		},

		/* Validate ***********************************************************/
		_validate: function() {
			if (!this.validate) { return true; }
			var isValid = this.validate();
			if (!isValid) { this.trigger('model:invalid'); }
			return isValid;
		},

		toJSON: function() {
			return this.retrieve();
		},
		toString: function() {
			return JSON.stringify(this.retrieve());
		}
	});

	// Underscore methods that we want to implement on the Model.
	_.each(
		[ 'each', 'size', 'toArray', 'pluck' ]
	, function(method) {
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

	return Model;

}());