# JSON query structure description
- Query json file consists of 4 parts
## 1. Description part
- Contains a sentence in natural language describing the purpose of the query.
## 2. Aggregation part
- Here, all the aggregation specifics are described
### 2.1 right joins
- List of right joins to the `person` table.
- Each join has one `table` key which specifies which table should be joined.
### 2.2 left joins
- List of left joins to the `person` table.
- Each join has on `table` key which specifies which table should be joined.
### 2.3 group by
- contains on columns based on which the result is to be grouped by.
### 2.4 order by
- contains the list of ordering entries
- each ordering entry consists of:
	- **column** - specifies based on which column should the results be ordered by
	- **direction** - specifies whether the results are to be ordered ascending or descending
## 3. Filtering part
- Here all the desired filtering of the result is described
### 3.1 columns
- list of columns that are to be selecte from the aggregated table
- also stuff like SUM, AVG, ETC is present here
### 3.2 conditions
- list of conditions to be applied on selected columns
- each condition entry consists of:
	- **column** - specification of the column which condition uses
	- **operator** - operator of the condition
	- **value** - value which the column is being compared to in the condition
### 3.3 limit
- A single number describing how many rows are to be fetched
