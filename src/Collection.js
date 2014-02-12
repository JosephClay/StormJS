// Collection #######################################################################

/**
 * The name of the class
 * @type {String}
 */
var _COLLECTION = 'Collection';

/**
 * A collection of Models
 * @param {Object} data [optional]
 * @class Collection
 */
var Collection = Storm.Collection = function(data) {
	Events.core.call(this);
	data = data || {};

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_COLLECTION);
	
	/**
	 * Storage for the models
	 * @type {Array[Model]}
	 * @private
	 */
	this._models = [];

	this.add(data.models, data, { isSilent: true });
};

_.extend(Collection.prototype, Events.core.prototype, {
	/** @constructor */
	constructor: Collection,

	/** @type {Model} */
	Model: Model,

	/**
	 * Get the private id of the Collection
	 * @return {Number} id
	 */
	getId: function() {
		return this._id;
	},

	/**
	 * Create a new model
	 * @param  {Object} model the model data
	 * @param  {Object} opts [optional]
	 * @param  {Object} data additional data to pass to the new models
	 * @return {Model}
	 */
	newModel: function(model, opts, data) {
		return new this.Model(model, opts, data);
	},

	/**
	 * Get all models
	 * @return {Array}
	 */
	getModels: function() {
		return this._models;
	},

	/**
	 * Get a model by key-value
	 * @param  {String} key
	 * @param  {Value} value
	 * @return {Model}
	 */
	getBy: function(key, value) {
		var models = this._models,
			idx = models.length;
		while (idx--) {
			if (models[idx].get(key) === value) {
				return models[idx];
			}
		}
		return null;
	},

	/**
	 * Return the length of the models,
	 * same as getModels().length
	 * @return {Number} length
	 */
	length: function() {
		return this._models.length;
	},

	/**
	 * Retrieve a model at the provided index
	 * @param  {Number} idx
	 * @return {Model}
	 */
	at: function(idx) {
		return this._models[idx];
	},

	/**
	 * Get the index of a model
	 * @param  {Model} model
	 * @return {Number} index
	 */
	indexOf: function(model) {
		var id = model.getId(),
			models = this._models,
			idx = models.length;
		while (idx--) {
			if (models[idx].getId() === id) { return idx; }
		}
		return -1;
	},

	/**
	 * Add models to the collection, creating new models
	 * if the model is not an instance of Storm.Model,
	 * sorting the models and firing events
	 * @param {Array[Model]} models
	 * @param {Object} opts [optional]
	 * @param {Object} data additional data to pass to the new models
	 */
	add: function(models, data, opts) {
		models = _.isArray(models) ? models.slice() : [models];
		opts = opts || {};

		var idx = 0, length = models.length,
			model,
			add = [],
			at = opts.at;

		for (; idx < length; idx++) {
			model = models[idx];

			if (!model) { continue; }

			// If the model is not a Storm.Model, make it into one
			if (!(model instanceof Storm.Model)) {
				model = this.newModel(model, opts, data);
			}

			// Check if the model is valid
			if (!model._validate()) {
				if (!opts.isSilent) {
					this.trigger('collection:invalid', model, models);
				}
				continue;
			}

			// If the model is a duplicate prevent it from being added and
			// optionally merge it into the existing model.
			if (this.get(model.getId())) {
				if (opts.merge) {
					var key,
						obj = models[idx];
					for (key in obj) {
						model.set(key, obj[key], opts);
					}
					if (!opts.isSilent) {
						model.trigger('collection:merge');
					}
				}
				continue;
			}

			// This is a new model, push it to the add list
			add.push(model);
		}

		// Add the new models
		if (add.length) {
			if (_exists(at)) {
				this._models.splice(([at, 0]).concat(add));
			} else {
				this._models = this._models.concat(add);
			}

			this.sort(opts);
		}

		// Stop if silent
		if (opts.isSilent) { return this; }

		var self = this;
		_.each(add, function(model, idx) {
			model.trigger('collection:add', self);
		});

		this.trigger('add', add, opts);

		return this;
	},
	/** Proxy for add */
	set: function() { this.add.apply(this, arguments); },

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove 
	 * @return {Model} the removed model
	 */
	push: function(model, opts) {
		opts = _.extend({ at: this._models.length }, opts);
		this.add(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove 
	 * @return {Model} the removed model
	 */
	unshift: function(model, opts) {
		opts = _.extend({ at: 0 }, opts);
		this.add(model, opts);
		return model;
	},

	/**
	 * Remove a model from the collection
	 * @param  {Model || Array[Model]} models
	 * @param  {Object} opts   [optional]
	 * @return {Collection}
	 */
	remove: function(models, opts) {
		models = _.isArray(models) ? models.slice() : [models];
		opts = opts || {};

		var idx = 0, length = models.length,
			index, model;
		for (; idx < length; idx++) {
			model = this.get(models[idx]);
			if (!model) { continue; }

			this._models.splice(idx, 1);
			if (!opts.isSilent) {
				model.trigger('collection:remove', this);
			}
		}

		if (opts.isSilent) { return this; }
		this.trigger('remove', models, opts);
		return this;
	},

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove 
	 * @return {Model} the removed model
	 */
	shift: function(opts) {
		var model = this.at(0);
		this.remove(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove 
	 * @return {Model} the removed model
	 */
	pop: function(opts) {
		var model = this.at(this.length - 1);
		this.remove(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Number} begin
	 * @param  {Number} end
	 * @return {Array}
	 */
	slice: function(begin, end) {
		return this._models.slice(begin, end);
	},

	/**
	 * Force the collection to re-sort itself. You don't need to call this under
	 * normal circumstances, as the collection will maintain sort order as items
	 * are added.
	 * @param  {Objet} opts [optional]
	 * @return {Collection}
	 */
	sort: function(opts) {
		opts = opts || {};

		if (opts.skipSort || // Skipping sort
			!this.length() || // Nothing to sort
			!this.at(0).comparator) { // Models not sortable
			return this;
		}

		this._models.sort(function(a, b) {
			return a.compareTo(b);
		});
		
		if (!opts.silent) {
			var self = this;
			this.each(function(model, idx) {
				model.trigger('collection:sort', self, idx);
			});
			this.trigger('sort', this, opts);
		}

		return this;
	},

	/**
	 * Get models matching the key-values passed
	 * @param  {Object} values
	 * @param  {Boolean} first [optional] return first found
	 * @return {Model || Array}
	 */
	where: function(values, first) {
		if (_.isEmpty(values)) { return first ? undefined : []; }

		var method = this[first ? 'find' : 'filter'];
		return method(function(model) {
			var key;
			for (key in values) {
				if (values[key] !== model.get(key)) { return false; }
			}
			return true;
		});
	},

	/**
	 * Proxy for where(values, true)
	 * @param  {Object} values
	 * @return {Model}
	 */
	findWhere: function(values) {
		return this.where(values, true);
	},

	/**
	 * Find a model by id
	 * @param  {Number} id model _id
	 * @return {Model}
	 */
	findById: function(id) {
		id = !(id > -1) ? parseInt(id, 10) : id; // make sure id is a number

		var models = this.getModels(),
			idx = models.length,
			model;
		while (idx--) {
			model = models[idx];
			if (model && model.getId() === id) {
				return model;
			}
		}
		return null;
	},
	
	/**
	 * Get all model values of the provided key
	 * @param  {String} key
	 * @return {Array[Value]}
	 */
	pluck: function(key) {
		return _.invoke(this._models, 'get', key);
	},

	/**
	 * Gets a model by its id
	 * @param  {Number} id
	 * @return {Model}
	 */
	getById: function(id) {
		if (!_exists(id)) { return null; }

		var models = this._models,
			idx = models.length;
		while (idx--) {
			if (models[idx].getId() === id) {
				return models[idx];
			}
		}
		return null;
	},
	/** Proxy for getById */
	get: function() { return this.getById.apply(this, arguments); },

	/**
	 * Drops all models from the collection
	 * @param  {Object} opts [optional]
	 * @return {Collection}
	 */
	reset: function(opts) {
		opts = opts || {};
		this._models.length = 0;
		if (!opts.isSilent) {
			this.trigger('reset');
		}
		return this;
	},
	
	/**
	 * Returns a clone of the collection
	 * @return {Model}
	 */
	clone: function() {
		return new this.constructor({ model: this.model, models: this._models });
	},

	/**
	 * Similar to Model.retrieve, returns all model data
	 * in the collection
	 * @return {Array[Object]}
	 */
	retrieve: function() { // To match model.retrieve()
		return _.map(this._models, function(model) {
			return model.retrieve();
		});
	},

	/**
	 * Return the data to serialize to JSON
	 * @return {Array[Object]}
	 */
	toJSON: function() {
		return this.retrieve();
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_COLLECTION, {
			id: this._id,
			length: this.length()
		});
	}
});

// Underscore methods that we want to implement on the Collection.
_.each([
	'forEach',
	'each',
	'map',
	'collect',
	'reduce',
	'foldl',
	'inject',
	'reduceRight',
	'foldr',
	'find',
	'detect',
	'filter',
	'select',
	'reject',
	'every',
	'all',
	'some',
	'any',
	'include',
	'contains',
	'invoke',
	'max',
	'min',
	'toArray',
	'size',
	'first',
	'head',
	'take',
	'initial',
	'rest',
	'tail',
	'drop',
	'last',
	'without',
	'difference',
	'indexOf',
	'shuffle',
	'lastIndexOf',
	'isEmpty',
	'chain'
], function(method) {
	Collection.prototype[method] = function() {
		var args = _.toArray(arguments);

		// Add this Collection's models as the first
		// argument
		args.unshift(_slice(this._models));

		// the method is the underscore methods with
		// an underscore context and the arguments with
		// the models first
		return _[method].apply(_, args);
	};
});

// Underscore methods that take a property name as an argument.
_.each([
	'groupBy',
	'countBy',
	'sortBy'
], function(method) {
	Collection.prototype[method] = function(value, context) {
		var iterator = _.isFunction(value) ? value : function(model) {
			return model.get(value);
		};
		return _[method](this._models, iterator, context);
	};
});