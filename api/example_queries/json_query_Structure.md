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
## 3. Aggregation part
- Here, all the aggregation specifics are described
### 3.1 group by
- contains on columns based on which the result is to be grouped by.
### 3.2 order by
- contains the list of ordering entries
- each ordering entry consists of:
	- **column** - specifies based on which column should the results be ordered by
	- **direction** - specifies whether the results are to be ordered ascending or descending
```json
{
	"target_databases": ...,
	"description": ...,
	"aggregation": {
		"group_by":["person.sex"]
		"order_by": [
			{
				"column":"avg_tokens",
				"direction":"DESC"
			}
		]
	},
	...
}
```
## 4. Filtering part
- Here all the desired filtering of the result is described
### 4.1 columns
- list of columns that are to be selecte from the aggregated table
- also stuff like SUM, AVG, ETC is present here
### 4.2 conditions
- list of conditions to be applied on selected columns
- each condition entry consists of:
	- **column** - specification of the column which condition uses
	- **operator** - operator of the condition
	- **value** - value which the column is being compared to in the condition
### 4.3 limit
- A single number describing how many rows are to be fetched
	```json
	{
		"target_databases": ...,
		"description": ...,
		"aggregation": {
			...
		},
		"filtering": {
			"columns": ["person.sex", "AVG(speech.token_count) AS avg_tokens"],
			"conditions": [
				{
					"column":"person.sex"
					"operator":"="
					"value":"'F'"
				}
			],
			"limit":"5"
		}
	}
	```