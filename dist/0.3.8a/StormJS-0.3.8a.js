/*! StormJS - v0.3.8a - 2013-12-26
 * https://github.com/dci-artform/StormJS
 * Copyright (c) 2012-2013 Joe Clay; Licensed  */
(function(root, _, undefined) {
	// "root" is a safe reference to the environment.
	// setup so that this can be used in a node environment

//----

var previousStorm = root.Storm, // Hold on to previous Storm reference (can release with noConflict)
	Storm = root.Storm = {}; // Define Storm

//----

//###################################################################################
// Helpers ##########################################################################
//###################################################################################

// Small polyfill for console
var console = console || {};
console.log = console.log || function() {};
console.error = console.error || console.log;

// Existance check
var _exists = function(value) {
	return (value !== null && value !== undefined);
};

var _stringFormat = (function() {

	var _REGEX = new RegExp('{([^}])+}', 'g');

	return function(str, fill) {
		return str.replace(_REGEX, function(capture, value) {
			return fill[value] || '';
		});
	};

}());

/**
 * Object merger, could use _.extend (and indeed, _.extend is
 * used a lot) but the iterator is much slower than a native for
 * loop, increasing initialization time.
 * @return {Object}
 */
var _extend = function() {
	var args = arguments,
		base = args[0],
		idx = 1, length = args.length,
		key, merger;
	for (; idx < length; idx++) {
		merger = args[idx];
		
		for (key in merger) {
			base[key] = merger[key];
		}
	}

	return base;
};

//----

//###################################################################################
// Constants ########################################################################
//###################################################################################

var STORM = {};
_extend(STORM, {
	version: '0.0.1',
	name: 'StormJS',
	category: {
		nonblocking: 0,
		blocking: 1
	}
});

Storm.constants = function() { return STORM; };

//----

//###################################################################################
// Mixin ############################################################################
//###################################################################################

var _mixin = function(name, prop) {
	if (Storm[name] !== undefined) { return console.error(STORM.name +': Cannot mixin, '+ name +' already exists: ', Storm[name]); }
	Storm[name] = prop;
};

/**
 * Protect Storm from mixins that would overwrite pre-existing keys.
 * @param  {String||Object} name Name of the object
 * @param  {Object}         prop The object to mixin
 */
Storm.mixin = function(name, prop) {
	// Mix single
	if (_.isString(name)) {
		_mixin(name, prop);
	}

	// Mix multiple
	var key;
	for (key in name) {
		_mixin(key, name[key]);
	}
};


//----

//###################################################################################
// Unique Id ########################################################################
//###################################################################################

	/**
	 * Generate a unique id
	 * @param  {String}         prefix [optional] Defines a scope for the identifiers
	 * @return {Number||String} id
	 */
var _uniqId = Storm.uniqId = (function() {
		
		var _scopedIdentifiers = {};

		return function(scope) {
			scope = scope || '';
			var inc = (_scopedIdentifiers[scope] || 0) + 1;
			return (_scopedIdentifiers[scope] = inc);
		};
		
	}()),
	_uniqIdStr = Storm.uniqIdStr = function(scope) {	
		return (scope || 'id') + '' + _uniqId(scope);
	};

//----

//###################################################################################
// Extend ###########################################################################
//###################################################################################

/**
 * Prototypical class extension
 * From: https://github.com/JosephClay/Extend.git
 * @param {Function} constructor   optional
 * @param {Object}   extension     optional
 */
var Extend = Storm.Extend = function(constructor, extension) {
	var hasConstructor = (typeof constructor === 'function');
	if (!hasConstructor) { extension = constructor; }

	var self = this,
		fn = function() {
			var ret = self.apply(this, arguments);
			if (hasConstructor) {
				ret = constructor.apply(this, arguments);
			}
			return ret;
		};

	// Add properties to the object
	_extend(fn, this);

	// Duplicate the prototype
	var NoOp = function() {};
	NoOp.prototype = this.prototype;
	fn.prototype = new NoOp();

	// Merge the prototypes
	_extend(fn.prototype, this.prototype, extension);
	fn.prototype.constructor = constructor || fn;

	return fn;
};

//----

//###################################################################################
// Events ###########################################################################
//###################################################################################

/*! Signal.js - v0.0.2 - 2013-11-23
 * https://github.com/JosephClay/Signal
 * Signal may be freely distributed under the MIT license. */

var Events = Storm.Events = (function() {

	var _NAME_REGEX = /\w([^:\.])*/g,
		_NAME = 'signal',
		_splicer = ([]).splice,
		_extend = function() {
			var args = arguments,
				base = args[0],
				idx = 1, length = args.length,
				key, merger;
			for (; idx < length; idx += 1) {
				merger = args[idx];

				for (key in merger) {
					base[key] = merger[key];
				}
			}
		};

	var Signal = function() {
		this._cache = {};
		this._active = {};
		this._inactive = {};
		this._subid = 0;
		this._subscriptions = {};
	};

	Signal.construct = function() {
		return new Signal();
	};

	Signal.extend = Extend;

	Signal.prototype = {
		constructor: Signal,

		subscribe: function(name, func) {
			var id = this._uniqueSubId(_NAME),
				location = this._subscriptions[name] || (this._subscriptions[name] = []);

			func.__subid__ = id;
			location.push(func);

			return id;
		},

		unsubscribe: function(name, id) {
			var location = this._subscriptions[name];
			if (!location) { return; }

			var idx = 0, length = location.length;
			for (; idx < length; idx += 1) {
				if (location[idx].__subid__ === id) {
					location.splice(idx, 1);
					return true;
				}
			}

			return false;
		},

		dispatch: function() {
			var args = arguments,
				name = _splicer.call(args, 0, 1)[0],
				location = this._subscriptions[name] || (this._subscriptions[name] = []),
				idx = 0, length = location.length,
				func;
			for (; idx < length; idx++) {
				func = location[idx];
				if (func) { func.apply(null, args); }
			}
		},

		/* Disable | Enable *************************************/
		disable: function(handle) {
			this._inactive[handle] = this._inactive[handle] || {};
			this._inactive[handle] = _extend({}, this._active[handle]);
			delete this._active[handle];

			return this;
		},

		enable: function(handle) {
			this._active[handle] = this._active[handle] || {};
			this._active[handle] = _extend({}, this._inactive[handle]);
			delete this._inactive[handle];

			return this;
		},

		/* On | Off ************************************************/
		on: function(eventname, callback) {
			var eventConfig, location,
				cacheConfig = this._cache[eventname];

			if (cacheConfig) {
				eventConfig = cacheConfig;
				location = this._getEventLocation(eventConfig);
			} else {
				eventConfig = this._cache[eventname] = this._parseConfig(eventname);
				location = this._createEventLocation(eventConfig);
			}

			location.push(callback);

			return this;
		},
		off: function(eventname) {
			var eventConfig,
				cacheConfig = this._cache[eventname];

			if (cacheConfig) {
				eventConfig = cacheConfig;
			} else {
				eventConfig = this._cache[eventname] = this._parseConfig(eventname);
			}

			if (eventConfig.hasNamespace) { // Has a namespace
				this._active[eventConfig.handle][eventConfig.evt][eventConfig.namespace].length = 0;
			} else { // Does not have a namespace
				this._active[eventConfig.handle][eventConfig.evt] = { '': [] };
			}

			return this;
		},
		once: function(eventname, callback) {
			var hasRan = false, memo;

			return this.on(eventname, function() {
				return function() {
					if (hasRan) { return memo; }
					hasRan = true;

					memo = callback.apply(this, arguments);
					callback = null;

					return memo;
				};
			});
		},

		/* Trigger ************************************************/
		trigger: function() {
			var args = arguments,
				eventname = _splicer.call(args, 0, 1)[0],
				cacheConfig = this._cache[eventname];

			if (cacheConfig) {
				eventConfig = cacheConfig;
			} else {
				eventConfig = this._cache[eventname] = this._parseConfig(eventname);
			}

			var location = this._getEventLocation(eventConfig);
			if (!location) { return this; }

			if (eventConfig.hasNamespace) { // If there's a namespace, trigger only that array
				this._callEventArray(location, args);
			} else { // Else, trigger everything registered to the event
				var subSignal = this._active[eventConfig.handle][eventConfig.evt], key;
				for (key in subSignal) {
					this._callEventArray(subSignal[key], args);
				}
			}

			return this;
		},

		/* ListenTo | StopListening ********************************/
		listenTo: function(obj, eventname, callback) {
			obj.on(eventname, callback);
			return this;
		},
		stopListening: function(obj, eventname) {
			obj.off(eventname);
			return this;
		},

		/* Private *************************************************/
		_uniqueSubId: function() {
			return 's' + this._subid++;
		},

		_callEventArray: function(events, args) {
			args = args || [];

			var idx = 0, length = events.length,
				evt;
			for (; idx < length; idx += 1) {
				evt = events[idx];
				if (!evt) { continue; }
				if (evt.apply(null, args) === false) { return; }
			}
		},

		_parseConfig: function(eventname) {
			var hasHandle = (eventname.indexOf(':') !== -1) ? true : false,
				hasNamespace = (eventname.indexOf('.') !== -1) ? true : false,
				matches = eventname.match(_NAME_REGEX),
				eventConfig = {};

			if (hasHandle && hasNamespace) { // Has handle, event, namespace

				eventConfig.handle = matches[0];
				eventConfig.evt = matches[1];
				eventConfig.namespace = matches[2];

			} else if (hasHandle && !hasNamespace) { // Has handle and event

				eventConfig.handle = matches[0];
				eventConfig.evt = matches[1];
				eventConfig.namespace = '';

			} else if (hasNamespace && !hasHandle) { // Has event and namespace

				eventConfig.handle = '';
				eventConfig.evt = matches[0];
				eventConfig.namespace = matches[1];

			} else { // Has event

				eventConfig.handle = '';
				eventConfig.evt = matches[0];
				eventConfig.namespace = '';

			}

			eventConfig.hasHandle = hasHandle;
			eventConfig.hasNamespace = hasNamespace;

			return eventConfig;
		},

		_getEventLocation: function(eventConfig, location) {
			location = location || this._active;

			var handle = location[eventConfig.handle];
			if (!handle) { return; }

			var evts = handle[eventConfig.evt];
			if (!evts) { return; }

			if (!eventConfig.hasNamespace) { return evts; }

			var namespace = evts[eventConfig.namespace];
			if (!namespace) { return; }

			// Return the location
			return namespace;
		},

		_createEventLocation: function(eventConfig, location) {
			location = location || this._active;

			var handle = location[eventConfig.handle] || (location[eventConfig.handle] = {}),
				evt = handle[eventConfig.evt] || (handle[eventConfig.evt] = {}),
				namespace = evt[eventConfig.namespace] || (evt[eventConfig.namespace] = []);

			return namespace;
		},

		toString: function() {
			return '['+ STORM.name +' Events]';
		}
	};

	// Create a pub/sub to expose Signal as
	// e.g. Signal.on(), Signal.trigger()
	var pubSub = new Signal();
	
	// Attach the Signal object as a property
	// of the exposed object so that new instances
	// can be constructed/extended
	// e.g. Signal.core.construct(), Signal.core.extend({})
	pubSub.core = Signal;

	// Expose
	return pubSub;

}());

_extend(Storm, Events.core.construct());

//----

//###################################################################################
// Promise ##########################################################################
//###################################################################################

var Promise = Storm.Promise = (function() {

	var _STATUS = {
			idle:       0,
			progressed: 1,
			failed:     2,
			done:       3
		},
		_CALL = {
			done:     0,
			fail:     1,
			always:   2,
			progress: 3,
			pipe:     4
		},
		_CALL_NAME = _.invert(_CALL);

	var Promise = function() {
		this._calls = {};
		this.status = _STATUS.idle;
	};

	Promise.STATUS = _STATUS;
	Promise.CALL = _CALL;

	Promise.prototype = {
		constructor: Promise,

		done:     function(func) { return this.pushCall.call(this, _CALL.done,     func); },
		fail:     function(func) { return this.pushCall.call(this, _CALL.fail,     func); },
		always:   function(func) { return this.pushCall.call(this, _CALL.always,   func); },
		progress: function(func) { return this.pushCall.call(this, _CALL.progress, func); },
		pipe:     function(func) { return this.pushCall.call(this, _CALL.pipe,     func); },

		pushCall: function(callType, func) {
			this._getCalls(callType).push(func);
			return this;
		},

		notify: function() {
			this.status = _STATUS.progressed;

			var args = this._runPipe(arguments);
			this._fire(_CALL.progress, args)._fire(_CALL.always, args);

			return this;
		},
		reject: function() {
			this.status = _STATUS.failed;

			// Never run the pipe on fail. Simply fail.
			// Running the pipe after an unexpected failure may lead to
			// more failures
			this._fire(_CALL.fail, arguments)._fire(_CALL.always, arguments);

			return this;
		},
		resolve: function() {
			this.status = _STATUS.done;

			var args = this._runPipe(arguments);
			this._fire(_CALL.done, args)._fire(_CALL.always, args);

			return this;
		},

		_fire: function(callType, args) {
			var calls = this._getCalls(callType),
				idx = 0, length = calls.length;
			for (; idx < length; idx++) {
				calls[idx].apply(null, args);
			}
			return this;
		},

		_runPipe: function(args) {
			var pipes = this._getCalls(_CALL.pipe),
				idx = 0, length = pipes.length, val;
			for (; idx < length; idx++) {
				val = pipes[idx].apply(null, args);
				if (val !== undefined) { args = [val]; }
			}

			return args;
		},

		_getCalls: function(type) {
			return this._calls[_CALL_NAME[callType]] || (this._calls[_CALL_NAME[callType]] = []);
		},

		// Allows a promise to be called like a
		// Function.call or Function.apply
		//
		// Very usefull for passing a promise as
		// a callback function to 3rd party code
		call: function() {
			var args = _.toArray(arguments);
			args.splice(0, 1); // The context
			this.notify.apply(this, args);
		},
		apply: function(ctx, args) {
			this.notify.apply(this, args);
		},

		toString: function() {
			return '['+ STORM.name +' Promise]';
		}
	};

	return Promise;

}());

//----

//###################################################################################
// When #############################################################################
//###################################################################################

var When = Storm.when = (function(Promise) {

	var When = function() {
		this._p = null; // So we'll store the promise here
		this._events = [];
	};

	When.prototype = {
		constructor: When,

		init: function() {
			this._events = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments);
			this._subscribe();

			var promise = new Promise();
			promise.then = function() { this.done.apply(this, arguments); };
			this._p = promise;
			return promise; // Return the promise so that it can be subscibed to
		},

		_subscribe: function() {
			var check = this._checkStatus.bind(this),
				fireProgress = this._fireProgress.bind(this),
				events = this._events,
				idx = events.length;
			while (idx--) {
				events[idx].done(check).fail(check).progress(fireProgress);
			}
		},

		_checkStatus: function() {
			var events = this._events, evt,
				total = events.length,
				done = 0, failed = 0,
				idx = total;
			while (idx--) {
				evt = events[idx];
				// We're waiting for everything to complete
				// so if there's an item with no status, stop
				if (evt.status === Promise.STATUS.idle) { return; }
				if (evt.status === Promise.STATUS.done) { done += 1; continue; }
				if (evt.status === Promise.STATUS.failed) { failed += 1; continue; }
			}
			this._fire(total, done, failed, arguments);
		},

		_fire: function(total, done, failed, args) {
			var promise = this._p; // Our promise

			// If everything completed, call done (this will call always)
			if (done === total) { return promise.resolve.apply(promise, args); }
			// If everything failed, call fail (this will call always)
			if (failed === total) { return promise.reject.apply(promise, args); }
			// If everything fired, but they're not all one thing, then just call always
			if ((done + failed) === total) { return promise._fire(Promise.CALL.always, args); }
		},

		// Handled separately from fire because we want to trigger
		// anytime any of the promises progress regardless of sate
		_fireProgress: function() {
			var promise = this._p;
			promise.notify.apply(promise, arguments);
		}
	};

	return function() {
		var w = new When();
		return w.init.apply(w, arguments);
	};

}(Promise));

//----

//###################################################################################
// Animate ##########################################################################
//###################################################################################

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
(function() {
	var lastTime = 0,
		vendors = ['ms', 'moz', 'webkit', 'o'],
		idx = 0, length = vendors.length;
	for (; idx < length && !root.requestAnimationFrame; idx++) {
		root.requestAnimationFrame = root[vendors[idx] + 'RequestAnimationFrame'];
		root.cancelAnimationFrame = root[vendors[idx] + 'CancelAnimationFrame'] || root[vendors[idx] + 'CancelRequestAnimationFrame'];
	}

	if (!root.requestAnimationFrame) {
		root.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime(),
				timeToCall = Math.max(0, 16 - (currTime - lastTime)),
				id = root.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!root.cancelAnimationFrame) {
		root.cancelAnimationFrame = function(id) { clearTimeout(id); };
	}
}());

/**
 * Hook into requestAnimationFrame through Storm. Keeps
 * a single raf so that there aren't multiple calls or miss-calls
 * that would cause raf from functioning, e.g.:
 *
 * var update = function() { raf(update); };
 * raf(update);
 * 
 * later in the application:
 * raf(update);
 *
 * Also automatically calls TWEEN if it's present
 * https://github.com/sole/tween.js/
 */
Storm.animate = (function() {
	var _hooks = {}, // Stores the index of loop functions
		_loop = [], // Stores function calls
		_raf = root.requestAnimationFrame,
		_id = null,
		_isRunning = true;
		_animate = function() {
			var idx = 0,
				length = _loop.length;
			while (idx < length) {
				_loop[idx]();
				idx += 1;
			}

			_id = root.requestAnimationFrame(_animate);
		};

	_animate(); // Auto-start

	return {
		/**
		 * Add a function to requestAnimationFrame
		 * @param  {Function} func
		 * @return {String}   id
		 */
		hook: function(func) {
			if (!_.isFunction(func)) { return console.error(STORM.name +': Parameter must be a function: ', func); }
			var id = _uniqId('Animate');
			_hooks[id] = _loop.length;
			_loop.push(func);
			return id;
		},
		
		/**
		 * Remove a function from requestAnimationFrame
		 * @param  {String} id Function id
		 * @return {this}
		 */
		unhook: function(id) {
			_loop.splice(_hooks[id], 1);
			delete _hooks[id];
			return this;
		},

		/**
		 * Check if animate is running
		 * @return {this}
		 */
		isRunning: function() {
			return this._isRunning;
		},

		/**
		 * Start requestAnimationFrame calling hooked functions
		 * @return {this}
		 */
		start: function() {
			if (_isRunning) { return; }
			_isRunning = true;

			_animate();
			return this;
		},

		/**
		 * Stop requestAnimationFrame from calling hooked functions
		 * @return {this}
		 */
		stop: function() {
			if (!_isRunning) { return; }
			_isRunning = false;

			root.cancelAnimationFrame(_id);
			return this;
		}
	};
}());

//----

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

//----

//###################################################################################
// Request ##########################################################################
//###################################################################################

var Request = Storm.request = (function() {

	var _categories = {},
		_totalQueued = 0;

	var Request = function() {
		Events.core.call(this);
		
		// Abort is a special little case
		// cause it's called from the outside
		// on a call
		var self = this;
		this.on('abort', function(e, req, status, err, call) {
			self.erase(call);
		});
	};

	_extend(Request.prototype, Events.core.prototype, {
		constructor: Request,

		record: function(call) {
			var config = call.getConfiguration(),
				category = _categories[config.category] || (_categories[config.category] = {});
			
			// this call is already being tracked
			if (category[call.getId()]) { return this; }

			category[call.getId()] = call;
			_totalQueued++;
			
			this.trigger('record', call);

			return this;
		},

		erase: function(call) {
			var cat = call.getConfiguration().category,
				id = call.getId();

			if (_categories[cat] && _categories[cat][id]) {
				delete _categories[cat][id];
				_totalQueued--;
				
				this.trigger('erase', call);
			}
			

			return this;
		},

		getTotalQueued: function() {
			return _totalQueued;
		},

		/* Add ****************************************/
		addCategories: function(name) {
			if (_.isString(name)) {
				this.addCategory(name);
				return this;
			}

			var categories = name;
			_.each(categories, function(cat) {
				this.addCategory(name);
			});

			return this;
		},

		addCategory: function(name) {
			if (STORM.category[name] !== undefined) {
				return console.error(STORM.name +': Cannot add category, "'+ name + '" already exists: ', STORM.category[name]);
			}

			// _.size() on Storm.category ensures a unique
			// value for this category (in case we need
			// to reverse-look-up)
			STORM.category[name] = _.size(STORM.category);
			
			return this;
		},

		getCategories: function() {
			return _categories;
		},

		getCategory: function(cat) {
			return _categories[cat];

		},

		toString: function() {
			return '['+ STORM.name +' Request]';
		}
	});

	return new Request();

}());

//----

//###################################################################################
// Data Context #####################################################################
//###################################################################################

var DataContext = Storm.DataContext = (function(AjaxCall) {

	var DataContext = function() {
		this._id = _uniqId('DataContext');
	};

	/* Setup (global) ************************************************/
	DataContext.globalCallTemplate = {};

	DataContext.settings = (function() {
		var loc = root.location || {};
		return {
			host: loc.host,
			hostname: loc.hostname,
			origin: loc.origin,
			pathname: loc.pathname,
			port: loc.port
		};
	}());

	DataContext.setup = function(settings) {
		_.extend(DataContext.setting, settings);
	};
	DataContext.getSetting = function(settingName) {
		return DataContext.settings[settingName];
	};
	DataContext.removeSetting = function(settingName) {
		if (DataContext.settings[settingName]) {
			delete DataContext.settings[settingName];
			return true;
		}
		return false;
	};

	DataContext.prototype = {
		constructor: DataContext,
		
		defaults: {},

		/**
		 * The merged defaults and passed options
		 * @type {Object}
		 */
		options: {},
		
		/**
		 * Overrides AjaxCall's defaults
		 * @type {Object}
		 */
		callTemplate: {},

		/* Settings ************************************************/
		getSetting: function() { 
			return DataContext.getSetting.apply(arguments);
		},
		removeSetting: function() { 
			return DataContext.removeSetting.apply(arguments);
		},

		/* Extend Options ************************************************/
		/**
		 * Add more options to this data context
		 * @param  {Object} options
		 * @return {this}
		 */
		extendOptions: function(options) {
			this.options = _.extend({}, this.defaults, options);
			return this;
		},

		/**
		 * Remove an option from this data context
		 * @param  {String} key
		 * @return {this}
		 */
		removeOption: function(key) {
			delete this.options[key];
			return this;
		},

		/* Create Call ************************************************/
		/**
		 * Creates and returns a new AjaxCall
		 * @param  {Object}      callData   A base call object
		 * @param  {Object}      extensionData  Addition configurations for the url
		 * @return {AjaxCall}
		 */
		createCall: function(callData, extensionData) {
			return new AjaxCall(callData, extensionData, this.options);
		},

		toString: function() {
			return '['+ STORM.name +' DataContext]';
		}
	};

	return DataContext;

}(AjaxCall));

//----

//###################################################################################
// Ajax Call ########################################################################
//###################################################################################

/**
 * A wrapper for an ajax "call" configuration (referred to as a call
 * within AjaxCall). This object can ajax, abort and be passed
 * around the application.
 *
 * This object is private to Storm and is not exposed.
 * DataContexts should be the only creators of AjaxCalls
 * 
 * @param {Object} callObj
 * @param {Object} extensionObj
 * @param {Object} options
 */
var AjaxCall = (function() {

	var AjaxCall = function(callObj, extensionObj, options) {
		this._id = _uniqId('AjaxCall');
		this.call = this.configure(callObj, extensionObj, options);
		this.data = '';
	};
	AjaxCall.prototype = {
		constructor: AjaxCall,

		defaults: {
			name: '',
			type: 'GET',
			content: 'application/json; charset=utf-8',
			url: '',
			cache: false,
			category: STORM.category.nonblocking
		},

		/**
		 * Configure the call object so that it's ready to ajax
		 * @param  {Object} providedCall Call object
		 * @param  {Object} extension    Addition (manual) configurations for the url
		 * @param  {Object} opts         Options from the calling context to merge into the url
		 * @return {Object} call
		 */
		configure: function(providedCall, extension, opts) {
			var call = _.extend({}, this.defaults, DataContext.callTemplate, providedCall);

			var url = call.url;
			url = this._urlMerger(url, _.extend({}, DataContext.settings, opts, extension));
			call.url = url;
			call._id = this._id;

			return call;
		},

		getConfiguration: function() {
			return this.call;
		},

		getId: function() {
			return this._id;
		},

		isType: function(type) {
			return (type.toUpperCase() === this.call.type.toUpperCase());
		},

		isCategory: function(type) {
			return (type.toUpperCase() === this.call.category.toUpperCase());
		},

		/* Get | Set ********************************************/
		/**
		 * Gets and sets to transform the call configuration
		 * after creation.
		 */
		get: function(key) {
			return this.call[key];
		},
		set: function(key, value) {
			this.call[key] = value;
			return this;
		},

		/* Send ************************************************/
		/**
		 * Uses jQuery ajax to ajax the stored call object
		 * @param  {Storm.Promise}  promise optional
		 * @return {xhr (jQuery)}
		 */
		send: function(promise) {
			var self = this,
				call = this.call;

			var request = this.request = Xaja.ajax({
				type: call.type,
				url: call.url,
				contentType: call.content,
				data: call.data || this.data,
				cache: call.cache,
				success: function(data) {
					data = _exists(data) ? (data.d || data) : null; // ASP.NET uses a paradign of {}.d
					if (promise) {
						promise.resolve(data);
					}

					Storm.request.trigger('done', data, self);
				},
				error: function(req, status, err) {
					if (promise) {
						promise.reject(req);
					}

					// Abort!
					if (req.status === 0) {
						Storm.request.trigger('abort', req, status, err, self);
						return;
					}

					// Fail
					Storm.request.trigger('fail', req, status, err, self);
				},
				complete: function() {
					Storm.request.trigger('always', self);
				}
			});

			// Record the call
			Storm.request.record(this);

			// Erase the call when done
			request.always(function() {
				Storm.request.erase(self);
			});

			return request;
		},

		/* Abort ************************************************/
		/**
		 * Aborts the current request
		 * @return {this}
		 */
		abort: function() {
			if (this.request) { this.request.abort(); }
			return this;
		},

		toString: function() {
			return '[Signal AjaxCall]';
		}
	};

	return AjaxCall;

}());

//----

//###################################################################################
// Tempalate ########################################################################
//###################################################################################

Storm.template = (function() {
	
	var _templates = {},
		_compiledTemplates = {},
		_engine;

	/* Register *****************************************************/
	var _register = function(name, tpl) {
		// If an object, multiple items are being registered.
		if (!_.isString(name)) {
			var key, obj = name;
			for (key in obj) {
				_register(key, obj[key]);
			}
			return this;
		}

		// Not an object, must be a string. If it's an
		// id string, go get the html for the template
		if (name[0] === '#') {
			var element = document.getElementById(name.substring(1, name.length));
			if (!element) { return console.error(STORM.name +': Cannot find reference to "'+ name +'" in DOM'); }
			tpl = element.innerHTML;
		}

		_templates[name] = _coerceTemplateToString(tpl);
		return this;
	};

	var _coerceTemplateToString = function(tpl) {
		if (_.isFunction(tpl)) { tpl = tpl.call(); }
		if (_.isString(tpl)) { return tpl.trim(); }
		if (_.isArray(tpl)) { return tpl.join('\n').trim(); }
		console.error(STORM.name +': Template (or the return value) was of unknown type');
	};

	/* Retrieve | Remove *****************************************************/
	var _retrieve = function(name) {
		// If there's a compiled template, return that one
		var compTpl = _compiledTemplates[name];
		if (compTpl) { return compTpl; }

		if (!_engine) { console.error(STORM.name +': No template engine has been registered'); }
		return (_compiledTemplates[name] = _engine.compile(_templates[name]));
	};

	var _remove = function(name) {
		delete _templates[name];
		delete _compiledTemplates[name];
	};

	/* Render **************************************************/
	var _render = function(name, data) {
		var tpl = _retrieve(name);
		return tpl(data || {});
	};

	return {
		add: _register,
		remove: _remove,
		render: _render,
		setEngine: function(engine) {
			_engine = engine;
		},
		toJSON: function(key) {
			var value = (key) ? _templates[key] : _templates;
			return value;
		},
		toString: function(key) {
			return '['+ STORM.name +' template]';
		}
	};
}());

//----

//###################################################################################
// View #############################################################################
//###################################################################################

var View = Storm.View = (function() {

	var View = function(opts) {
		Events.core.call(this);

		opts = opts || {};
		this._id = _uniqId('View');
		this.elem = opts.elem || null;
		this.template = this.template || opts.template || '';
	};

	_extend(View.prototype, Events.core.prototype, {
		constructor: View,

		render: function() {},

		getElem: function() {
			return this.elem || (this.elem = this.render());
		},
		
		// Remove this view by taking the element out of the DOM, and removing any
		// applicable Storm.Events listeners.
		remove: function() {
			if (this.elem) { this.elem.remove(); }
			return this;
		},

		toString: function() {
			return '['+ STORM.name +' View]';
		}
	});

	return View;

}());

//----

//###################################################################################
// Model ############################################################################
//###################################################################################

var Model = Storm.Model = (function() {

	var Model = function(data, options, collectionData) {
		Events.core.call(this);

		this._id = _uniqId('Model');

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
			return '['+ STORM.name +' Model]';
		}
	});

	// Underscore methods that we want to implement on the Model.
	_.each([
		'each',
		'size',
		'toArray',
		'pluck'
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

	return Model;

}());

//----

//###################################################################################
// Comparator #######################################################################
//###################################################################################

/**
 * Used by the Collection to sort Models. Having
 * a separate object used by the model normalizes
 * sorting and allows optimization by caching values
 * (especially when dealing with string comparions)
 */
var Comparator = Storm.Comparator = (function() {
	
	var _SORT = {
			alphabetical: 0,
			numeric: 1,
			date: 2
		};

	var Comparator = function(key, type) {
		this._key = key;
		this._type = type || _SORT.alphabetical;
		this._store = {};
	};

	Comparator.HOISTING_STR = '___';
	Comparator.SORT = _SORT;

	Comparator.prototype = {
		constructor: Comparator,
		
		/**
		 * Bind to the key on the model that the comparator
		 * watches. If the key changes, invalidate the sort
		 * value so that it's recalculated
		 * @param  {Storm.Model} model
		 */
		bind: function(model) {
			var self = this;
			model.on(this._key + '.change', function() {
				self.invalidateSortValue(model);
			});
		},

		/**
		 * Invalidates the sort value of a model
		 * by deleting it from the store
		 * @param  {Storm.Model} model
		 * @return {this}
		 */
		invalidateSortValue: function(model) {
			delete this.store[model.getId()];
			return this;
		},

		/**
		 * Get the value to sort by
		 * @param  {Storm.model}  model
		 * @return {value}
		 */
		getSortValue: function(model) {
			var id = model.getId(),
				value;
			if (this._store[id]) { return this._store[id]; }

			if (this._type === _SORT.date) { // Date

				value = this.dateValue(model);

			} else if (this._type === _SORT.numeric) { // Number

				value = this.numericValue(model);

			} else { // String by default

				value = this.alphabeticalValue(model);

			}

			this._store[id] = value;
			return value;
		},

		alphabeticalValue: function(model) {
			var value = model.get(this._key) || '';
			value = (value ? value.toLocaleLowerCase() : Comparator.HOISTING_STR);
			return value;
		},
		numericValue: function(model) {
			var value = model.get(this._key) || 0;
			value = +value;
			return value;
		},
		dateValue: function(model) {
			var value = model.get(this._key) || new Date();
			value = _.isDate(value) ? value : new Date(value);
			return value;
		},

		toString: function() {
			return '['+ STORM.name +' Comparator]';
		}
	};

	return Comparator;

}());

//----

//###################################################################################
// Collection #######################################################################
//###################################################################################

var Collection = Storm.Collection = (function(Model) {
	
	var Collection = function(data) {
		Events.core.call(this);
		
		data = data || {};

		this._id = _uniqId('Collection');
		this._models = [];

		this.add(data.models, { isSilent: true }, data);
	};

	_extend(Collection.prototype, Events.core.prototype, {
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

		/* Mass Set ************************************************************************/
		// To go with "get" below
		set: function(attr, value, models) {
			models = models || this._models;

			var idx = models.length;
			while (idx--) {
				models[idx].set(attr, value);
			}
		},

		/* Add *****************************************************************************/
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

		/* Remove *****************************************************************************/
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

		/* Sort *****************************************************************************/
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

		/* Get *****************************************************************************/
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

		/* Reset | Clone ***************************************************************************/
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

		/* Data Retrieval ******************************************************************/
		retrieve: function() { // To match model.retrieve()
			return _.map(this._models, function(model) {
				return model.retrieve();
			});
		},

		toJSON: function() {
			return this.retrieve();
		},

		toString: function() {
			return '['+ STORM.name +' Collection]';
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

//----

//###################################################################################
// Module ###########################################################################
//###################################################################################

var Module = Storm.Module = (function() {

	var Module = function() {
		Events.core.call(this);
		this._id = _uniqId('Module');
	};

	_extend(Module.prototype, Events.core.prototype, {
		constructor: Module,

		toString: function() {
			return '['+ STORM.name +' Module]';
		}
	});

	return Module;

}());

//----

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

//----

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

//----

//###################################################################################
// Extension ########################################################################
//###################################################################################

Events.extend = Cache.extend = DataContext.extend = Model.extend = Collection.extend = Comparator.extend = View.extend = Module.extend = Extend;


//----

//###################################################################################
// No Conflict ######################################################################
//###################################################################################

/**
 * Return the "Storm" global to its previous assignment
 * and return Storm back to caller.
 * @return {Storm}
 */
Storm.noConflict = function() {
	root.Storm = previousStorm;
	return this;
};

//----

	
	// Expose Storm as an AMD module
	if (typeof define !== 'undefined' && define.amd) {
		define('Storm', [], function() {
			return Storm;
		});
	}

}(this, _));