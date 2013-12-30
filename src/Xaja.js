//###################################################################################
// Xaja #############################################################################
//###################################################################################

// Xaja.js 0.0.1
// Xaja may be freely distributed under the MIT license.
// https://github.com/JosephClay/Xaja.git
var Xaja = (function(root) {
	
	var _getXHR = function() { // Get XMLHttpRequest object
			return root.XMLHttpRequest ?
						new XMLHttpRequest() :
						new ActiveXObject('Microsoft.XMLHTTP');
		},
		_isVersion2 = (_getXHR().responseType === ''), // Determine XHR version
		_now = (function(Date) { // Now - used for cachebusting
			return (Date.now) ? Date.now : function() {
				return new Date().getTime();
			};
		}(Date)),
		_invert = function(obj) {
			var exp = {}, key;
			for (key in obj) {
				exp[obj[key]] = key;
			}
			return exp;
		},
		_accepts = { // Accept header types
			xml:  'application/xml, text/xml',
			html: 'text/html',
			text: 'text/plain',
			json: 'application/json, text/javascript',
			js:   'application/javascript, text/javascript'
		},
		// Get these from the window or IE
		// will throw an "undefined" error
		_JSON =        root.JSON,
		_ArrayBuffer = root.ArrayBuffer,
		_Blob =        root.Blob,
		_Document =    root.Document,
		_FormData =    root.FormData;

	// Constants ------------
	var _QUERY_REGEX = /\?/, // cached regex for Request
		_EVT = { // Event types
			success:  0,
			error:    1,
			progress: 2,
			complete: 3
		},
		_EVT_NAME = _invert(_EVT);

	// Request ------------
	var Request = function(xhr) {
		this.xhr = xhr;
		this._e = {};
	};
	Request.prototype = {
		success: function(func) {
			if (!func) { return this; }
			this._getRegistry(_EVT.success).push(func);
			return this;
		},
		done: function(func) { return this.success(func); },

		error: function(func) {
			if (!func) { return this; }
			this._getRegistry(_EVT.error).push(func);
			return this;
		},
		fail: function(func) { return this._error(func); },

		progress: function(func) {
			if (!func) { return this; }
			this._getRegistry(_EVT.progress).push(func);
			return this;
		},

		complete: function(func) {
			if (!func) { return this; }
			this._getRegistry(_EVT.complete).push(func);
			return this;
		},
		always: function(func) { return this.complete(func); },

		abort: function() {
			this.xhr.abort();
			return this;
		},

		_getRegistry: function(type) {
			return this._e[_EVT.complete] || (this._e[_EVT.complete] = []);
		},

		toString: function() {
			return '[Xaja]';
		}
	};
	// Protect ability to call registered functions
	// to the request
	var _requestTrigger = function(type, args) {
		var arr = this._e[type] || [],
			idx = 0, length = arr.length; 
		for (; idx < length; idx++) {
			arr[idx].apply(this.xhr, args || []);
		}

		this._e[type].length = 0;
	};

	var _construct = function(config) {
		config = config || {};

		var request = _createRequest(config);

		// Add the methods to the request if they exist
		// in the config
		var key;
		for (key in _EVT_NAME) {
			request[key](config[_EVT_NAME[key]]);
		}

		return request;
	};

	var _createRequest = function(config) {
		var xhr = _getXHR(),
			method = config.method || 'GET',
			url = config.url || '',
			dataObj = config.dataObj || null,
			isGet = (method === 'GET'),
			isPost = !isGet,
			isAsync = (config.async === undefined) ? true : !!config.async,
			type = (config.type) ? config.type.toLowerCase() : (config.dataType) ? config.dataType.toLowerCase() : 'text',
			isTypeSupported = _isSupportedType(xhr, type),
			headers = {
				'X-Requested-With': 'XMLHttpRequest'
			},
			queryString = '',
			data = _prepData(dataObj, queryString, isGet),
			isSerialized = (typeof data === 'string'),
			request = new Request(xhr);

		// Cache bust the query string
		_cacheBust(queryString, config.cache);

		if (queryString) {
			// Check if url has ? to append the queryString to the url
			url += (_QUERY_REGEX.test(url) ? '&' : '?') + queryString;
		}

		_bindProgress(xhr, request);
		
		// Open connection
		xhr.open(method, url, isAsync, config.user || '', config.password || '');

		// Plug response handler
		if (_isVersion2) {
			xhr.onload = function() {
				_handleResponse(xhr, url, isTypeSupported, type, request);
			};
		} else {
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					_handleResponse(xhr, url, isTypeSupported, type, request);
				}
			};
		}

		// Prepare headers
		if (isSerialized && isPost) {
			headers['Content-Type'] = 'application/x-www-form-urlencoded';
		}

		headers.Accept = config.content ? config.content : _accepts[type];

		var key;
		for (key in headers) {
			xhr.setRequestHeader(key, headers[key]);
		}

		// Send
		xhr.send(isPost ? data : null);
		
		// Timeout
		if (config.timeout) {
			this.loadTimeout = setTimeout(function() {
				xhr.abort();
				console.log('Loading timed out for: '+ url +' timeout: '+ config.timeout);
			}, config.timeout);
		}

		return request;
	};

	var _handleResponse = function(xhr, url, isTypeSupported, type, request) {
		var response = '',
			parseError = 'parseError',
			responseText = 'responseText',
			responseXML = 'responseXML';

		try {
			if (xhr.status !== 200) { // Verify status code
				throw new Error(xhr.status +' ('+ xhr.statusText +')');
			}

			// Process response
			if (type === 'text' || type === 'html') {

				response = xhr[responseText];

			} else if (isTypeSupported && xhr.response !== undefined) {

				response = xhr.response;

			} else {
				if (type === 'json') {

					try {
						response = _JSON ? _JSON.parse(xhr[responseText]) : eval('(' + xhr[responseText] + ')');
					} catch(e) {
						throw new Error('Error while parsing JSON body');
					}

				} else if (type === 'js') {

					response = eval(xhr[responseText]);

				} else if (type === 'xml') {

					if (!xhr[responseXML] ||
						(xhr[responseXML][parseError] && xhr[responseXML][parseError].errorCode && xhr[responseXML][parseError].reason)) {
						throw new Error('Error while parsing XML body');
					} else {
						response = xhr[responseXML];
					}

				} else {
					throw new Error('Unsupported type: '+ type);
				}
			}

			_requestTrigger.call(request, _EVT.success, [xhr, url, response]);

		} catch(e) {

			response = 'Request to "'+ url +'" errored: ' + e;
			_requestTrigger.call(request, _EVT.error, [xhr, url, response]);

		}

		// Execute complete stack
		_requestTrigger.call(request, _EVT.complete, [xhr, url, response]);
	};

	var _isSupportedType = function(xhr, type) {
		// Identify supported XHR version
		var isSupported = false;
		if (type && _isVersion2) {
			try {
				xhr.responseType = type;
				isSupported = (xhr.responseType === type);
			} catch(e) {}
		}
		return isSupported;
	};

	var _prepData = function(data, vars, isGet) {
		// Prepare data
		if (isGet &&
			(
				_ArrayBuffer && data instanceof _ArrayBuffer ||
				_Blob && data instanceof _Blob ||
				_Document && data instanceof _Document ||
				_FormData && data instanceof _FormData
			)
		) {
			// Cannot send any of the above types
			// in a GET request. Throw out the data
			data = null;
		} else {
			var values = [],
				key;
			for (key in data) {
				values.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
			}
			data = values.join('&');
		}

		if (isGet) { vars += data; }

		return data;
	};

	var _cacheBust = function(str, cache) {
		if (cache) { return; }

		if (str) { str += '&'; }
		str += ('_='+ _now());
	};

	var _bindProgress = function(xhr, request) {
		if (!_isVersion2 || !xhr.upload) { return; }

		var fire = function() {
			_requestTrigger.call(request, _EVT.progress, arguments);
		};

		// Has to be registered in two places for
		// cross-browser compatibility
		xhr.addEventListener('progress', fire, false);
		xhr.upload.addEventListener('progress', fire, false);
	};

	// Return public methods
	return {
		ajax: _construct,
		get: function(url, config) {
			config = config || {};
			config.method = 'GET';
			config.url = url;
			return _construct(config);
		},
		post: function(url, config) {
			config = config || {};
			config.method = 'POST';
			config.url = url;
			return _construct(config);
		}
	};
	
}(this));

Storm.ajax = Xaja;