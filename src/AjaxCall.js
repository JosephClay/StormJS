/* Data Context =====================================================================
===================================================================================== */

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
		this._id = _uniqueId('AjaxCall');
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

			var request = this.request = $.ajax({
				type: call.type,
				url: call.url,
				contentType: call.content,
				data: call.data || this.data,
				cache: call.cache,
				success: function(data) {
					data = _exists(data) ? (data.d || data) : null;
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