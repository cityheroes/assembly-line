// assembly-line
// ----------------------------------
// v1.0.0
//
// Copyright (c)2017 Mauro Trigo, CityHeroes.
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
		inputDateFormat: 'YYYY-MM-DD HH:mm:ss',
		displayDateFormat: 'L', // Formats suited for moment.js: http://momentjs.com/docs/#/displaying/format/
		displayTimeFormat: 'HH:mm:ss',
		displayDatetimeFormat: 'L HH:mm:ss',
		outputLocalTime: true,
		overturnParentAttributeName: 'vlmParent'
	};
	
	var AssemblyLine = function(options) {
		this.settings = options || {};
		_.defaults(this.settings, assemblyLineDefaults);
	};
	
	AssemblyLine.prototype.setOption = function(optionName, value) {
		this.settings[optionName] = value;
	};
	
	// These methods must *not* be configurable externally
	var overturnMethods = {
		append: function(itemToOverturn, overturnedParent, parentAttributeName) {
			itemToOverturn[parentAttributeName] = overturnedParent;
			return itemToOverturn;
		},
		merge: function(itemToOverturn, overturnedParent, parentAttributeName) {
			var prefixedObject = _.chain(overturnedParent)
				.keys()
				.reduce(function(reducedObject, key) {
					reducedObject[parentAttributeName+key] = overturnedParent[key];
					return reducedObject;
				}, {}).value();
			return _.extend({}, itemToOverturn, prefixedObject);
		}
	};
	
	AssemblyLine.getIt = getIt;
	
	AssemblyLine.prototype._process = function(dataCollection, processes){
		// Apply filters
		if (processes.filters && processes.filters.length > 0) {
			dataCollection = this._applyFilters(processes.filters, dataCollection);
		}
	
		// Apply overturn
		if (processes.overturn) {
			dataCollection = this._applyOverturn(processes.overturn, dataCollection);
		}
	
		// Apply transformations
		if (processes.transformations && processes.transformations.length > 0) {
			dataCollection = this._applyTransformations(processes.transformations, dataCollection);
		}
	
		// Apply added transformations
		if (processes.addedTransformations && processes.addedTransformations.length > 0) {
			dataCollection = this._applyAddedTransformations(processes.addedTransformations, dataCollection);
		}
	
		// Apply aggregations
		if (processes.aggregations && processes.aggregations.length > 0) {
			dataCollection = _.map(processes.aggregations, this._applyAggregation, { dataCollection: dataCollection });
		}
	
		// Apply transposition
		if (processes.transposition && processes.transposition.pivot) {
			dataCollection = this._applyTransposition(processes.transposition, dataCollection);
		}
	
		return dataCollection;
	};
	
	AssemblyLine.prototype.process = function(dataCollection, processes) {
	
		if (!_.isArray(dataCollection)) {
			dataCollection = [dataCollection];
		}
	
		processes = processes || {};
	
		if (_.isArray(processes)) {
			var that = this;
			_.each(processes, function (procedures) {
				dataCollection = that._process(dataCollection, procedures);
			});
		} else {
			dataCollection = this._process(dataCollection, processes);
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
	
	AssemblyLine.prototype._applyAddedTransformations = function(addedTransformations, dataCollection) {
	
		var that = this;
	
		var transformedCollection = _.map(dataCollection, function(dataItem) {
			var transformedItem = dataItem;
	
			_.each(addedTransformations, function(transformation) {
				transformedItem[transformation.name] = that._applyTransformation(transformation, dataItem);
			});
	
			return transformedItem;
		});
	
		return transformedCollection;
	};
	
	/**
	 * Receives a collection of objects A containing
	 * an attribute X with an object or an array of objects B
	 * and returns a collection of objects B, each one of
	 * them containing a copy of the object A as an 'vlmParent' attribute.
	 * This attribute name can also be specified within the options.
	 */
	AssemblyLine.prototype._applyOverturn = function(options, dataCollection) {
	
		var transformedCollection = dataCollection;
	
		var that = this;
	
		_.map(Array.isArray(options)? options: [options], function(optionItem) {
	
			if (!optionItem.pivot) {
				console.error('An pivot must be specified in order to apply overturn operation');
				return;
			}
	
			var overturnPivotAttribute = optionItem.pivot;
			var mode = optionItem.mode || that.settings.overturnMode;
			var parentAttributeName =
				(mode == 'merge' && optionItem.parentAttributeName === '') ?
					'' :
					(optionItem.parentAttributeName || that.settings.overturnParentAttributeName)
			;
			var modeFunction = overturnMethods[mode];
	
			transformedCollection = _.reduce(transformedCollection, function(reducedItems, item) {
	
				var overturnedParent = _.omit(item, overturnPivotAttribute);
	
				if (Array.isArray(item[overturnPivotAttribute])) {
					var overturnedList = _.map(item[overturnPivotAttribute], function(itemToOverturn) {
						return modeFunction(itemToOverturn, overturnedParent, parentAttributeName);
					});
	
					reducedItems = reducedItems.concat(overturnedList);
				} else if (item[overturnPivotAttribute]) {
					var overturnedItem = item[overturnPivotAttribute];
					reducedItems.push(modeFunction(overturnedItem, overturnedParent, parentAttributeName));
				}
	
				return reducedItems;
			}, []);
		});
	
		return transformedCollection;
	};
	
	AssemblyLine.prototype._parseDatetime = function(dateTime) {
		var partial = moment.utc(dateTime, this.settings.inputDateFormat);
		if (this.settings.outputLocalTime) {
			partial.local();
		}
		return partial;
	};
	
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
					result = this._parseDatetime(result).format(this.settings.displayDateFormat);
				}
				break;
	
			case 'time':
				if (result !== this.settings.defaultValue) {
					result = this._parseDatetime(result).format(this.settings.displayTimeFormat);
				}
				break;
	
			case 'datetime':
				if (result !== this.settings.defaultValue) {
					result = this._parseDatetime(result).format(this.settings.displayDatetimeFormat);
				}
				break;
	
			case 'timey':
				result = this.settings.timey ? result.substring(0, 13) + ':00:00' : result.substring(0, 10);
				result = this._parseDatetime(result).format(this.settings.inputDateFormat);
				break;
	
			case 'pick':
				result = _.map(transformation.params, function(property) {
					return getIt(dataItem, property);
				});
				break;
	
			case 'sum':
				// Select parameters
				result = _.reduce(transformation.params, function (memo, param) {
					var value = getIt(dataItem, param) || 0;
					return memo + value;
				}, 0);
				break;
	
			case 'exclusiveSum':
	
				result = _.reduce(_.values(_.omit(dataItem, transformation.params)), function (memo, val) {
					val = Number(val);
					return memo + val;
				}, 0);
				break;
	
			case 'lowercase':
				if (result !== this.settings.defaultValue && typeof result === 'string') {
					result = result.toLocaleLowerCase();
				}
				break;
	
			case 'upercase':
				if (result !== this.settings.defaultValue && typeof result === 'string') {
					result = result.toLocaleUpperCase();
				}
				break;
	
			case 'decimal':
				if (result !== this.settings.defaultValue) {
					var decimalSteps = transformation.params && typeof transformation.params[0] !== 'undefined' ? parseInt(transformation.params[0]) : 2;
					result = parseFloat(result).toFixed(decimalSteps);
				}
				break;
	
			default:
				return result;
		}
	
		return result;
	};
	
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
	
	AssemblyLine.prototype._applyTransposition = function(transposition, dataCollection) {
	
		var pivot = transposition.pivot;
		var pivotName = transposition.name;
	
		var transformedCollection = _.map(dataCollection, function(dataItem) {
	
			var transformedItem = [
				_.flatten(
					_.pairs(
						_.pick(dataItem, pivot)
					)
				),
				_.pairs(
					_.omit(dataItem, pivot)
				)
			];
	
			return transformedItem;
		});
	
		transformedCollection = _.zip.apply(this, transformedCollection);
	
		// Normalization to avoid numeral keys is not possible at this point due to _.object behaviour
		// Update pivot column title
		var pivotCol = _.map(transformedCollection[0], function(dataItem) {
			return [pivotName, dataItem[1]];
		});
	
	
	
		transformedCollection = _.zip.apply(this, transformedCollection[1]);
	
		transformedCollection = _.map(transformedCollection, function(dataItem) {
	
			var transformedItem = _.zip(pivotCol, dataItem);
	
			transformedItem = _.map(transformedItem, function(partDataItem) {
				return _.object(_.zip.apply(this, partDataItem));
			});
	
			var extendArgs = [{}];
	
			extendArgs = extendArgs.concat(transformedItem);
	
			return _.extend.apply(this, extendArgs);
		});
	
		return transformedCollection;
	};

	return AssemblyLine;

}));
