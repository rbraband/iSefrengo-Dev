/* ***** BEGIN LICENSE BLOCK *****
 * Licensed under Version: MPL 1.1/GPL 2.0/LGPL 2.1
 * Full Terms at http://mozile.mozdev.org/license.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Playsophy code (www.playsophy.com).
 *
 * The Initial Developer of the Original Code is Playsophy
 * Portions created by the Initial Developer are Copyright (C) 2002-2003
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

/*************************************************************************************************************
 * domlevel3 V0.52
 *
 * Early DOM Level 3 implementation - part of: 
 * - the Validation module: http://www.w3.org/TR/2003/WD-DOM-Level-3-Val-20030205/
 * - the load and save module: http://www.w3.org/TR/2003/WD-DOM-Level-3-LS-20030226/
 * Both modules are designed for building editors.
 *
 * Note: this JS will go away once these modules are properly supported within standard
 * browsers.
 *
 * POST05:
 * - properly pretty print XML in save methods
 * - implement documentURI and other level 3 core methods
 *************************************************************************************************************/

/************************* Core *****************************************/	

/************************* Load and Save ********************************/

/*
 * saveXML method from DocumentLS
 * see: http://www.w3.org/TR/2003/WD-DOM-Level-3-LS-20030226/load-save.html#LS-DocumentLS
 */
Document.prototype.saveXML = documentSaveXML;
function documentSaveXML(snode)
{
	if(!snode)
		snode = document; // null means document as a whole

	//create a new XMLSerializer
	var objXMLSerializer = new XMLSerializer;
    
	//get the XML string
	var strXML = objXMLSerializer.serializeToString(snode);
    
	//return the XML string
	return strXML;
}

Node.prototype.saveXML = function()
{
	//create a new XMLSerializer
	var objXMLSerializer = new XMLSerializer;
    
	//get the XML string
	var strXML = objXMLSerializer.serializeToString(this);
    
	//return the XML string
	return strXML;
}

/*
 * markupContent attribute from ElementLS
 *
 * see: http://www.w3.org/TR/2003/WD-DOM-Level-3-LS-20030226/load-save.html#LS-ElementLS
 */
Element.prototype.__defineGetter__(
	"markupContent",
	function()
	{
		var objXMLSerializer = new XMLSerializer;
		var strXML = objXMLSerializer.serializeToString(this);
		return strXML;
	}
);

/************************* Validation Module ****************************/

/*
 * allowedChildren attribute from ElementEditVAL
 * 
 * see: http://www.w3.org/TR/2003/WD-DOM-Level-3-Val-20030205/validation.html#VAL-Interfaces-ElementEditVAL
 *
 * note: implementation only works for XHTML for now  
 *
 * POST04: change to return list of allowed children ie/ return empty list of string names
 */
Element.prototype.__defineGetter__(
	"allowedChildren",
	function()
	{
		// Listing HTML elements - of course an XML may have others but
		// we can't know that without reading the DTD/Schema.
		switch(this.nodeName)
		{
			case "AREA":	case "BASE":	case "BASEFONT":
			case "BR":	case "COL":	case "FRAME":
			case "HR":	case "IMG":	case "INPUT":
			case "ISINDEX":	case "LINK":	case "META":
			case "PARAM": 
			case "OBJECT": // Issue: is allowed but not handled well so disallow
				return false;
		}

		return true;
	}
);

/*
 * contentType from ElementEditVAL
 * 
 * Can be used for walking editable text. 
 * 
 * see: http://www.w3.org/TR/2003/WD-DOM-Level-3-Val-20030205/validation.html#VAL-Interfaces-ElementEditVAL-ElementEditVAL-contentType
 *
 * Note: specification doesn't seem to cover its return values properly.
 */

Element.EMPTY_CONTENTTYPE = 0;
Element.SIMPLE_CONTENTTYPE = 1;
Element.ANY_CONTENTTYPE = 2;
Element.MIXED_CONTENTTYPE = 3;
Element.ELEMENTS_CONTENTTYPE = 4;

Element.prototype.__defineGetter__(
	"contentType",
	function()
	{
		// non childbearing or just has no children
		if(this.childNodes.length == 0)	
		{
			if(__isXHTMLNonChildBearingElement(this))
				return Element.EMPTY_CONTENTTYPE;
			else
				return Element.ANY_CONTENTTYPE;
		}

		// only a text node as a child
		if((this.childNodes.length == 1) && (this.childNodes[0].nodeType == Node.TEXT_NODE))
			return Element.SIMPLE_CONTENTTYPE;

		for(var i=0; i<this.childNodes.length; i++)
			if(this.childNodes[i].nodeType == Node.TEXT_NODE)
				return Element.MIXED_CONTENTTYPE;

		return Element.ELEMENTS_CONTENTTYPE;
	}
);

/**
 * POST05: move this out to xhtml only area
 */
function __isXHTMLNonChildBearingElement(element)
{
	// Listing HTML elements - of course an XML may have others but
	// we can't know that without reading the DTD/Schema.
	switch(element.nodeName.toUpperCase())
	{
		case "AREA":	case "BASE":	case "BASEFONT":
		case "BR":	case "COL":	case "FRAME":
		case "HR":	case "IMG":	case "INPUT":
		case "ISINDEX":	case "LINK":	case "META":
		case "PARAM": 
		case "OBJECT": // Issue: is allowed but not handled well so disallow
			return true;
	}

	return false;
}

/*
 * isWhitespaceOnly attribute from CharacterDataEditVAL
 * 
 * see: http://www.w3.org/TR/2003/WD-DOM-Level-3-Val-20030205/validation.html#VAL-Interfaces-CharacterDataEditVAL-isWhitespaceOnly
 */
Text.prototype.__defineGetter__(
	"isWhitespaceOnly",
	function()
	{
		if(this.nodeValue.length == 0) // empty node: interpreting as whitespace?
			return true;

		if(/\S+/.test(this.nodeValue)) // any non white space visible characters
			return false;

		return true;
	}
);