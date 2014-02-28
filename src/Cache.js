// Cache ############################################################################

/**
 * The name of the class
 * @const
 * @type {String}
 * @private
 */
var _CACHE = 'Cache';

/**
 * An in-memory key-value store
 * @class Storm.Cache
 */
var Cache = Storm.Cache = function() {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_CACHE);

	/**
	 * Holds the private cache
	 * @type {Object}
	 * @private
	 */
	this._cache = {};

	/**
	 * Holds timeouts used to expire the cache
	 * @type {Object}
	 * @private
	 */
	this._timeouts = {};
};

Cache.prototype = {
	/** @constructor */
	constructor: Cache,

	/**
	 * Stores data in the cache
	 * @param  {String|Object} key
	 * @param  {*} data
	 * @param  {Object} [opts]
	 * @return {Storm.Cache}
	 */
	store: function(key, data, opts) {
		opts = opts || {};

		if (!_.isString(key)) {
			opts = data;
			data = key;
			var prop;
			for (prop in data) {
				this._store(prop, data[prop], opts);
			}
			return this;
		}

		this._store(key, data, opts);

		return this;
	},

	/**
	 * Gets an item from cache or an array
	 * of values
	 * @param  {String|String[]} key
	 * @return {*|Array.<*>}
	 */
	get: function(key) {
		if (_.isArray(key)) {
			// Reuse the array passed, replacing
			// each index with the value retrieved
			// from the cache.
			var idx = key.length;
			while (idx--) {
				key[idx] = this._cache[key[idx]];
			}
			return key;
		}

		return this._cache[key];
	},

	/**
	 * Remove an item from cache or multiple
	 * items if an array is passed
	 * @param  {String|String[]} keys
	 * @return {Storm.Cache}
	 */
	remove: function(keys) {
		keys = _.isArray(keys) ? keys : [keys];

		var idx = keys.length;
		while (idx--) {
			this._clearExpiration(keys[idx]);
			delete this._cache[keys[idx]];
		}

		return this;
	},

	/**
	 * Resets the cache, emptying the cache
	 * and clearing any expirations
	 * @return {Storm.Cache}
	 */
	flush: function() {
		this._clearExpirations();
		this._cache = {};
		return this;
	},

	/**
	 * Stores data in the cache
	 * @param  {String} key
	 * @param  {*} data
	 * @param  {Object} [opts]
	 * @private
	 */
	_store: function(key, data, opts) {
		opts = opts || {};

		// Expiration
		if (_exists(opts.expiration)) {
			this._setExpiration(key, opts.expiration);
		}

		// Extend
		if (opts.extend) {
			data = _.extend(this._cache[key], data);
		}

		this._cache[key] = data;
	},

	/**
	 * Sets a key in the cache to expire
	 * after a set duration by storing a
	 * timeout
	 * @param {String} key
	 * @param {Number} duration
	 * @private
	 */
	_setExpiration: function(key, duration) {
		if (this._timeouts[key]) {
			clearTimeout(this._timeouts[key]);
		}

		var self = this;
		this._timeouts[key] = setTimeout(function() {

			delete self._cache[key];
			delete self._timeouts[key];

		}, _.isNaN(duration) ? 0 : duration);
	},

	/**
	 * Clears all expirations
	 * @private
	 */
	_clearExpirations: function() {
		var key;
		for (key in this._timeouts) {
			this._clearExpiration(key);
		}
	},

	/**
	 * Clears a specific expiration
	 * @param  {String} key
	 * @private
	 */
	_clearExpiration: function(key) {
		clearTimeout(this._timeouts[key]);
		delete this._timeouts[key];
	},

	/**
	 * Gets the value (or entire cache) to
	 * serialize to JSON
	 * @param  {String} [key]
	 * @return {*}
	 */
	toJSON: function(key) {
		var value = (key) ? this.get(key) : this._cache;
		return value;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function(key) {
		return _toString(_CACHE, {
			id: this._id,
			size: _.size(this._cache)
		});
	}
};

// Underscore methods that we want to implement on the Cache.
_.each([
	'keys',
	'values',
	'pairs',
	'functions',
	'pick',
	'omit',
	'tap',
	'has',
	'isEqual',
	'isEmpty',
	'each'
], function(method) {
	Cache.prototype[method] = function() {
		var args = _.toArray(arguments);

		// Add this Model's data as the first
		// argument
		args.unshift(this._cache);

		// the method is the underscore methods with
		// an underscore context and the arguments with
		// the models first
		return _[method].apply(_, args);
	};
});

/**
 * Expose a default cache to use in the application
 * @type {Storm.Cache}
 */
Storm.cache = new Cache();
