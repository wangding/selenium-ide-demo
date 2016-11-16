/**
 * Jerry Qian(qqqiansjtucs@hotmail.com)
 * include extension for Selenium-IDE edition
 * refer to includeCommand_2.1.3 for Selenium-Core edition
 * @version 1.1
 *
 */
function IDEIncludeCommand() {}
 
IDEIncludeCommand.LOG_PREFIX = "IDEIncludeCommand: ";
IDEIncludeCommand.BEGIN_TEMPLATE = "begin$Template$";
IDEIncludeCommand.END_TEMPLATE = "end$Template$";
IDEIncludeCommand.VERSION = "1.1";
   
IDEIncludeCommand.prototype.prepareTestCaseAsText = function(responseAsText, paramsArray) {
    /**
     * Prepare the HTML to be included in as text into the current testcase-HTML
     * Strip all but the testrows (tr)
     * Stripped will be:
     *  - whitespace (also new lines and tabs, so be careful wirt parameters relying on this),
     *  - comments (xml comments)                 
     * Replace variable according to include-parameters 
     * note: the include-variables are replaced literally. selenium does it at execution time
     * also note: all selenium-variables are available to the included commands, so mostly no include-parameters are necessary
     *
     * @param responseAsText table to be included as text (string)
     * @return testRows array of tr elements (as string!) containing the commands to be included
     * 
     * TODO:
     *  - selenium already can handle testcase-html. use selenium methods or functions instead
     *  - find better name for requester
     */
    // removing new lines, carret return and tabs from response in order to work with regexp
    var pageText = responseAsText.replace(/\r|\n|\t/g,"");
    // remove comments
    // begin comment, not a dash or if it's a dash it may not be followed by -> repeated, end comment
    pageText = pageText.replace(/<!--(?:[^-]|-(?!->))*-->/g,"");
    // find the content of the test table = <[spaces]table[char but not >]>....< /[spaces]table[chars but not >]>
    var testText = pageText.match(/<\s*table[^>]*>(.*)<\/\s*table[^>]*>/i)[1];

    // Replace <td></td> with <td>&nbsp;</td> for iE - credits Chris Astall
    // rz: somehow in my IE 7 this is not needed but is not bad as well
    testText = testText.replace(/<\s*td[^>]*>\s*<\s*\/td[^>]*>/ig,"<td></td>");// jq: no space

    // replace vars with their values in testText
    for ( var k = 0 ; k < paramsArray.length ; k++ ) {
        var pair = paramsArray[k];
        testText = testText.replace(pair[0],pair[1]);
    }

    // removes all  < /tr> 
    // in order to split on < tr>
    testText = testText.replace(/<\/\s*tr[^>]*>/ig,"");
    // split on <tr>
    var testRows = testText.split(/<\s*tr[^>]*>/i);
    return testRows;
};

IDEIncludeCommand.prototype.getIncludeDocumentBySynchronRequest = function(includeUrl) {
    /**
     * Prepare and do the XMLHttp Request synchronous as selenium should not continue execution meanwhile
     *
     * note: the XMLHttp requester is returned (instead of e.g. its text) to let the caller decide to use xml or text
     *
     * selenium-dependency: uses extended String from htmlutils
     *
     *  TODO use Ajax from prototype like this:
     *   var sjaxRequest = new Ajax.Request(url, {asynchronous:false});
     *   there is discussion about getting rid of prototype.js in developer forum.
     *   the ajax impl in xmlutils.js is not active by default in 0.8.2
     *
     * @param includeUrl URI to the include-document (document has to be from the same domain)
     * @return XMLHttp requester after receiving the response
     */
    var url = this.prepareUrl(includeUrl);
    // the xml http requester to fetch the page to include
    var requester = this.newXMLHttpRequest();
    if (!requester) {
        throw new Error("XMLHttp requester object not initialized");
    }
    requester.open("GET", url, false); // synchron mode ! (we don't want selenium to go ahead)
    try {
        requester.send(null);
    } catch(e) {
      throw new Error("Error while fetching url '" + url + "' details: " + e);
    }
    if ( requester.status != 200 && requester.status !== 0 ) {
        throw new Error("Error while fetching " + url + " server response has status = " + requester.status + ", " + requester.statusText );
    }
    return requester;
};

