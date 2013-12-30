// Collection #######################################################################

var Collection = Storm.Collection = (function(Model) {
	
	var Collection = function(data) {
		Events.core.call(this);
		
		data = data || {};

		this._id = _uniqId('Collection');
		this._models = [];

		this.add(data.models, { isSilent: true }, data);
	};

	_.extend(Collection.prototype, Events.core.prototype, {
		constructor: Collection,
		
		Model: Model,

		getId: function() {
			return this._id;
		},

		newModel: function(model, options, data) {
			return new this.Model(model, options, data);
		},

		getModels: function() {
			return this._models;
		},

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

		length: function() {
			return this._models.length;
		},

		at: function(idx) {
			return this._models[idx];
		},

		indexOf: function(model) {
			var id = model.getId(),
				models = this._models,
				idx = models.length;
			while (idx--) {
				if (models[idx].getId() === id) { return idx; }
			}
			return -1;
		},

		// Mass Set ------------------------------------------
		// To go with "get" below
		set: function(attr, value, models) {
			models = models || this._models;

			var idx = models.length;
			while (idx--) {
				models[idx].set(attr, value);
			}
		},

		// Add ------------------------------------------
		add: function(models, options, data) {
			models = _.isArray(models) ? models.slice() : [models];
			options = options || {};

			var idx = 0, length = models.length,
				model, obj,
				add = [],
				at = options.at;

			for (; idx < length; idx++) {
				obj = models[idx];
				model = models[idx];

				if (!model) { continue; }

				// If the model in not a Storm.Model, make it into one
				if (!(model instanceof Storm.Model)) {
					model = this.newModel(model, options, data);
				}

				// Check if the model is valid
				if (!model._validate()) {
					this.trigger('collection:invalid', model, models);
					return this;
				}

				// If the model is a duplicate prevent it from being added and
				// optionally merge it into the existing model.
				if (this.get(model)) {
					if (options.merge) {
						for (var key in obj) {
							model.set(key, obj[key], options);
						}
						model.trigger('collection:merge');
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
					this._models.push(add);
				}

				if (!options.skipSort) {
					this.sort({ isSilent: true });
				}
			}

			// Stop if silent
			if (options.isSilent) { return this; }

			var self = this;
			this.each(function(model, idx) {
				model.trigger('collection:add', self);
			});

			this.trigger('add', add, options);

			return this;
		},
		push: function(model, options) {
			options = _.extend({ at: this._models.length }, options);
			this.add(model, options);
			return model;
		},
		unshift: function(model, options) {
			options = _.extend({ at: 0 }, options);
			this.add(model, options);
			return model;
		},

		// Remove ------------------------------------------
		remove: function(models, options) {
			models = _.isArray(models) ? models.slice() : [models];
			options = options || {};

			var idx = 0, length = models.length,
				index, model;
			for (; idx < length; idx++) {
				model = this.get(models[idx]);
				if (!model) { continue; }

				this._models.splice(this.indexOf(model), 1);
				if (!options.isSilent) {
					model.trigger('collection:remove', this);
				}
			}

			if (options.isSilent) { return this; }
			this.trigger('remove', models, options);
			return this;
		},
		shift: function(options) {
			var model = this.at(0);
			this.remove(model, options);
			return model;
		},
		pop: function(options) {
			var model = this.at(this.length - 1);
			this.remove(model, options);
			return model;
		},
		slice: function(begin, end) {
			return this._models.slice(begin, end);
		},

		// Sort ------------------------------------------
		// Force the collection to re-sort itself. You don't need to call this under
		// normal circumstances, as the set will maintain sort order as items
		// are added.
		sort: function(opts) {
			opts = opts || {};

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

		// Get ------------------------------------------
		get: function(model) {
			return this._models[this.indexOf(model)];
		},
		where: function(attrs) {
			if (_.isEmpty(attrs)) { return []; }
			return this.filter(function(model) {
				for (var key in attrs) {
					if (attrs[key] !== model.get(key)) { return false; }
				}
				return true;
			});
		},
		pluck: function(attr) {
			return _.invoke(this._models, 'get', attr);
		},
		getModelById: function(id) {
			var models = this._models,
				idx = (models.length - 1);
			for (; idx >= 0; idx--) {
				if (models[idx].getId() === id) {
					return models[idx];
				}
			}
			return null;
		},

		// Reset | Clone ------------------------------------------
		reset: function(opts) {
			opts = opts || {};
			this._models.length = 0;
			if (!opts.isSilent) {
				this.trigger('reset');
			}
			return this;
		},
		clone: function() {
			return new this.constructor({ model: this.model, models: this._models });
		},

		// Data Retrieval ------------------------------------------
		retrieve: function() { // To match model.retrieve()
			return _.map(this._models, function(model) {
				return model.retrieve();
			});
		},

		toJSON: function() {
			return this.retrieve();
		},

		toString: function() {
			return '['+ Storm.name +' Collection]';
		}
	});

	// Underscore methods that we want to implement on the Collection.
	_.each([
		'each',
		'map',
		'reduce',
		'reduceRight',
		'find',
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
		'size',
		'first',
		'initial',
		'rest',
		'last',
		'without',
		'indexOf',
		'shuffle',
		'lastIndexOf',
		'isEmpty'
	], function(method) {
		Collection.prototype[method] = function() {
			var args = _.toArray(arguments);

			// Add this Collection's models as the first
			// argument
			args.unshift(this._models);

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

	return Collection;

}(Model));