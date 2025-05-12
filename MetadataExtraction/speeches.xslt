<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:tei="http://www.tei-c.org/ns/1.0"
	exclude-result-prefixes="tei">

	<xsl:output method="text" encoding="UTF-8" />
	
	<xsl:template match="tei:TEI">
		<xsl:text>ID,date,tokenCount,sentencesCount,namedEntityCount,role,personID,term&#10;</xsl:text>
		<xsl:variable name="date" select="tei:teiHeader/tei:profileDesc/tei:settingDesc/tei:setting/tei:date/@when" />
		<xsl:variable name="term" select="tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:meeting[contains(@ana, 'parla.term')]/@n" />
		<xsl:for-each select="//tei:u">
			<xsl:value-of select="@xml:id" />
			<xsl:text>,</xsl:text>
			<xsl:value-of select="$date" />
			<xsl:text>,</xsl:text>
			<xsl:call-template name="counts" />
			<xsl:value-of select="@ana" />
			<xsl:text>,</xsl:text>
			<xsl:value-of select="@who" />
			<xsl:text>,</xsl:text>
			<xsl:value-of select="$term" />
			<xsl:text>&#10;</xsl:text>
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="counts">
		<!-- Get the count of the w tag -->
		<xsl:value-of select="count(descendant::tei:w)" />
		<xsl:text>,</xsl:text>

		<!-- Get the count of the s tag -->
		<xsl:value-of select="count(descendant::tei:s)" />
		<xsl:text>,</xsl:text>

		<!-- Get the named entities count -->
		<xsl:value-of select="count(descendant::tei:name)" />
		<xsl:text>,</xsl:text>
	</xsl:template>
</xsl:stylesheet>
