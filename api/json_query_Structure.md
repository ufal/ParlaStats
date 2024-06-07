# JSON query structure description
- Query json file consists of 2 parts
## 1. Aggregation part
- Here, all the aggregation specifics are described
### 1.1 tables
- list of aggregated database tables
### 1.2 joins
- list of joins performed on the above named aggregated tables
- each join entry consists of:
	- **type** - specifies the type of join
	- **right_table** - specifies the right table of the join
	- **right_column** - specifies the column of right table on which the join is performed
	- **left_table** - specifies the column of left table on which the join is performed
	- **left_column** - specifies the column of left table on which the join is performed
### 1.3 group by
- contains on columns based on which the result is to be grouped by.
### 1.4 order by
- contains the list of ordering entries
- each ordering entry consists of:
	- **column** - specifies based on which column should the results be ordered by
	- **direction** - specifies whether the results are to be ordered ascending or descending
## 2. Filtering part
- Here all the desired filtering of the result is described
### 2.1 columns
- list of columns that are to be selected from the aggregated table
- also stuff like SUM, AVG, ETC is present here
### 2.2 conditions
- list of conditions to be applied on selected columns
- each condition entry consists of:
	- **column** - specification of the column which condition uses
	- **operator** - operator of the condition
	- **value** - value which the column is being compared to in the condition
