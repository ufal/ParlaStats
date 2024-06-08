# JSON query structure description
- Query json file consists of 4 parts
## 1. Graph part
- Has value of either 'Y' or 'N' depending whether the results of te query are to be plotted.
## 2. Description part
- Contains a sentence in natural language describing the purpose of the query.
## 3. Aggregation part
- Here, all the aggregation specifics are described
### 3.1 tables
- list of aggregated database tables
### 3.2 joins
- list of joins performed on the above named aggregated tables
- each join entry consists of:
	- **type** - specifies the type of join
	- **right_table** - specifies the right table of the join
	- **right_column** - specifies the column of right table on which the join is performed
	- **left_table** - specifies the column of left table on which the join is performed
	- **left_column** - specifies the column of left table on which the join is performed
### 3.3 group by
- contains on columns based on which the result is to be grouped by.
### 3.4 order by
- contains the list of ordering entries
- each ordering entry consists of:
	- **column** - specifies based on which column should the results be ordered by
	- **direction** - specifies whether the results are to be ordered ascending or descending
## 4. Filtering part
- Here all the desired filtering of the result is described
### 4.1 columns
- list of columns that are to be selected from the aggregated table
- also stuff like SUM, AVG, ETC is present here
### 4.2 conditions
- list of conditions to be applied on selected columns
- each condition entry consists of:
	- **column** - specification of the column which condition uses
	- **operator** - operator of the condition
	- **value** - value which the column is being compared to in the condition
### 4.3 limit
- A single number describing how many rows are to be fetched
