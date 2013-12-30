// Data Context #####################################################################

/**
 * Used to construct AjaxCalls to communicate with the server.
 * Intended to be a central location for configuration data
 * to get and send data about a specific model/collection type
 * @class DataContext
 */
var DataContext = Storm.DataContext = function() {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId('DataContext');
};

/**
 * Default settings for the DataContext,
 * where we are is usually useful
 * @type {Object}
 */
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

/**
 * Add settings to the global DataContext.settings
 * object. Basically a protected _.extend
 * @param {Object} settings
 * @return {Object} DataContext.settings
 */
DataContext.addSettings = function(settings) {
	return _.extend(DataContext.setting, settings);
};

DataContext.prototype = {
	/** @constructor */
	constructor: DataContext,

	/**
	 * AjaxCall, the constructor of the AjaxCall
	 * to use when configuring a new call object
	 * @type {AjaxCall}
	 */
	AjaxCall: AjaxCall,

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

	getSetting: function() { 
		return DataContext.getSetting.apply(arguments);
	},
	removeSetting: function() { 
		return DataContext.removeSetting.apply(arguments);
	},

	/**
	 * Add more options to this data context
	 * @param  {Object} options
	 * @return {DataContext}
	 */
	extendOptions: function(opts) {
		this.options = _.extend({}, this.defaults, opts);
		return this;
	},

	/**
	 * Remove an option from this data context
	 * @param  {String} key
	 * @return {DataContext}
	 */
	removeOption: function(key) {
		delete this.options[key];
		return this;
	},

	/**
	 * Creates and returns a new AjaxCall
	 * @param  {Object}      call   see AjaxCall.defaults
	 * @param  {Object}      extensionData  Addition configurations for the url
	 * @return {AjaxCall}
	 */
	createCall: function(call, extensionData) {
		var configuration = _.extend({}, DataContext.settings, this.options, extensionData);
		return new this.AjaxCall(call, configuration, this.callTemplate);
	},

	/**
	 * Debug string
	 * @return {String}
	 */
	toString: function() {
		return _toString('DataContext', {
			id: this._id
		});
	}
};
