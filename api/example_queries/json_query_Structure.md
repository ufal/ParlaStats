# JSON query structure description
- Query json file consists of 4 parts
## 1. Target databases part
- Contains the list of databases, which this query should be forwarded to.
	```json
	{
		"target_databases":["databaseLV", "databaseCS"],
		...
	}	
	```
## 2. Description part
- Contains a sentence in natural language describing the purpose of the query.
	```json
	{
		"target_databases": ...
		"description":"Average tokens per speech by female speakers.",
		...
	}
	```
## 3. Steps part
- Here all the necessary query steps are described in the form of a list.
	```json
	{
		"target_databases": ...,
		"description": ...
		"steps": [
			...
		]
	}
	```
- Each step then consists of 3 parts: **Goal**, **Aggregation** and **Filtering**. 
	```json
	{
		...
		"steps": [
			{
				"goal":...,
				"aggregation": {
					...
				},
				"filtering": {
					...	
				}
			},
			{
				"goal":...,
				"aggregation": {
					...
				},
				"filtering": {
					...	
				}
			}, 
			...
		]
	}
	```
- ### 3.1 Goal part
	- Here, the purpose of a step is specified.
	- The goal can be anything, but the main part of the query should have the goal set to `'main'`.
	- The name of non-main goal is then used to reference the results of the step in some other step(s) (see filtering section).
		```json
		{
			...
			"steps": [
				{
					"goal":'helper',
					"aggregation": {
						...
					},
					"filtering": {
						...	
					}
				},
				{
					"goal":'main',
					"aggregation": {
						...
					},
					"filtering": {
						...	
					}
				}, 
				...
			]
		}
		```
- ### 3.2 Aggregation
	- Here all the aggregation required is described.
	```json
	...
	{
		"goal":...,
		"aggregation": {
			"group_by":...,
			"order_by":...
		},
		"filtering": {
			...
		}
	}
	...
	```
	- #### 3.2.1 group by
		- contains columns based on which the result is to be grouped by.
			```json
			...
			{
				"goal":...,
				"aggregation": {
					"group_by":['column_1', 'column_2', ...],
					"order_by":...
				},
				"filtering": {
					...
				}
			}
			...
			```
	- #### 3.2.2 order by
		- contains the list of ordering entries
		- each ordering entry consists of:
		- **column** - specifies based on which column should the results be ordered by
		- **direction** - specifies whether the results are to be ordered ascending or descending
			```json
			...
			{
				"goal":...,
				"aggregation": {
					"group_by":...,
					"order_by": [
						{
							"column":'column_1',
							"direction":'DESC'
						}	
					]
				},
				"filtering": {
					...
				}
			}
			...		
			```
- ### 3.3 Filtering part
	- Here all the desired filtering of the result is described
	```json
	...
	{
	 	"goal":...,
	 	"aggregation": {
			...
		},
		"filtering": {
			"columns":...,
			"conditions": [
				...
			],
			"limit":...
		}	
	}
	...
	```
	- #### 3.3.1 columns
		- list of columns that are to be selected from the aggregated table
		- also stuff like SUM, AVG, ETC is present here
			```json
			...
			{
				"goal":...,
				"aggregation": {
					...
				},
				"filtering": {
					"columns":['column_1', 'SUM(column_2) AS alias_1'],
					"conditions": [
						...
					],
					"limit":...
				}
			}
			...
			```
	- #### 3.3.2 conditions
		- list of conditions to be applied on selected columns
		- each condition entry consists of:
		- **column** - specification of the column which condition uses
		- **operator** - operator of the condition
		- **value** - value which the column is being compared to in the condition
		- if you wish to use results of some previous step as value in the condition, you can do it like in the example below
			```json
			...
			{
				"goal":...,
				"aggregation": {
					...
				},
				"filtering": {
					"columns":...,
					"conditions":[
						{
							"column":'column_1',
							"operator":'=',
							"value":'value_1'
						},
						{
							"column":'column_2',
							"operator":' IN ',
							"value":'step_result.<step.goal>.<desired_column>'
						}
					],
					"limit":...
				}
			}
			...
			```
	- #### 3.3.3 limit
		- A single number describing how many rows are to be fetched
			```json
			...
			{
				"goal":...,
				"aggregation": {
					...
				},
				"filtering": {
					"columns":...,
					"conditions": [
						...
					],
					"limit":'10'
				}
			}
			...
			```
- There are example queries available <a href="https://github.com/ufal/ParlaStats/tree/main/api/example_queries/queries">here</a> which you can run yourself, along with their respective results which you can find <a href="https://github.com/ufal/ParlaStats/tree/main/api/example_queries/results">here</a>.