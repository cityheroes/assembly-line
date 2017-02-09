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
	outputLocalTime: true
};

var AssemblyLine = function(options) {
	this.settings = options || {};
	_.defaults(this.settings, assemblyLineDefaults);
};

AssemblyLine.getIt = getIt;

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

	// Apply transposition
	if (processes.transposition && processes.transposition.pivot) {
		dataCollection = this._applyTransposition(processes.transposition, dataCollection);
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

	transformedCollection = _.map(transformedCollection, function(dataItem) {
		
		var transformedItem = _.zip(pivotCol, dataItem);
		
		transformedItem = _.map(transformedItem, function(partDataItem) {
			return _.object(_.zip.apply(this, partDataItem));
		});

		return _.extend({}, transformedItem[0], transformedItem[1]);
	});
	
	return transformedCollection;
};