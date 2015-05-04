(function(root, factory) {
	'use strict';

	if (typeof define === 'function' && define.amd) {
		define(['underscore', 'moment'], function(_, moment) {
			return (root.AssemblyLine = factory(root, _, moment));
		});
	} else if (typeof exports !== 'undefined') {
		var _ = require('underscore');
		var moment = require('moment');
		module.exports = factory(root, _, moment);
	} else {
		root.AssemblyLine = factory(root, root._, root.moment);
	}

}(this, function(root, _, moment) {
	'use strict';

	// @include ../assembly-line.js

	return AssemblyLine;

}));
