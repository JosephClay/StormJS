// Ajax Call ########################################################################

/**
 * Available classifications for a call to reside in.
 * Gives flexibility to a call to be in a classification
 * that gives it meaning to the application and not the
 * server 
 * @type {Object[Number]}
 */
var _CLASSIFICATION = {
		nonblocking: 0,
		blocking: 1
	};
	_addClassification = function(type) {
		// The type has already been defined
		if (type in _CLASSIFICATION) { return; }

		// Using _.size ensures a unique id
		// for the type passed
		_CLASSIFICATION[type] = _.size(_CLASSIFICATION);
	};

/**
 * A wrapper for an ajax "call" configuration (referred to as a call
 * within AjaxCall). This object can ajax, abort and be passed
 * around the application.
 * 
 * @param {Object} callObj
 * @param {Object} extensionObj
 * @param {Object} options
 */
var AjaxCall = Storm.AjaxCall = function(callObj, extensionObj, options) {
	this._id = _uniqId('AjaxCall');
	this._call = this.configure(callObj, extensionObj, options);
	this.data = null;
};

_.extend(AjaxCall, {
	CLASSIFICATION: _CLASSIFICATION,

	/**
	 * Add a classification type to the AjaxCall
	 * as a global option
	 * @param {String || Array} type
	 */
	addClassification: function(type) {
		if (_.isArray(type)) {
			var idx = 0, length = type.length;
			for (; idx < length; idx++) {
				_addClassification(type[idx]);
			}
		} else {
			_addClassification(type[idx]);				
		}
	}
});


AjaxCall.prototype = {
	constructor: AjaxCall,

	defaults: {
		name: '',
		type: 'GET',
		content: 'application/json; charset=utf-8',
		url: '',
		cache: false,
		/**
		 * The classification of this call.
		 * @type {Number} classification id
		 * @default nonblocking
		 */
		classification: _CLASSIFICATION.nonblocking
	},

	/**
	 * Configure the call object so that it's ready to ajax
	 * @param  {Object} providedCall Call object
	 * @param  {Object} extension    Addition (manual) configurations for the url
	 * @param  {Object} opts         Options from the calling context to merge into the url
	 * @return {Object} call
	 */
	configure: function(providedCall, extension, opts) {
		// TODO: Fix
		var call = _.extend({}, this.defaults, DataContext.callTemplate, providedCall);

		var url = call.url;
		url = this._urlMerger(url, _.extend({}, DataContext.settings, opts, extension));
		call.url = url;
		call._id = this._id;

		return call;
	},

	/**
	 * Returns the call object
	 * @return {Object}
	 */
	getConfiguration: function() {
		return this._call;
	},

	/**
	 * Get the private id of the AjaxCall
	 * @return {Number} id
	 */
	getId: function() {
		return this._id;
	},

	/**
	 * Determine if the type passed is the same as this
	 * call's configuration
	 * @param  {String}  type GET, POST, PUT, DELETE 
	 * @return {Boolean}
	 */
	isType: function(type) {
		return (type.toUpperCase() === this._call.type.toUpperCase());
	},

	/**
	 * Determine if the classification passed is the same as this
	 * call's classification
	 * @param  {Number}  Storm.AjaxCall.CLASSIFICATION
	 * @return {Boolean}
	 */
	isClassification: function(type) {
		return (type === this._call.classification);
	},

	// Get | Set --------------------------------------------
	/**
	 * Gets a property on the call configuration
	 * @param  {String} key    the key to get from the configuration
	 * @return {Value}
	 */
	get: function(key) {
		return this.call[key];
	},
	
	/**
	 * Sets a property on the call configuration
	 * @param  {String} key    the key to replace in the configuration
	 * @param  {Value}  value  the value to apply
	 * @return {this}
	 */
	set: function(key, value) {
		this.call[key] = value;
		return this;
	},

	// Send ------------------------------------------------
	/**
	 * Uses Storm.ajax to ajax the stored call object
	 * @param  {Storm.Promise} promise optional
	 * @return {Storm.ajax} request
	 */
	send: function(promise) {
		var self = this,
			call = this.call;

		var request = this.request = STORM.ajax.ajax({
			type: call.type,
			url: call.url,
			contentType: call.content,
			data: call.data || this.data,
			cache: call.cache,
			success: function(data) {
				if (promise) { promise.resolve(data); }
				self.success.apply(self, arguments);
				Request.done(self);
			},
			error: function(req, status, err) {
				if (promise) { promise.reject(req); }

				// Abort
				if (req.status === 0) {
					Request.abort(req, status, err, self);
					return;
				}

				// Fail
				self.error.apply(self, arguments);
				Request.fail(self);
			},
			complete: function() {
				if (promise) { promise.resolve(data); }
				self.complete.apply(self, arguments);
				Request.always(self);
			}
		});

		// Record the call
		Request.send(this);

		return request;
	},

	/**
	 * Fired when an xhr request is successful
	 * Feel free to overwrite
	 * @param  {Object||String||null} data
	 */
	success: function(data) {},
	
	/**
	 * Fired when an xhr request completes.
	 * Feel free to overwrite
	 */
	error: function(req, status, err) {},

	/**
	 * Fired when an xhr request completes.
	 * Feel free to overwrite
	 */
	complete: function() {},

	/**
	 * Aborts the current request
	 * @return {AjaxCall}
	 */
	abort: function() {
		if (this.request) {
			this.request.abort();
			this.request = null;
		}
		return this;
	},

	toString: function() {
		return '['+ Storm.name +' AjaxCall, id: '+ this._id +']';
	}
};