function TestEmailCapture(request, response){
	var URL_PARAM = request.getParameter('custscript6');
	nlapiLogExecution('DEBUG', 'URL Param:', URL_PARAM);
}

function process(email){
	var saveOnce = false;
	var fromAddress = email.getFrom();
	var subject = email.getSubject();
	var attachments = email.getAttachments();
	nlapiLogExecution('DEBUG', 'From Address:', fromAddress);
	nlapiLogExecution('DEBUG', 'subject', subject);
	
	var poDocumentID = '';
	var insideFlag = false;
	for(var x = 0; x < subject.length; x++){
		if(subject[x] == ']'){
			insideFlag = false;
			x = subject.length;	//Escape the loop.
		}
		if(insideFlag == true){
			poDocumentID += subject[x];
		}
		if(subject[x] == '['){
			insideFlag = true;
		}
	}
	nlapiLogExecution('DEBUG', 'PO Document ID', poDocumentID);
	
	var vendorBill;
	
	for(var index in attachments){
		attachments = email.getAttachments();
		var fileObj = attachments[index];
		fileObj.setFolder(5242);	//internal ID of the folder in NetSuite File Cabinet.
		var id = nlapiSubmitFile(fileObj);
		var fileSaved = nlapiLoadFile(id);
		nlapiLogExecution('DEBUG', 'File internal ID', id);
		var fileText = fileSaved.getValue();
		nlapiLogExecution('DEBUG', 'File Content', fileSaved.getValue().split(/\n|\n\r/));
		var arrayFile = fileSaved.getValue().split(/\n|\n\r/);
		
		try{
			var fieldId = new Array();
			var fieldValues = new Array();
			var placeholder = '';
			var insideField = false;
			for(var x = 0; x < arrayFile.length; x++){
				placeholder = '';
				//nlapiLogExecution('DEBUG', 'arrayFile[x].length', arrayFile[x].length);
				for(var y = 0; y < arrayFile[x].length; y++){
					if(x == 0){// && (y+1) != arrayFile[x].length){
						//Field ID
						if(arrayFile[x][y] != ','){
							if((y+1) == arrayFile[x].length){
								//nlapiLogExecution('DEBUG', 'Last - Field ID', placeholder);
								fieldId.push(placeholder);
								placeholder = '';
							}
							else{
								placeholder += arrayFile[x][y];
							}
						}
						else{
							//nlapiLogExecution('DEBUG', 'Field ID', placeholder);
							fieldId.push(placeholder);
							placeholder = '';
						}
					}
					/*else if((y+1) == arrayFile[x].length){
						//Skip. Last line doesn't contain anything. Terminate the loop.
						y = arrayFile[x].length;
						//nlapiLogExecution('DEBUG', 'Last - Inside', placeholder);
						placeholder = '';
					}*/
					else{
						//Actual Field Values
						if(arrayFile[x][y] == '"' && insideField == false){
							insideField = true;
							placeholder = '';
							//nlapiLogExecution('DEBUG', 'Start - "', "Start Inside");
						}
						else{
							//If inside a " symbol. For instance, currency is shown as "10,000.00" in a CSV file.
							if(insideField == true && arrayFile[x][y] == '"'){
								//nlapiLogExecution('DEBUG', 'Inside', placeholder);
								fieldValues.push(placeholder);
								placeholder = '';
								insideField = false;
							}
							else if(insideField == true && arrayFile[x][y] != '"'){
								placeholder += arrayFile[x][y];
							}
							else if(insideField == false && arrayFile[x][y] != ','){
								placeholder += arrayFile[x][y];
							}
							else if(insideField == false && arrayFile[x][y] == ',' && placeholder != ''){
								//nlapiLogExecution('DEBUG', 'Outside', placeholder);
								fieldValues.push(placeholder);
								placeholder = '';
							}
							
							//Check if it's the end of the line.
							/*if((y+1) == arrayFile[x].length){
								//nlapiLogExecution('DEBUG', 'Last - Outside', placeholder);
								fieldValues.push(placeholder);
								placeholder = '';
							}*/
						}
					}
				}
			}
			
			//Summarize the data parsed from the CSV file.
			for(var x = 0; x < fieldId.length; x++){
				nlapiLogExecution('DEBUG', 'Internal IDs', fieldId[x]);
			}
			for(var x = 0; x < fieldValues.length; x++){
				nlapiLogExecution('DEBUG', 'Field Values', fieldValues[x]);
			}
			
			// Define search filters
			var filters = new Array();
			filters[0] = new nlobjSearchFilter('type', null, 'anyof', 'PurchOrd');
			filters[1] = new nlobjSearchFilter('numbertext', null, 'is', poDocumentID);
			// Define search columns
			var columns = new Array();
			columns[0] = new nlobjSearchColumn('internalid');
			// Create the saved search
			var poSearch = nlapiCreateSearch('purchaseorder', filters, columns);
			
			//Run the search
			var poInternalID = '';
			
			poSearch.runSearch().forEachResult(function(result){
				poInternalID = result.getValue('internalid');
				return true;
			});
			nlapiLogExecution('DEBUG', 'Internal ID Search Result', poInternalID);
			
			vendorBill = nlapiTransformRecord('purchaseorder', poInternalID, 'vendorbill');
			
			nlapiLogExecution('DEBUG', 'Field ID', fieldId.length);
			nlapiLogExecution('DEBUG', 'FieldValues', fieldValues.length);
			
			var ptr = 0;	//Array pointer for the fieldValues array
			for(var x = 0; x < (fieldValues.length / fieldId.length); x++){
				//Select new Item line
				vendorBill.selectNewLineItem('item');
				for(var y = 0; y < fieldId.length; y++){
					//Add the item values according with the CSV file attached
					if(fieldId[y] == 'rate' || fieldId[y] == 'amount'){
						var currencyVal = Number(fieldValues[ptr].replace(/[^0-9.-]+/g,""));
						vendorBill.setCurrentLineItemValue('item', fieldId[y], currencyVal);
					}
					else if(fieldId[y] == 'item'){
						//Saved Search is generated since most likely, the items will come from a String.
						
						// Define search filters
						var filters = new Array();
						filters[0] = new nlobjSearchFilter('name', null, 'haskeywords', fieldValues[ptr]);
						// Define search columns
						var columns = new Array();
						columns[0] = new nlobjSearchColumn('internalid');
						// Create the saved search
						var itemSearch = nlapiCreateSearch('item', filters, columns);
						
						//Run the search
						var itemInternalID = '';
						itemSearch.runSearch().forEachResult(function(result){
							itemInternalID = result.getValue('internalid');
							return true;
						});
						vendorBill.setCurrentLineItemValue('item', fieldId[y], itemInternalID);
					}
					else{
						vendorBill.setCurrentLineItemValue('item', fieldId[y], fieldValues[ptr]);
					}
					ptr++;
				}
				//Commit the item line
				vendorBill.commitLineItem('item');
				nlapiLogExecution('DEBUG', 'Vendor bill line committed', x);
			}
			if(saveOnce == false){
				
				nlapiLogExecution('DEBUG', 'vendor bill count', vendorBill.getLineItemCount('item'));
				nlapiSubmitRecord(vendorBill, false, true); 
				nlapiLogExecution('DEBUG', 'Vendor bill saved', '-');
				saveOnce = true;
			}
		}
		catch(e){
			nlapiLogExecution('ERROR', 'Error', e);
		}
	}
	
	url = "https://tstdrv1389358.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=898&deploy=1&compid=TSTDRV1389358&h=7d5973838d498fc42762";
	url += "&custscript6=" + fromAddress;
	var response = nlapiRequestURL(url, null, null, null);
}