IDEIncludeCommand.prototype.prepareUrl = function(includeUrl) {
    /** Construct absolute URL to get include document
     * using selenium-core handling of urls (see absolutify in htmlutils.js)
     */
    var prepareUrl;
    // htmlSuite mode of SRC? TODO is there a better way to decide whether in SRC mode?
    if (window.location.href.indexOf("selenium-server") >= 0) {
        LOG.debug(IDEIncludeCommand.LOG_PREFIX + "we seem to run in SRC, do we?");
        preparedUrl = absolutify(includeUrl, htmlTestRunner.controlPanel.getTestSuiteName());
    } else {
        preparedUrl = absolutify(includeUrl, selenium.browserbot.baseUrl);
    }
    LOG.debug(IDEIncludeCommand.LOG_PREFIX + "using url to get include '" + preparedUrl + "'");
    return preparedUrl;
};

IDEIncludeCommand.prototype.newXMLHttpRequest = function() {
    // TODO should be replaced by impl. in prototype.js or xmlextras.js
    //     but: there is discussion of getting rid of prototype.js
    //     and: currently xmlextras.js is not activated in testrunner of 0.8.2 release
    var requester = 0;
    var exception = '';
    // see http://developer.apple.com/internet/webcontent/xmlhttpreq.html
    // changed order of native and activeX to get it working with native
    //  xmlhttp in IE 7. credits dhwang
    try {
        // for IE/ActiveX
        if(window.ActiveXObject) {
            try {
                requester = new ActiveXObject("Msxml2.XMLHTTP");
            }
            catch(e) {
                requester = new ActiveXObject("Microsoft.XMLHTTP");
            }
        }
        // Native XMLHttp
        else if(window.XMLHttpRequest) {
            requester = new XMLHttpRequest();
        }
    }
    catch(e) {
        throw new Error("Your browser has to support XMLHttpRequest in order to use include \n" + e);
    }
    return requester;
};

IDEIncludeCommand.prototype.splitParamStrIntoVariables = function(paramString) {
    /**
     * Split include Parameters-String into an 2-dim array containing Variable-Name and -Value
     *
     * selenium-dependency: uses extended String from htmlutils
     *
     * TODO: write jsunit tests - this could be easy (if there were not the new RegExp)
     *
     * @param includeParameters string the parameters from include call
     * @return new 2-dim Array containing regExpName (to find a matching variablename) and value to be substituted for
     */
    var newParamsArray = new Array();
    // paramString shall contains a list of var_name=value
    var paramListPattern = /([^=,]+=[^=,]*,)*([^=,]+=[^=,]*)/;
    if (! paramString || paramString === "") {
        return newParamsArray;
    } else if (paramString.match( paramListPattern )) {
        // parse parameters to fill newParamsArray
        var pairs = paramString.split(",");
        for ( var i = 0 ; i < pairs.length ; i++ ) {
            var pair = pairs[i];
            var nameValue = pair.split("=");
            //rz: use String.trim from htmlutils.js of selenium to get rid of whitespace in variable-name(s)
            var trimmedNameValue = new String(nameValue[0]).trim();
            // the pattern to substitute is ${var_name}
            var regExpName = new RegExp("\\$\\{" + trimmedNameValue + "\\}", "g");
            
            if (nameValue.length < 3) {
               newParamsArray.push(new Array(regExpName,nameValue[1]));
            } else {
                var varValue = new String(nameValue[1]);
                for (var j = 2; j < nameValue.length; j++) {
                    varValue=varValue.concat("="+nameValue[j]);
                }
                newParamsArray.push(new Array(regExpName,varValue));
            }
        }
    } else {
        throw new Error("Bad format for parameters list : '" + paramString + "'");
    }
    return newParamsArray;
};

