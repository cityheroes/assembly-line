// assembly-line
// ----------------------------------
// v0.0.2
//
// Copyright (c)2015 Mauro Trigo, CityHeroes.
// Distributed under MIT license

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

	var getIt = function(obj, property) {
		return property.split('.').reduce(function (obj, i) {
			return obj ? obj[i] : null;
		}, obj);
	};
	
	var assemblyLineDefaults = {
		defaultValue: '', // Value to show when a path is not found.
		timey: false, // Allow for minutes and seconds to be removed from datetime values.
		displayDateFormat: 'DD/MM/YYYY', // Formats suited for moment.js: http://momentjs.com/docs/#/displaying/format/
		displayTimeFormat: 'HH:mm:ss',
		displayDatetimeFormat: 'DD/MM/YYYY HH:mm:ss',
	};
	
	var AssemblyLine = function(options) {
		this.settings = options || {};
		_.defaults(this.settings, assemblyLineDefaults);
	};
	
	AssemblyLine.prototype.process = function(dataCollection, processes) {
	
		if (!_.isArray(dataCollection)) {
			dataCollection = [dataCollection];
		}
	
		processes = processes || {};
	
		// Apply filters
		if (processes.filters && processes.filters.length > 0) {
			dataCollection = this._applyFilters(processes.filters, dataCollection);
		}
	
		// Apply transformations
		if (processes.transformations && processes.transformations.length > 0) {
			dataCollection = this._applyTransformations(processes.transformations, dataCollection);
		}
	
		// Apply aggregations
		if (processes.aggregations && processes.aggregations.length > 0) {
			dataCollection = _.map(processes.aggregations, this._applyAggregation, { dataCollection: dataCollection });
		}
	
		return dataCollection;
	};
	
	AssemblyLine.prototype._applyFilters = function(filters, dataCollection) {
		var that = this;
		_.each(filters, function(filter) {
			dataCollection = that._applyFilter(filter, dataCollection);
		});
		return _(dataCollection).flatten();
	};
	
	// {
	// 	path: 'answer',
	// 	match: 'yes',
	// 	type: 'odd'
	// }
	
	AssemblyLine.prototype._applyFilter = function(filter, dataCollection) {
		return _.filter(dataCollection, function(dataItem) {
			var subject = getIt(dataItem, filter.path);
			if (!subject) {
				return false;
			}
			// Cast both parameters to string so that numbers as well can be compared
			return subject.toString() === filter.match.toString();
		});
	};
	
	
	AssemblyLine.prototype._applyTransformations = function(transformations, dataCollection) {
	
		var that = this;
	
		var transformedCollection = _.map(dataCollection, function(dataItem) {
			var transformedItem = {};
	
			_.each(transformations, function(transformation) {
				transformedItem[transformation.name] = that._applyTransformation(transformation, dataItem);
			});
	
			return transformedItem;
		});
	
		return transformedCollection;
	};
	
	// {
	// 	path: 'created',
	// 	transformation: 'time',
	// 	params: []
	// }
	
	AssemblyLine.prototype._applyTransformation = function(transformation, dataItem) {
	
		var result =
			typeof getIt(dataItem, transformation.path) !== 'undefined' ?
				getIt(dataItem, transformation.path) :
				this.settings.defaultValue
		;
	
		if (!transformation.operation) {
			return result;
		}
	
		switch (transformation.operation) {
	
			// String operations
	
			case 'concat':
				result = _.reduce(_.rest(transformation.params), function (memo, schemaName) {
					return memo + ' ' + getIt(dataItem, schemaName);
				}, getIt(dataItem, _.first(transformation.params)));
				break;
	
			case 'truncate':
				var length = transformation.params && transformation.params[0] ? transformation.params[0] : 100;
				result = result.substring(0, length);
				break;
	
			// Date and time cases, completely rely on moment.js
	
			case 'date':
				if (result !== this.settings.defaultValue) {
					result = moment(result, this.settings.inputDateFormat).format(this.settings.displayDateFormat);
				}
				break;
			case 'time':
				if (result !== this.settings.defaultValue) {
					result = moment(result, this.settings.inputDateFormat).format(this.settings.displayTimeFormat);
				}
				break;
			case 'datetime':
				if (result !== this.settings.defaultValue) {
					result = moment(result, this.settings.inputDateFormat).format(this.settings.displayDatetimeFormat);
				}
				break;
			case 'timey':
				result = this.settings.timey ? result.substring(0, 13) + ':00:00' : result.substring(0, 10);
				break;
			case 'pick':
				result = _.map(transformation.params, function(property) {
					return getIt(dataItem, property);
				});
				break;
			default:
				return result;
		}
	
		return result;
	};
	
	// {
	// 	path: 'answer',
	// 	type: 'count',
	// }
	
	AssemblyLine.prototype._applyAggregation = function(aggregation) {
	
		if (aggregation.explicit_value) {
			return aggregation.explicit_value;
		}
	
		var result = 0;
	
		switch (aggregation.type) {
	
			case 'count':
				result = _.size(this.dataCollection);
				break;
	
			case 'sum':
				result = _.reduce(this.dataCollection, function(memo, dataItem) {
					return getIt(dataItem, aggregation.path) + memo;
				}, 0);
				break;
	
			case 'multiply':
				result = _.reduce(this.dataCollection, function(memo, dataItem) {
					return getIt(dataItem, aggregation.path) * memo;
				}, 1);
				break;
	
		}
	
		return result;
	};
	

	return AssemblyLine;

}));
