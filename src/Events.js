// Events ###########################################################################

/**
 * Proxy to Signal. Use "Events" internally
 * so that it's easier to change to a different
 * pub/sub system if need be
 * @class  Storm.Events
 * @type {Signal}
 */
var Events = Storm.Events = Signal.core;

/**
 * Instantiate and merge a new Event system
 * into Storm so that Storm can be used as
 * a pub/sub
 */
_.extend(Storm, Events.construct());
