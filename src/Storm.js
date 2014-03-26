// Hold on to previous Storm reference (can release with noConflict)
var previousStorm = root.Storm,
	// Define Storm
	Storm = root.Storm = {
		name: 'StormJS',
		VERSION: '0.0.1',
		ajax: root.$ || { ajax: function() { console.error(_errorMessage('Storm.ajax', 'NYI')); } },
		$: root.$ || function() { console.error(_errorMessage('Storm.$', 'NYI')); }
	};
