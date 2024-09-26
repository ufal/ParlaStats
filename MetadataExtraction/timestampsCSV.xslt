<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:tei="http://www.tei-c.org/ns/1.0"
	exclude-result-prefixes="tei">

	<!-- Define key for faster look-up of the <when> tag. -->
	<xsl:key name="whenByID" match="tei:when" use="@xml:id"/>

	<xsl:output method="text" encoding="UTF-8" />
	
	<xsl:template match="/tei:TEI">
	<!-- Type - Either (S)peaker or (T)oken -->
	<!-- ID - of the speaker if the type is 'S' or of the token if the Type is 'T' -->
	<!-- begin - marks the beginning of the token in audio -->
	<!-- end - marks the end of the token in audion-->
		<xsl:text>Type,ID,begin,end&#10;</xsl:text>
		<xsl:apply-templates select="tei:text/tei:body/tei:div/tei:u"/>
		<xsl:for-each select="//tei:w">
			<xsl:call-template name="word" />
		</xsl:for-each>

	
	</xsl:template>


	<!-- Keep the ID of a speaker -->
	<xsl:template match="tei:u">
		<xsl:text>S,</xsl:text>
		<xsl:value-of select="@who"/>
		<xsl:text>,,&#10;</xsl:text>
	</xsl:template>

	<!-- <xsl:template match="tei:w"> -->
	<xsl:template name="word">
		<!-- Get the ID of the token -->
		<xsl:text>T,</xsl:text>
		<xsl:value-of select="@xml:id" />
		<xsl:text>,</xsl:text>
		<!-- Get the start timestamp of the tag -->
		<xsl:variable name="startSynch" select="preceding-sibling::tei:anchor[1]/@synch" />
		<xsl:value-of select="key('whenByID', substring($startSynch, 2))/@interval" />
		<xsl:text>,</xsl:text>
		<!-- Get the end timestamp of the tag -->
		<xsl:variable name="endSynch" select="following-sibling::tei:anchor[1]/@synch" />
		<xsl:value-of select="key('whenByID', substring($endSynch, 2))/@interval" />
		<xsl:text>&#10;</xsl:text>
	</xsl:template>
	
</xsl:stylesheet>