IDEIncludeCommand.prototype.doInclude = function(locator, paramString) { 
    // Rewrite logic for Selenium IDE by Jerry Qian
    var currentSelHtmlTestcase = testCase; 
     
    var includeCmdRow = testCase.debugContext.currentCommand();

    if (!includeCmdRow) {
        throw new Error("IDEIncludeCommand: failed to find include-row in source testtable");
    }

    var paramsArray = this.splitParamStrIntoVariables(paramString);
 
    var inclDoc = this.getIncludeDocumentBySynchronRequest(locator);
 
    var includedTestCaseHtml = this.prepareTestCaseAsText(inclDoc.responseText, paramsArray);
    
    this.injectIncludeTestCommands(locator,includeCmdRow,includedTestCaseHtml); 
};


IDEIncludeCommand.prototype.injectIncludeTestCommands = function(locator,includeCmdRow,  testRows) { 
    // Rewrite logic for Selenium IDE by Jerry Qian
    var newCommands = new Array(); 
    // skip first element as it is empty or <tbody>
    for (var i = 1 ; i < testRows.length; i++) {
    	  if(i == 1){// add BEGIN-END block
    	    var beginCommand = new Command(IDEIncludeCommand.BEGIN_TEMPLATE,locator,"");	
    	    newCommands.push(beginCommand);
    	  } 
    	  
          var newText = testRows[i];  
    	  if(newText.match(/<\s*td.*colspan=.*>(.*)<\/\s*td[^>]*>/i)){//delete comment step
             continue;
          }
          
          // removes all  < /td> 
          // in order to split on <td>
          newText = newText.replace(/<\/\s*td[^>]*>\s*<\/\s*tbody[^>]*>/ig,""); //remove </tbody>first
          newText = newText.replace(/<\/\s*td[^>]*>/ig,""); 
    	  var newCols = newText.split(/<\s*td[^>]*>/i);
    	  var new_cmd,new_target,new_value; 
    	  
          for (var j = 1 ; j < newCols.length; j++) {//skip 0
    	  	if(j == 1) {
    	  		new_cmd = newCols[j].replace(/\s/g,"");//trim \s
    	  	}else if(j == 2) {
    	  	  new_target = newCols[j].replace(/\s+$/g,"");//trim end \s
    	  	}else if(j == 3) {
    	  	  new_value = newCols[j].replace(/\s+$/g,"");//trim end \s
    	  	} 
    	  } 
    	  
    	   
          var newCommand =  new Command(new_cmd,new_target,new_value); 
          newCommands.push(newCommand); //correct all steps
    } 
    var endCommand = new Command(IDEIncludeCommand.END_TEMPLATE,locator,"");	
    newCommands.push(endCommand);//add BEGIN-END block
   
   
    var cmsBefore = testCase.commands.slice(0,testCase.debugContext.debugIndex + 1);     
    var cmdsBehind = testCase.commands.slice(testCase.debugContext.debugIndex + 1, testCase.commands.length);     
    testCase.commands = cmsBefore.concat(newCommands).concat(cmdsBehind);//Injection
     
     
    editor.view.refresh();//Must refresh to syncup UI
};


Selenium.prototype.doInclude = function(locator, paramString) {
    LOG.debug(IDEIncludeCommand.LOG_PREFIX + " Version " + IDEIncludeCommand.VERSION);
    var ideIncludeCommand = new IDEIncludeCommand();
    ideIncludeCommand.doInclude(locator, paramString);
};

Selenium.prototype.doBegin$Template$ = function(locator){
    LOG.info("Begin Template " + locator);	
};

Selenium.prototype.doEnd$Template$ = function(locator){
    LOG.info("End Template " + locator);	
};


