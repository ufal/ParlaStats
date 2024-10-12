<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:tei="http://www.tei-c.org/ns/1.0"
	exclude-result-prefixes="tei">
	
	<xsl:output method="text" encoding="UTF-8" />

	<xsl:template match="tei:listPerson">
		<xsl:text>ID,Sex,Birth&#10;</xsl:text>
		<xsl:for-each select="//tei:person">
			<xsl:call-template name="generalPerson" />
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="generalPerson">
		<!-- Get person ID -->
		<xsl:value-of select="@xml:id" />
		<xsl:text>,</xsl:text>
		
		<!-- Get person Sex -->
		<xsl:value-of select="tei:sex/@value" />
		<xsl:text>,</xsl:text>

		<!-- Get person Birth -->
		<xsl:value-of select="tei:birth/@when" />
		<xsl:text>&#10;</xsl:text>
	</xsl:template>
</xsl:stylesheet>
