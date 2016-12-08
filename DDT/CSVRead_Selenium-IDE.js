    // global array

    array = new Array();

        Selenium.prototype.doStoreCellValue = function(variableName,cellPosition)

    {    

        var xy = cellPosition.split(",");

        var x = xy[0] - 1;

        var y = xy[1] - 1;



        var value = array[x][y];

        storedVars[variableName] = value;



    }



    // ================================================================================

    Selenium.prototype.doReadCSV = function(xmlpath)

    {           

        var filedata = null;

        loader = new FileReader();

        var xmlHttpReq = loader.getIncludeDocumentBySynchronRequest(xmlpath);

        LOG.info("Reading from: " + xmlpath);

        filedata = xmlHttpReq.responseText; //CSV Doc data

        array = CSVToArray (filedata);

            

    }

    // ==================== File Reader ====================





    function FileReader() {}



    FileReader.prototype.getIncludeDocumentBySynchronRequest = function(includeUrl) {

        

        var requester = this.newXMLHttpRequest();

        if (!requester) {

            throw new Error("XMLHttp requester object not initialized");

        }

        requester.open("GET", includeUrl, false); // synchron mode ! (we don't want selenium to go ahead)

        try {

            requester.send(null);

        } catch(e) {

          throw new Error("Error while fetching includeUrl '" + includeUrl + "' details: " + e);

        }

        if ( requester.status != 200 && requester.status !== 0 ) {

            throw new Error("Error while fetching " + includeUrl + " server response has status = " + requester.status + ", " + requester.statusText );

        }

        return requester;

    };



    FileReader.prototype.newXMLHttpRequest = function() {

        var requester = 0;

        var exception = '';

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



//==============CSV to Array ===================



    function CSVToArray( strData, strDelimiter ){

        strDelimiter = (strDelimiter || ",");

        var objPattern = new RegExp(

            (

                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                "([^\"\\" + strDelimiter + "\\r\\n]*))"

            ),

            "gi"

            );

        var arrData = [[]];

        var arrMatches = null;

        while (arrMatches = objPattern.exec( strData )){

            var strMatchedDelimiter = arrMatches[ 1 ];

            if (

                strMatchedDelimiter.length &&

                strMatchedDelimiter !== strDelimiter

                ){

                arrData.push( [] );

            }



            var strMatchedValue;

            if (arrMatches[ 2 ]){



                strMatchedValue = arrMatches[ 2 ].replace(

                    new RegExp( "\"\"", "g" ),

                    "\""

                    );



            } else {

                strMatchedValue = arrMatches[ 3 ];

            }

            arrData[ arrData.length - 1 ].push( strMatchedValue );

        }

        return( arrData );

    }
