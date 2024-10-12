<?xml version = "1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:tei="http://www.tei-c.org/ns/1.0"
	exclude-result-prefixes="tei">
	
	<xsl:output method="text" encoding="UTF-8" />

	<xsl:template match="tei:listPerson">
		<xsl:text>ID,surname,forename,since,to&#10;</xsl:text>
		<xsl:for-each select="//tei:person">
			<xsl:call-template name="personNameRecords" />
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="personNameRecords">
		<!-- Get the person ID -->
		<xsl:variable name="personID" select="@xml:id"/>
		
		<xsl:for-each select="tei:persName">
			<xsl:value-of select="$personID" />
			<xsl:text>,</xsl:text>
			
			<!-- Get the surname value -->
			<xsl:value-of select="tei:surname/text()" />
			<xsl:text>,</xsl:text>

			<!-- Get the forename value -->
			<xsl:value-of select="tei:forename/text()" />
			<xsl:text>,</xsl:text>
			
			<!-- Get the since attribute -->
			<xsl:value-of select="@from" />
			<xsl:text>,</xsl:text>

			<!-- Get the to attribute  -->
			<xsl:value-of select="@to" />
			<xsl:text>&#10;</xsl:text>

		</xsl:for-each>
		

	</xsl:template>
</xsl:stylesheet>


