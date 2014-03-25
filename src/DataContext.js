// Data Context #####################################################################

/**
 * The name of the class
 * @const
 * @type {String}
 * @private
 */
var _DATA_CONTEXT = 'DataContext';

/**
 * Used to construct AjaxCalls to communicate with the server.
 * Intended to be a central location for configuration data
 * to get and send data about a specific model/collection type
 * @class Storm.DataContext
 */
var DataContext = Storm.DataContext = function() {
	/**
	 * @type {Id}
	 * @private
	 */
	this._id = _uniqId(_DATA_CONTEXT);
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
	return _.extend(DataContext.settings, settings);
};

/**
 * Get a setting from the global DataContext.settings
 * @param {String} setting
 * @return {*} value
 */
DataContext.getSetting = function(setting) {
	return DataContext.settings[setting];
};

DataContext.prototype = /** @lends Storm.DataContext.prototype */ {
	constructor: DataContext,

	/**
	 * AjaxCall, the constructor of the AjaxCall
	 * to use when configuring a new call object
	 * @type {Storm.AjaxCall}
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
	 * @param  {Object} opts
	 * @return {Storm.DataContext}
	 */
	extendOptions: function(opts) {
		this.options = _.extend({}, this.defaults, opts);
		return this;
	},

	/**
	 * Remove an option from this data context
	 * @param  {String} key
	 * @return {Storm.DataContext}
	 */
	removeOption: function(key) {
		delete this.options[key];
		return this;
	},

	/**
	 * Creates and returns a new AjaxCall
	 * @param  {Object}      call   see AjaxCall.defaults
	 * @param  {Object}      extensionData  Addition configurations for the url
	 * @return {Storm.AjaxCall}
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
		return _toString(_DATA_CONTEXT, {
			id: this._id
		});
	}
};
