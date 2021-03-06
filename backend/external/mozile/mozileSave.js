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
 * ***** END LICENSE BLOCK ***** */

/**********************************************************************************
 * mozileSave.js V0.52: this file implements save/post option in Mozile. It uses
 * "save" settings in the mozile configuration file to decide what transport driver
 * to use to save a file. 
 * 
 * POST05:
 * - be more robust ie/ if garbage in configuration etc
 * - "save elements" option: make this save all changed editable elements. This means
 * tracking changes in this file.
 * - allow user to set global default for saving (right now, fixed to "save to file") in config file
 * - pass file name/id and actual content back in any errors (change mozDataTransport)
 **********************************************************************************/

/**
 * Configuration: this will move into an XML file that configures mozile for a page/web site
 *
 * Options:
 * hostname | method to use | element or whole document.
 * ex/ for host "www.playsophy.com", could have "webdav false" or "http true" or "file false"
 * 
 * Note:
 * in general, only save the editable area that has changed as the rest of a file may be just
 * template information, fixed by a CMS. Only saving an editable area would correspond to posting
 * a blog entry in a blog.
 */

/**
 * Change this to use the configuration file!
 */
function mozileSave()
{
	// a/c for file - no hostname. Will lookup "file" as the "url" to allow user to post files somewhere else!
	var hostname = "file";
	if(document.location.protocol != "file:")
		hostname = document.location.host;

	var method = "alert"; // default to poping up an alert box with raw XHTML
	var editableAreaOnly = true;
	if(MOZILE_CONFIG_DOC) // if there is a configuration file then use it!
	{
		// Get first match
		var siteConfig = MOZILE_CONFIG_DOC.evaluate("/mozile/save/site[hostname='" + hostname + "']", MOZILE_CONFIG_DOC, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

		if(siteConfig) // if site is explicitly configured then 
		{
			method = MOZILE_CONFIG_DOC.evaluate("method", siteConfig, null, XPathResult.STRING_TYPE, null).stringValue;
			// Note: should be using BOOLEAN_TYPE and booleanValue but Mozilla seems to have a bug and always return "true" 
			editableAreaOnly = MOZILE_CONFIG_DOC.evaluate("editonly", siteConfig, null, XPathResult.STRING_TYPE, null).stringValue;
		}
		else // no explicit config - default to file system!
		{
			method = "file";
			editableAreaOnly = false;
		}
	}

	// get contents to save and an identifier for that content
	if(ptb) ptb.ptbDeactivate(); // first nix the toolbar if active
	var contentToSave;
	var id = document.location.pathname;
	if(editableAreaOnly=="true")
	{
		// get the contents of the editable area
		var cssr = window.getSelection().getEditableRange();
		var editableArea = cssr.top;
		var dataToSaveRange = document.createRange();
		dataToSaveRange.selectNodeContents(editableArea);
		var dataToSave = dataToSaveRange.cloneContents();
		
		contentToSave = documentSaveXML(dataToSave);
		// contentToSave = editableArea.innerHTML;
		if(editableArea.id) // append editable area id to file name if there is an id
			id = document.location.pathname + "#" + editableArea.id;
	}
	else
		contentToSave = documentSaveXML(document);

	var td = new mozTransportDriver(method);

	td.save(id, contentToSave, __mozileSaved);

	// reactivate a toolbar if initialized
	if(ptb) ptb.ptbActivate();
}

/**
 * Callback from Transport - used if there is a problem.
 *
 * POST05: get more information back! 
 */ 
function __mozileSaved(reqObj) 
{	
	if (reqObj.isError)
		alert ("couldn't save document \n" + reqObj.statusText);
}