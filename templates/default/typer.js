var MDN_LINKS = {
	'Infinity': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Infinity',
	'NaN':      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN',
	'undefined':'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined',
	
	'null': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null',

	'Object':   'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object',
	'Function': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function',
	'Boolean':  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean',

	'Symbol':         'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol',
	'Error':          'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
	'EvalError':      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/EvalError',
	'InternalError':  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/InternalError',
	'RangeError':     'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError',
	'ReferenceError': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError',
	'StopIteration':  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/StopIteration',
	'SyntaxError':    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError',
	'TypeError':      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError',
	'URIError':       'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/URIError',

	'Number': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number',
	'Math':   'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math',
	'Date':   'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',

	'String': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
	'RegExp': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp',

	'Array':             'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array',
	'Float32Array':      'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/Float32Array',
	'Float64Array':      'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/Float64Array',
	'Int16Array':        'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/Int16Array',
	'Int32Array':        'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/Int32Array',
	'Int8Array':         'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/Int8Array',
	'Uint16Array':       'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/Uint16Array',
	'Uint32Array':       'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/Uint32Array',
	'Uint8Array':        'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/Uint8Array',
	'Uint8ClampedArray': 'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/Uint8ClampedArray',
	'ParallelArray':     'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ParallelArray',

	'Map':     'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
	'Set':     'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set',
	'WeakMap': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
	'WeakSet': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet',

	'ArrayBuffer': 'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/ArrayBuffer',
	'DataView':    'https://developer.mozilla.org/en-US/docs/JavaScript_typed_arrays/DataView',
	'JSON':        'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON',

	'Iterator':  'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator',
	'Generator': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator',
	'Promise':   'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',

	'Reflect': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect',
	'Proxy':   'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy',

	'Intl':                'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl',
	'Intl.Collator':       'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Collator',
	'Intl.DateTimeFormat': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat',
	'Intl.NumberFormat':   'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat',

	'arguments': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/arguments'
};

var TYPE_MAP = {
	'infinity': 'Infinity',
	'nan': 'NaN',
	'undefined': 'undefined',
	
	'null': 'null',

	'object': 'Object',
	'function': 'Function',
	'boolean': 'Boolean',

	'symbol': 'Symbol',
	'error': 'Error',
	'evalerror': 'EvalError',
	'internalerror': 'InternalError',
	'rangeerror': 'RangeError',
	'referenceerror': 'ReferenceError',
	'stopiteration': 'StopIteration',
	'syntaxerror': 'SyntaxError',
	'typeerror': 'TypeError',
	'urierror': 'URIError',

	'number': 'Number',
	'math': 'Math',
	'date': 'Date',

	'string': 'String',
	'regexp': 'RegExp',

	'array': 'Array',
	'float32array': 'Float32Array',
	'float64array': 'Float64Array',
	'int16array': 'Int16Array',
	'int32array': 'Int32Array',
	'int8array': 'Int8Array',
	'uint16array': 'Uint16Array',
	'uint32array': 'Uint32Array',
	'uint8array': 'Uint8Array',
	'uint8clampedarray': 'Uint8ClampedArray',
	'parallelarray': 'ParallelArray',

	'map': 'Map',
	'set': 'Set',
	'weakmap': 'WeakMap',
	'weakset': 'WeakSet',

	'arraybuffer': 'ArrayBuffer',
	'dataview': 'DataView',
	'json': 'JSON',

	'iterator': 'Iterator',
	'generator': 'Generator',
	'promise': 'Promise',

	'reflect': 'Reflect',
	'proxy': 'Proxy',

	'intl': 'Intl',
	'intl.collator': 'Intl.Collator',
	'intl.datetimeformat': 'Intl.DateTimeFormat',
	'intl.numberformat': 'Intl.NumberFormat',

	'arguments': 'arguments'
};

module.exports = {
	normalize: function(typeStr) {
		return TYPE_MAP[(typeStr || '').toLowerCase()];
	},

	mdnUrl: function(type) {
		return MDN_LINKS[type];
	}
};