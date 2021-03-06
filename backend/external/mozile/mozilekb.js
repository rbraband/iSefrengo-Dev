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
 * - Christian Stocker (Bitflux)
 *
 * ***** END LICENSE BLOCK ***** */

/* 
 * mozilekb V0.52
 * 
 * Keyboard handling for Mozile. You can replace this if you want different keyboard
 * behaviors.
 *
 * POST04:
 * - reimplement ip use: reuse ip whereever possible. Big performance gain.
 * - support keyboard shortcuts for navigation and style settings
 * - consider xbl equivalent
 * - make sure event handlers aren't loaded twice: if user includes script twice, should
 * not register handlers twice (spotted by Chris McCormick)
 * - see if can move to using DOM events and away from Window.getSelection() if possible 
 * (effects how generic it can be!)
 * - selection model: word, line etc. Write custom handlers of clicks and use new Range
 * expansion methods
 */

/*
 * Handle key presses
 *
 * POST04:
 * - IP isn't recreated everytime with its own text pointer; text pointer isn't (in Range
 * create) set up for every key press.
 * - need up and down arrows to be implemented here too (via eDOM!): that way, no problem with
 * not deselecting toolbar at right time
 * - add in support for typical editing shortcuts based on use of ctrl key or tabs; can synthesize events to
 * force selection. http://www.mozilla.org/docs/end-user/moz_shortcuts.html and ctrl-v seems to effect caret mode?
 * - arrow keys: mode concept where if in text mode then only traverse text AND do not traverse objects. If
 * mixed mode, then select objects too.
 * - each editable area gets a CP? If valid (add method that checks TextNode validity?)
 */
document.addEventListener("keypress", keyPressHandler, true);

function keyPressHandler(event)
{	
	var handled = false;

	// metakey is Mac OSX standard
	if(event.ctrlKey || event.metaKey)
		handled = ctrlKeyPressHandler(event);
	else
		handled = nonctrlKeyPressHandler(event);

	// handled event so do let things go any further.
	if(handled)
	{
		//cancel event: TODO05: why all three?
		event.stopPropagation();
		event.returnValue = false;
  		event.preventDefault();
  		return false;
	}
}

function ctrlKeyPressHandler(event, cssr)
{
	if(!event.charCode)
		return;

	if(String.fromCharCode(event.charCode).toLowerCase() == "v")
	{
		return window.getSelection().paste();
	}
	else if(String.fromCharCode(event.charCode).toLowerCase() == "x")
	{
		return window.getSelection().cut();
	}
	else if(String.fromCharCode(event.charCode).toLowerCase() == "c")
	{
		return window.getSelection().copy();
	}
	else if(String.fromCharCode(event.charCode).toLowerCase() == "s")
	{
		mozileSave();
		return true;
	}
	return false;
}

/**
 * POST04: 
 * - carefully move selectEditableRange in here
 * - distinguish editable range of deleteOne at start of line and deleteOne
 * on same line [need to stop merge but allow character deletion]. Perhaps
 * need to change eDOM granularity.
 */
function nonctrlKeyPressHandler(event)
{
	var sel = window.getSelection();

	// BACKSPACE AND DELETE (DOM_VK_BACK_SPACE, DOM_VK_DELETE)
	if((event.keyCode == 8) || (event.keyCode == 46))
	{
		return window.getSelection().deleteSelection();
	}

	// PREV (event.DOM_VK_LEFT) Required as Moz left/right doesn't handle white space properly
	if(event.keyCode == 37 && !event.shiftKey)
	{
		return window.getSelection().moveInsertionPoint(Selection.MOVE_BACK_ONE);
	}

	// NEXT (event.DOM_VK_RIGHT) Required as Moz left/right doesn't handle white space properly
	if(event.keyCode == 39 && !event.shiftKey)
	{	
		return window.getSelection().moveInsertionPoint(Selection.MOVE_FORWARD_ONE);
	}

	if(event.keyCode == 38 && !event.shiftKey)
	{
		return window.getSelection().moveInsertionPoint(Selection.MOVE_UP_ONE);
	}

	if(event.keyCode == 40 && !event.shiftKey)
	{
		return window.getSelection().moveInsertionPoint(Selection.MOVE_DOWN_ONE);
	}	

	// RETURN OR ENTER (event.DOM_VK_ENTER DOM_VK_RETURN)
	if(event.keyCode == 13)
	{
		return window.getSelection().splitXHTMLLine(event.shiftKey);
	}

	// POST05: for non-pre, may change to mean switch to next editable area
	if(event.keyCode == event.DOM_VK_TAB)
	{
		return window.getSelection().insertCharacter(CHARCODE_SPACE);
	}

	if(event.keyCode == event.DOM_VK_HOME) 
	{
        	var cssr = sel.getEditableRange();
        	if(!cssr )
        	{
            		return false;
        	}
        	sel.collapse( cssr.lines[0].container, 0);
	        return true;
    	}

    	if (event.keyCode == event.DOM_VK_END) 
	{
        	var cssr = sel.getEditableRange();
        	if(!cssr )
        	{
            		return false;
        	}
        	sel.collapse(cssr.lines[0].container, cssr.lines[0].container.childNodes.length);
        	return true;
	} 

	// ALPHANUM
	if(event.charCode)
		return window.getSelection().insertCharacter(event.charCode);		

	return false;
}