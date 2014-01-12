// Storage ##########################################################################

	/**
	 * The name of this class
	 * @type {String}
	 */
var _STORAGE = 'Storage',
	/**
	 * The storage type: local or session
	 * @type {Object}
	 */
	_STORAGE_TYPE = {
		cookie: 0,
		localStorage: 1,
		sessionStorage: 2
	};

/**
 * Based off of Remy's polyfill: https://gist.github.com/remy/350433
 * 
 * Adapted to use the same Storage object for both
 * local and session storage (for simplicity)
 * @class Storage
 * @param {TYPE} type
 * @param {Object} opts [optional]
 */
var Storage = Storm.Storage = function(type, opts) {
	opts = opts || {};

	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_STORAGE);

	/**
	 * The type of storage
	 * @default STORAGE_TYPE.cookie
	 * @type {STORAGE_TYPE}
	 */
	this.type = type || _STORAGE_TYPE.cookie;

	var storageTypeName = _.invert(_STORAGE_TYPE);

	/**
	 * The name of the store.
	 * @type {String}
	 */
	this.name = opts.name || storageTypeName[this.type];
	
	/**
	 * The type of storage we're using
	 * @type {String} localStorage || sessionStorage
	 */
	this.storage = root[storageTypeName[this.type]];
	
	/**
	 * Whether we have access to native local/session storage
	 * @type {Boolean}
	 */
	this.hasStorage = _exists(this.storage);
	
	/**
	 * The data stored
	 * @type {Object}
	 */
	this.data = this._getData();

	/**
	 * The storage length
	 * @type {Number}
	 */
	this.length = (this.hasStorage) ? this.storage.length : _.size(this.data);
};

Storage.TYPE = _STORAGE_TYPE;

Storage.prototype = {
	/** @constructor */
	constructor: Storage,
	
	/**
	 * Clear all data from storage
	 * @return {Storage}
	 */
	clear: function() {
		this.data = {};
		this.length = 0;

		if (this.hasStorage) {
			this.storage.clear();
			return this;
		}

		this._clearCookieData();
		return this;
	},

	/**
	 * Get a key at the specified index
	 * @param  {Number} idx
	 * @return {String} key
	 */
	key: function(idx) {
		if (this.hasStorage) {
			return this.storage.key(idx);
		}

		// not perfect, but works
		var key, index = 0;
		for (key in this.data) {
			if (index === idx)  {
				return k;
			} else {
				index++;
			}
		}
		return null;
	},

	/**
	 * Retrieve item from data
	 * @param  {String || Array} key
	 * @return {Value}
	 */
	getItem: function(key) {
		// Array is passed, get all values under
		// the keys
		if (_.isArray(key)) {
			var idx = key.length;
			while (idx--) {
				key[idx] = this.getItem(key[idx]);
			}
			return key;
		}

		if (this.hasStorage) {
			var storedValue = this.storage.getItem(key);
			if (!_exists(storedValue)) { return storedValue; }
			return JSON.parse(storedValue);
		}

		return this.data[key];
	},
	/** Proxy for getItem */
	get: function() { return this.getItem.apply(this, arguments); },

	/**
	 * Adds to data
	 * @param {String || Object} key
	 * @param {Value} value
	 */
	setItem: function(key, value) {
		// Not a string, must be an object,
		// multiple items are being set
		if (!_.isString(key)) {
			var k;
			for (k in key) {
				this.setItem(k, key[k]);
			}
			return;
		}

		if (this.hasStorage) {
			var storage = this.storage.setItem(key, JSON.stringify(value));
			this.length = this.storage.length;
			return storage;
		}

		this.data[key] = value;
		this.length++;
		this._setCookieData();
	},
	/** Proxy for setItem */
	store: function() { this.setItem.apply(this, arguments); },
	/** Proxy for setItem */
	set: function() { this.setItem.apply(this, arguments); },

	removeItem: function(key) {
		if (this.hasStorage) {
			var storage = this.storage.removeItem(key);
			this.length = this.storage.length;
			return storage;
		}

		delete this.data[key];
		this.length--;
		this._setCookieData();
	},
	remove: function(key) {
		this.removeItem(key);
		return this;
	},

	/**
	 * Create a cookie of the data
	 * @private
	 */
	_createCookie: function(value) {
		var days = (this.type === Storage.TYPE.session) ? 0 : 365,
			date = new Date(),
			expires;

		if (days > 0) {
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = date.toGMTString();
		} else {
			expires = '0';
		}

		document.cookie = _stringFormat('{name}={value}; expires={expiration}; path=/', {
			name: this.name,
			value: value,
			expiration: expires
		});
	},

	/**
	 * Return data from the cookie
	 * @return {Value}
	 * @private
	 */
	_readCookie: function() {
		var nameEq = this.name + '=',
			ca = document.cookie.split(';'),
			idx = 0, length = ca.length, c;

		for (; idx < length; idx++) {
			c = ca[idx];
			while (c.charAt(0) === ' ') {
				c = c.substring(1, c.length);
			}

			if (c.indexOf(nameEq) === 0) {
				return c.substring(nameEq.length, c.length);
			}
		}
		return null;
	},

	/**
	 * Serializes the data in storage to a JSON
	 * string and stores it in a cookie
	 * @private
	 */
	_setCookieData: function() {
		var data = JSON.stringify(this.data);
		this._createCookie(data, 365);
	},

	/**
	 * Clear the cooke
	 */
	_clearCookieData: function() {
		this._createCookie('', 365);
	},

	/**
	 * Get all data in storage
	 * @return {Object}
	 * @private
	 */
	_getData: function() {
		var data = (this.hasStorage) ? null : this._readCookie();
		return (data) ? JSON.parse(data) : {};
	},

	/**
	 * Return storage values for JSON serialization
	 * @param  {String} key [optional] return a specific value
	 * @return {Value}
	 */
	toJSON: function(key) {
		var value = (key) ? this.get(key) : this._getData();
		return value;
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function(key) {
		return _toString(_STORAGE, {
			type: _.invert(_STORAGE_TYPE)[this.type],
			length: this.length
		});
	}
};


/**
 * Expose a store for local storage
 * @type {Storage}
 */
Storm.store = new Storage(_STORAGE_TYPE.localStorage);

/**
 * Expose an instace of storage for the session
 * @type {Storage}
 */
Storm.session = new Storage(_STORAGE_TYPE.sessionStorage);