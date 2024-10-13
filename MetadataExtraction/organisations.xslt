<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:tei="http://www.tei-c.org/ns/1.0"
	exclude-result-prefixes="tei">

	<xsl:output method="text" encoding="UTF-8" />

	<xsl:template match="tei:listOrg">
		<xsl:text>ID,role,</xsl:text>
		<xsl:value-of select="@xml:lang" />
		<xsl:text>,en,abb,orientation&#10;</xsl:text>
		<xsl:for-each select="//tei:org"> 
			<xsl:call-template name="organisations" />
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="organisations">
		<!-- Get the ID of an organisation -->
		<xsl:value-of select="@xml:id" />
		<xsl:text>,</xsl:text>
		
		<!-- Get the role of the organisation -->
		<xsl:value-of select="@role" />
		<xsl:text>,</xsl:text>
		
		<!-- Get the the names -->
		<xsl:for-each select="tei:orgName">
			<xsl:value-of select="text()" />
			<xsl:text>,</xsl:text>
		</xsl:for-each>

		<!-- Get political orientation if present -->
		<xsl:if test="tei:state/@type='politicalOrientation'">
			<xsl:value-of select="tei:state/tei:state/@ana"/>
		</xsl:if>
		
		<xsl:text>&#10;</xsl:text>
	</xsl:template>
</xsl:stylesheet>
