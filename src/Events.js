// Events ###########################################################################

/**
 * Proxy to Signal.
 * @class Storm.Events
 * @see {@link https://github.com/JosephClay/Signal Signal}
 */
var Events = Storm.Events = Signal.core;

/**
 * Instantiate and merge a new Event system
 * into Storm so that Storm can be used as
 * a pub/sub
 */
_.extend(Storm, Events.construct());
