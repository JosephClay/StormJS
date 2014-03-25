// Collection #######################################################################

/**
 * The name of the class
 * @const
 * @type {String}
 * @private
 */
var _COLLECTION = 'Collection';

var _getModelId = function(model) {
	return (model instanceof Storm.Model) ? model.getId() : parseInt(model, 10) || -1;
};

/**
 * A collection of Models
 * @param {Object} [data]
 * @class Storm.Collection
 * @extends Storm.Events
 */
var Collection = Storm.Collection = function(data) {
	Events.call(this);
	data = data || {};

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_COLLECTION);

	/**
	 * Storage for the models
	 * @type {Array.<Model>}
	 * @private
	 */
	this._models = [];

	this.add(data.models, _.extend({ isSilent: true }, data));
};

_.extend(Collection.prototype, Events.prototype, /** @lends Storm.Collection.prototype */ {
	constructor: Collection,

	/** @type {Storm.Model} */
	Model: Model,

	/**
	 * Get the private id of the Collection
	 * @return {Id} id
	 */
	getId: function() {
		return this._id;
	},

	/**
	 * Create a new model
	 * @param  {Object} model the model data
	 * @param  {Object} [opts]
	 * @return {Storm.Model}
	 */
	newModel: function(model, opts) {
		return new this.Model(model, opts);
	},

	/**
	 * Get all models
	 * @return {Array.<Model>}
	 */
	getModels: function() {
		return this._models;
	},

	/**
	 * Get a model by key-value
	 * @param  {String} key
	 * @param  {*} value
	 * @return {Storm.Model}
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
	 * Clear all of the models from the collection
	 * @return {Storm.Collection}
	 */
	clear: function() {
		var models = this._models,
			idx = models.length;
		while (idx--) {
			models[idx].trigger('destroy');
		}
		this._models.length = 0;
		return this;
	},

	/**
	 * Overwrites the private _models array
	 * with a new array of models
	 * @param  {Array.<Storm.Model>} models
	 * @return {Array.<Storm.Model>}
	 */
	overwrite: function(models) {
		return (this._models = models);
	},

	/**
	 * Retrieve a model at the provided index
	 * @param  {Number} idx
	 * @return {Storm.Model}
	 */
	at: function(idx) {
		return this._models[idx];
	},

	/**
	 * Get the index of a model
	 * @param  {Storm.Model|Id} model
	 * @return {Number} index
	 */
	indexOf: function(model) {
		var id = _getModelId(model),
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
	 * @param {Array.<Model>} models
	 * @param {Object} [opts]
	 * @param {Object} data additional data to pass to the new models
	 */
	add: function(models, opts) {
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
				model = this.newModel(model, opts);
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
				var i = 0, len = add.length;
				for (; i < len; i++) {
					this._models.splice(at + i, 0, add[i]);
				}
			} else {
				this._models = this._models.concat(add);

				// Only sort if we're not adding the models
				// at a specific point
				this.sort(opts);
			}
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
	 * @param  {Storm.Model} model
	 * @param  {Object} opts will be passed to remove
	 * @return {Storm.Model} the removed model
	 */
	push: function(model, opts) {
		opts = _.extend({ at: this._models.length }, opts);
		this.add(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Storm.Model} model
	 * @param  {Object} opts will be passed to remove
	 * @return {Storm.Model} the removed model
	 */
	unshift: function(model, opts) {
		opts = _.extend({ at: 0 }, opts);
		this.add(model, opts);
		return model;
	},

	/**
	 * Remove a model from the collection
	 * @param  {Model|Model[]} models
	 * @param  {Object} [opts]
	 * @return {Storm.Collection}
	 */
	remove: function(models, opts) {
		models = _.isArray(models) ? models.slice() : [models];
		opts = opts || {};

		var idx = models.length, model;
		while (idx--) {
			model = models[idx];
			model = (model instanceof Storm.Model) ? model : this.get(model);
			if (!model) { continue; }

			var index = this.indexOf(model);
			if (index === -1) { continue; }

			this._models.splice(index, 1);
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
	 * @return {Storm.Model} the removed model
	 */
	shift: function(opts) {
		var model = this.at(0);
		this.remove(model, opts);
		return model;
	},

	/**
	 * As you would expect
	 * @param  {Object} opts will be passed to remove
	 * @return {Storm.Model} the removed model
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
	 * @return {Array.<Storm.Model>}
	 */
	slice: function(begin, end) {
		return this._models.slice(begin, end);
	},

	/**
	 * Force the collection to re-sort itself. You don't need to call this under
	 * normal circumstances, as the collection will maintain sort order as items
	 * are added.
	 * @param  {Object} [opts]
	 * @return {Storm.Collection}
	 */
	sort: function(opts) {
		opts = opts || {};

		if (opts.skipSort || // Skipping sort
			!this.length() || // Nothing to sort
			!this.at(0).comparator) { // Models not sortable
			return this;
		}

		Collection.arraySort.call(this._models, function(a, b) {
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
	 * @param  {Object} values Hash containing key-value pairs
	 * @param  {Boolean} [first] return first found
	 * @return {Model|Array.<Model>}
	 */
	where: function(values, first) {
		if (_.isEmpty(values)) { return first ? undefined : []; }

		var method = this[first ? 'find' : 'filter'];
		return method.call(this, function(model) {
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
	 * @return {Storm.Model}
	 */
	findWhere: function(values) {
		return this.where(values, true);
	},

	/**
	 * Find a model by id
	 * @param  {Id} id model _id
	 * @return {Storm.Model}
	 */
	findById: function(id) {
		if (!_exists(id)) { return null; }
		id = (id > -1) === false ? parseInt(id, 10) : id; // make sure id is a number

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
	 * @return {Array.<*>}
	 */
	pluck: function(key) {
		return _.invoke(this._models, 'get', key);
	},

	/**
	 * Gets a model by its id
	 * @param  {Id} id
	 * @return {Storm.Model}
	 */
	getById: function(id) {
		if (!_exists(id)) { return null; }
		id = parseInt(id, 10); // make sure id is a number

		var models = this._models,
			idx = models.length;
		while (idx--) {
			if (models[idx].getId() === id) {
				return models[idx];
			}
		}
		return null;
	},
	/**
	 * Proxy for getById
	 * @alias {#getById}
	 */
	get: function(modelOrId) {
		var id = modelOrId instanceof Storm.Model ? modelOrId.getId() : modelOrId;
		return this.getById(id);
	},

	/**
	 * Drops all models from the collection
	 * @param  {Object} [opts]
	 * @return {Storm.Collection}
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
	 * @return {Storm.Model}
	 */
	clone: function() {
		return new this.constructor({ model: this.model, models: this._models });
	},

	/**
	 * Similar to Model.retrieve, returns all model data
	 * in the collection
	 * @return {Array.<Object>}
	 */
	retrieve: function() { // To match model.retrieve()
		return _.map(this._models, function(model) {
			return model.retrieve();
		});
	},

	/**
	 * Return the data to serialize to JSON
	 * @return {Array.<Object>}
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

/** @type {Function} */
Collection.arraySort = Array.prototype.sort;

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
