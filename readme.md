# AssemblyLine

AssemblyLine can help you filter, transform and aggregate collections of JSON objects in a declarative and sexy way. I created it because at [CityHeroes](http://cityhero.es/) we needed a way to **process the results of RESTful APIs** to create custom **charts and tables**.

Of course you could use *underscore* or any other library to code these transformations (which I did at first), but AssemblyLine can save you time by "programming" these processes **by configuration** rather than by coding.

### So, what does it do?

You can checkout the [demo page](http://cityheroes.github.io/demo/) or read the explanation below.

Given the following collection:

```
var books = [
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
```

Get all the books whose authors belong to the 'Tolkien Society':

```
var assemblyLine = new AssemblyLine();

var bookProcesses = {
	filters: [
		{
			path: 'author.organization.name',
			match: 'Tolkien Society'
		}
	]
};

var filteredBooks = assemblyLine.process(books, bookProcesses);

```

The result:

```
[
	{
		"id": 123,
		"name": "Lord Of The Rings",
		"author": {
			"id": 321,
			"name": "J.R.R. Tolkien",
			"organization": {
				"id": 574,
				"name": "Tolkien Society"
			}
		},
		"created": "1954-07-29 09:12:12"
	},
	{
		"id": 456,
		"name": "The History of The Lord of the Rings",
		"author": {
			"id": 654,
			"name": "Christopher Tolkien",
			"organization": {
				"id": 574,
				"name": "Tolkien Society"
			}
		},
		"created": "2001-09-01 11:48:21"
	}
]
```

Now let's get only the name of these books and their authors:

```
var summaryProcesses = {
	filters: [
		{
			path: 'author.organization.name',
			match: 'Tolkien Society'
		}
	],
	transformations: [
		{
			name: 'book_name',
			path: 'name'
		},
		{
			name: 'author_name',
			path: 'author.name'
		}
	]
};

var filteredAndSummarizedBooks = assemblyLine.process(books, summaryProcesses);

```

The result:

```
[
	{
		"book_name": "Lord Of The Rings",
		"author_name": "J.R.R. Tolkien"
	},
	{
		"book_name": "The History of The Lord of the Rings",
		"author_name": "Christopher Tolkien"
	}
]
```

Now let's count these results:

```
var summaryProcesses = {
	filters: [
		{
			path: 'author.organization.name',
			match: 'Tolkien Society'
		}
	],
	transformations: [
		{
			name: 'book_name',
			path: 'name'
		},
		{
			name: 'author_name',
			path: 'author.name'
		}
	],
	aggregations: [
		{
			path: 'book_name',
			type: 'count'
		}
	]
};

var filteredSummarizedAndCountedBooks = assemblyLine.process(books, summaryProcesses);

```

The result:

```
[
	2
]
```

## Installation

Install with **bower**:

```
bower install --save assembly-line
```

or download directly.

AssemblyLine depends on **[Underscore.js](http://underscorejs.org/)** and **[Moment.js](http://momentjs.com/)**, so don't forget to include them before.

And then include the **assembly-line.js** file located at the *lib* directory (there's a minified version as well):

```
<script src="bower_components/underscore/underscore.js"></script>
<script src="bower_components/moment/moment.js"></script>
<script src="bower_components/assembly-line/lib/assembly-line.js"></script>
```

You can use it with Node or as a CommonJS module as well (such as RequireJS).

## Usage

AssemblyLine.

```
var assemblyLineOptions = {};
var assemblyLine = new AssemblyLine(assemblyLineOptions);

// The AssemblyLine process method always takes 2 parameters: a dataCollection array and a steps object.
var filteredBooks = assemblyLine.process(dataCollection, steps);
```

### Options:

##### defaultValue (string)

Value to show when a path is not found. Defaults to an empty string;

##### timey (boolean)

Allow for minutes and seconds to be removed from datetime values. Defaults to *false*.

##### displayDateFormat (string)

Defaults to 'DD/MM/YYYY'.

##### displayTimeFormat (string)

Defaults to 'HH:mm:ss'.

##### displayDatetimeFormat (string)

Defaults to 'DD/MM/YYYY HH:mm:ss'.

**Important:** Date and time formats should be set according to the [moment.js format specification](http://momentjs.com/docs/#/displaying/format/).

### Steps:

Specify what you want to do with the dataCollection with a **steps object**. Every step will be applied to the dataCollection **sequentially**.

```
var steps = {
	filters: [],
	transformations: [],
	aggregations: []
}
```

#### Filters

```
filters: [
	{
		path: 'author.organization.name',
		match: 'Tolkien Society'
	}
]
```

#### Transformations

```
transformations: [
	{
		name: 'book_name',
		path: 'name'
	},
	{
		name: 'author_name',
		path: 'author.name'
	}
]
```

#### Aggregations

```
aggregations: [
	{
		path: 'book_name',
		type: 'count'
	}
]
```

----

### To Do:

- Register NPM
- Complete documentation.
- Create and setup unit tests.
- Add aggregation options.
- Add filter options.
- Add recursive processing?