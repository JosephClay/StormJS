// Request ##########################################################################

/**
 * @const
 * @type {string}
 * @private
 */
var _REQUEST = 'request',

	/**
	 * Stores in-progress AjaxCalls by id
	 * @type {Object}
	 * @private
	 */
	_requestsRecords = {},

	/**
	 * Private AjaxCall tracker. Only gets called from AjaxCall
	 * when the state of the call changes
	 * @private
	 */
	Request = {

		/**
		 * Called when an AjaxCall is sent, notifies Storm.request
		 * Records the call in the records
		 * @param  {Storm.AjaxCall} call
		 */
		send: function(call) {
			// this call is already being tracked, stop
			if (_requestsRecords[call.getId()]) { return; }
			_requestsRecords[call.getId()] = call;

			Storm.request.trigger('send', call);
		},

		/**
		 * Called when an AjaxCall is done, notifies Storm.request
		 * @param  {Storm.AjaxCall}   call
		 */
		done: function(call) {
			Storm.request.trigger('done', call);
		},

		/**
		 * Called when an AjaxCall fails, notifies Storm.request
		 * @param  {Storm.AjaxCall}   call
		 */
		fail: function(call) {
			Storm.request.trigger('fail', call);
		},

		/**
		 * Called when an AjaxCall is aborted, notifies Storm.request
		 * @param  {Storm.AjaxCall}   call
		 */
		abort: function(call) {
			Storm.request.trigger('abort', call);
		},

		/**
		 * Called when an AjaxCall is done/aborted/failed, notifies Storm.request
		 * Removes the call from the records
		 * @param  {Storm.AjaxCall}   call
		 */
		always: function(call) {
			// This call is not being tracked, stop
			if (!_requestsRecords[call.getId()]) { return; }
			delete _requestsRecords[call.getId()];

			Storm.request.trigger('always', call);
		}
	};

/**
 * Ajax tracking mechanism. Operates via events
 * passing the AjaxCalls that trigger the events.
 *
 * Possible events are: 'send', done', 'fail', 'abort', 'always'
 * 
 * @namespace Storm.request
 */
Storm.request = Events.construct();
_.extend(Storm.request, /** @lends Storm.request# */ {

	/**
	 * Get the requests in-progress.
	 * @function Storm.request.getQueue
	 * @return {Object}
	 */
	getQueue: function() {
		return _requestsRecords;
	},

	/**
	 * Get the total number of requests in-progress.
	 * @function Storm.request.getTotal
	 * @return {Number}
	 */
	getTotal: function() {
		return _.size(_requestsRecords);
	},

	/**
	 * Debug string
	 * @function Storm.request.toString
	 * @return {String}
	 */
	toString: function() {
		return _toString(_REQUEST);
	}
});
