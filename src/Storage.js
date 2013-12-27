//###################################################################################
// Storage ##########################################################################
//###################################################################################

// Based off of Remy's polyfill: https://gist.github.com/remy/350433
var Storage = Storm.Storage = (function() {

	var _TYPE = {
			local: 1,
			session: 2
		},
		_TYPE_NAME = _.invert(_TYPE);

	var Storage = function(type) {
		this.type = type || _TYPE.local;
		this.name = _TYPE_NAME[this.type];
		this.storage = root[this.name + 'Storage'];
		this.hasStorage = _exists(this.storage);
		this.data = this._getData();
		this.length = (this.hasStorage) ? this.storage.length : _.size(this.data);
	};

	Storage.TYPE = _TYPE;

	Storage.prototype = {
		constructor: Storage,
		
		clear: function() {
			this.data = {};
			this.length = 0;

			if (this.hasStorage) {
				this.storage.clear();
				return this;
			}

			this._clearData();
			return this;
		},

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

		getItem: function(key) {
			if (this.hasStorage) {
				var storedValue = this.storage.getItem(key);
				if (!_exists(storedValue)) { return storedValue; }
				return JSON.parse(storedValue);
			}

			return this.data[key];
		},
		get: function(key) {
			return this.getItem(key);
		},

		setItem: function(key, value) {
			// Multiple items are being set
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
			this._setData();
		},
		store: function(key, value) {
			this.setItem(key, value);
		},
		set: function(key, value) {
			this.setItem(key, value);
		},

		removeItem: function(key) {
			if (this.hasStorage) {
				var storage = this.storage.removeItem(key);
				this.length = this.storage.length;
				return storage;
			}

			delete this.data[key];
			this.length--;
			this._setData();
		},
		remove: function(key) {
			this.removeItem(key);
			return this;
		},

		// Private Methods ---------------------------------------------
		// Cookies
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

		// Data: Get | Set | Clear
		_setData: function() {
			var data = JSON.stringify(this.data);
			this._createCookie(data, 365);
		},

		_clearData: function() {
			this._createCookie('', 365);
		},

		_getData: function() {
			var data = (this.hasStorage) ? null : this._readCookie();
			return (data) ? JSON.parse(data) : {};
		},

		toJSON: function(key) {
			var value = (key) ? this.get(key) : this._getData();
			return value;
		},
		toString: function(key) {
			return '['+ STORM.name +' Storage]';
		}
	};

	return Storage;

}());

Storm.store = new Storage(Storage.TYPE.local);
Storm.session = new Storage(Storage.TYPE.session);