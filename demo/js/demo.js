var assemblyLine = new AssemblyLine();

var inputData = [
	{
		id: 123,
		name: 'Lord Of The Rings',
		author: {
			id: 321,
			name: 'J.R.R. Tolkien',
			organization: {
				id: 574,
				name: 'Tolkien Society'
			}
		},
		created: '1954-07-29 09:12:12'
	},
	{
		id: 456,
		name: 'The History of The Lord of the Rings',
		author: {
			id: 654,
			name: 'Christopher Tolkien',
			organization: {
				id: 574,
				name: 'Tolkien Society'
			}
		},
		created: '2001-09-01 11:48:21'
	},
	{
		id: 789,
		name: 'The Belgariad',
		author: {
			id: 987,
			name: 'David Eddings'
		},
		created: '1982-04-21 14:21:00'
	}
];

// Initialize
var ui = {
	codeSection: $('#code_section'),
	sourceData: $('#source_data'),
	stepsData: $('#steps_data'),
	resultsData: $('#results_data'),
	filterButton: $('#filter_button'),
	transformButton: $('#transform_button'),
	aggregateButton: $('#aggregate_button'),
};

var resetHeight = function() {
	var mainContainerHeight = $('#main_container').height();
	var headerHeight = $('#main_container header').outerHeight();
	ui.codeSection.find('pre').outerHeight(mainContainerHeight - headerHeight - 16);
};

$(document).on('ready', resetHeight);

var processes = {
	filters: [
		{
			path: 'user.name',
			match: 'Mirza Waheed'
		}
	],
	transformations: [
		{
			name: 'tweet',
			path: 'text'
		},
		{
			name: 'user_name',
			path: 'user.screen_name'
		},
		{
			name: 'user_location',
			path: 'user.location'
		}
	],
	aggregations: [
		{
			path: 'id',
			type: 'count'
		}
	]
};

// Let's roll

$.getJSON('js/data.json', function(data) {
	ui.sourceData.JSONView(data);

	ui.filterButton.on('click', { dataCollection: data, process: 'filters' }, executeProcess);
	ui.transformButton.on('click', { dataCollection: data, process: 'transformations' }, executeProcess);
	ui.aggregateButton.on('click', { dataCollection: data, process: 'aggregations' }, executeProcess);
});

function executeProcess(event) {
	var steps = {};
	steps[event.data.process] = processes[event.data.process];
	ui.stepsData.JSONView(steps);
	ui.resultsData.JSONView(process(event.data.dataCollection, steps));
}

function process(data, processes) {
	return assemblyLine.process(data, processes);
}