//###################################################################################
// Cache ############################################################################
//###################################################################################

var Cache = Storm.Cache = (function() {

	var Cache = function() {
		this._id = _uniqId('Cache');
		this._cache = {};
		this._timeouts = {};
	};

	Cache.prototype = {
		constructor: Cache,

		store: function(key, data, opts) {
			opts = opts || {};

			if (!_.isString(key)) {
				opts = data;
				data = key;
				var prop;
				for (prop in data) {
					this._store(prop, data[prop], opts);
				}
			}

			this._store(key, data, opts);

			return this;
		},

		get: function(key) {
			return this._cache[key];
		},

		remove: function(key) {
			this._clearExpiration(key);
			delete this._cache[key];
			return this;
		},

		flush: function() {
			this._clearExpirations();
			this._cache = {};
			return this;
		},

		/* Private ******/
		_store: function(key, data, opts) {
			// Expiration
			if (_exists(opts.expiration)) {
				if (!_.isNumber(opts.expiration)) { return console.error(STORM.name +': Cannot set expiration. Value is not a number: ', opts.expiration); }
				this._setExpiration(key, opts.expiration);
			}
			// Entend
			if (opts.extend) {
				if (!_.isObject(this._cache[key])) { return console.error(STORM.name +': Cannot extend store value. Value is not an object: ', opts.extend); }
				data = _.extend(this._cache[key], data);
			}

			this._cache[key] = data;
		},

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

		_clearExpirations: function() {
			var key;
			for (key in this._timeouts) {
				this._clearExpiration(key);
			}
		},

		_clearExpiration: function(key) {
			clearTimeout(this._timeouts[key]);
			delete this._timeouts[key];
		},
		
		toJSON: function(key) {
			var value = (key) ? this.get(key) : this._cache;
			return value;
		},

		toString: function(key) {
			return '['+ STORM.name +' Cache]';
		}
	};

	return Cache;

}());

Storm.cache = new Cache();