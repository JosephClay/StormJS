/**
 * StormJS
 * A Backbone-inspired, large-scale javascript framework.
 * Notable differences: 
 *  - A klass-like extend system for OOP - no more 'initialize'
 *    functions! (unless you want them)
 *  - no jQuery dependancy, provide your own Storm.ajax method or
 *    a compatible library like Xaja. Overwrite (or avoid completely)
 *    Storm.$. (Both Storm.ajax and Storm.$ default to jQuery if available)
 *  - More native events with a faster, more expressive event system
 *  - less opinionated about the server and server communication.
 *    Models and Collections aren't pre-defined with save, sync, destroy
 *    methods and DataContexts and AjaxCalls are provided to allow
 *    server communication to be defined in an Object-Oriented fashion
 *    decoupled from the model and in a centralized location 
 *  - Models provide greater protection of your data by default by 
 *    creating and storing reference-free objects
 *  - Polyfilled animation frame with easy-to-use functions to hook
 *    into and remove functions from the heartbeat of your application
 *  - Lightweight Promise system
 *  - Flexible, in-memory, key-value cache
 *  - Template registrar for client-side templates with lazy-evaulation
 *  - localStorage polyfill (with cookie fallback)
 *  - Global ajax request tracking through Storm.request
 *  - Faster sorting via cached values through Storm.Comparator
 *  - A dedicated, extensible "Module" class for separation-of-concerns
 *  - A focus on speed to keep your front-end snappy! 
 */
(function(root, _, Signal, undefined) {
	// "root" is a safe reference to the environment.
	// setup so that this can be used in a node environment