// Ajax Call ########################################################################

	/**
	 * The name of the class
	 * @type {String}
	 * @private
	 */
var _AJAX_CALL = 'AjaxCall',
	/**
	 * Available classifications for a call to reside in.
	 * Gives flexibility to a call to be in a classification
	 * that gives it meaning to the application and not the
	 * server 
	 * @type {Object[Number]}
	 */
	_CLASSIFICATION = {
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
 * @class AjaxCall
 * @param {Object} callObj
 * @param {Object} opts
 * @param {Object} callTemplate
 */
var AjaxCall = Storm.AjaxCall = function(callObj, opts, callTemplate) {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_AJAX_CALL);

	/**
	 * The call object that will be sent to Storm.ajax
	 * @type {Object}
	 * @private
	 */
	this._call = this._configure(callObj, opts, callTemplate);
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
			_addClassification(type);
		}
	}
});

AjaxCall.prototype = {
	/** @constructor */
	constructor: AjaxCall,

	/**
	 * Defaults
	 * @type {Object}
	 */
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
	 * @param  {Object} providedCall call object
	 * @param  {Object} opts      configurations for the url
	 * @return {Object} call
	 * @private
	 */
	_configure: function(providedCall, opts, callTemplate) {
		var call = _.extend({}, this.defaults, callTemplate, providedCall);

		call.url = _stringFormat(call.url, opts);

		return call;
	},

	/**
	 * Get or set the data on the call. Passing a parameter
	 * will set the data where-as no parameters will return
	 * the data on the call
	 * @param  {Value || undefined} data
	 * @return {Value || AjaxCall}
	 */
	data: function(data) {
		if (!arguments.length) { return this._call.data; }
		
		this._call.data = data;
		return this;
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
	 * @return {AjaxCall}
	 */
	set: function(key, value) {
		this.call[key] = value;
		return this;
	},

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
			data: call.data,
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

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString(_AJAX_CALL, {
			id: this._id,
			call: JSON.stringify(this._call)
		});
	}
};