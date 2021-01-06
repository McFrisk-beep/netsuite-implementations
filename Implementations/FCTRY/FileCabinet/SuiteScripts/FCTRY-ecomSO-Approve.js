/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/email', 'N/runtime', 'N/format'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, email, runtime, format) {
	
	//var emailList = ['zach@fctry.com','amanda@fctry.com','orly.trieber@amwarelogistics.com','rbaligod@netsuite.com','aamparado@netsuite.com'];
	//var emailList = ['rbaligod@netsuite.com'];
	var completedSavedSearchID = '4360';
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	//search: ACS | Ecomm Sales Order to be Approved - Item Search
    	//Adjust the ID accordingly.
    	var savedSearchID = '4182';
    	//681 - test account search
    	return search.load({
    		id: savedSearchID
    	});
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	//Get the Search results and process the Sales Orders from the results.
		/*log.debug({
			title: 'Returned by MAP',
			details: context
		});*/
    	
    	var searchResult = JSON.parse(context.value);
    	log.debug('Search Result', searchResult.values["MAX(internalid.transaction)"]);
    	var salesOrderID = searchResult.values["MAX(internalid.transaction)"];
    	
    	log.debug('searchResult | salesOrderID', searchResult + ' | ' + salesOrderID);
    	try{
        	approveSalesOrder(salesOrderID);
    	}
    	catch(e){
    		//Catch any errors here.
    		errorHandler(e, 'Map', salesOrderID);
    	}
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	//Summarize the data from the MAP/Reduce. For logging purposes.
    	log.audit('Summary Data', summary);
        log.audit({
            title: 'Usage units consumed', 
            details: summary.usage
        });
        log.audit({
            title: 'Concurrency',
            details: summary.concurrency
        });
        log.audit({
            title: 'Number of yields', 
            details: summary.yields
        });
    	var body = 'Hello,<br/><br/>Good day.<br/><br/>This is to inform you that the Map/Reduce script has completed successfully.<br/><br/>';
    	
        
		var soSearch = search.load({
			id: completedSavedSearchID
		});
		var ctr = 0;
		soSearch.run().each(function(result){
			//body += ctr + ': ' + result.getValue({ name: 'formulatext', summary: search.Summary.GROUP});
			//results.getValue(searchObj.getValue(columns[index]));
			ctr++;
			return true;
		});
		body += '<a href="https://system.na3.netsuite.com/app/common/search/savedsearch.nl?id=4360">Click here</a><br/>TOTAL SALES ORDERS APPROVED: ' + ctr;
    	
		log.debug('Suitelet - Notes', runtime.getCurrentScript().getParameter({ name: 'custscript_nsacs_email_list'}));
		var stringEmail = runtime.getCurrentScript().getParameter({ name: 'custscript_nsacs_email_list'});
		var emailStrHolder = '';
		var emailList = new Array();
		for(var x = 0; x < stringEmail.length; x++){
			if(stringEmail[x] != ','){
				emailStrHolder+= stringEmail[x];
			}
			else{
				emailList.push(emailStrHolder);
				emailStrHolder = '';
			}
			if((x+1) == stringEmail.length){
				emailList.push(emailStrHolder);
				emailStrHolder = '';
			}
		}
		log.debug('Array String', emailList);
		
		//var customerMail = result.getValue({ name: 'email', join: 'customer'});
    	var author = -5;
    	var recipients = emailList;
    	var subject = 'Map/Reduce script ID: ' + runtime.getCurrentScript().id + ' has successfully completed';
    	body += '<br/><br/>Thank you,<br/><br/>=====This is a system-generated e-mail=====';
    	email.send({
    		author: author,
    		recipients: recipients,
    		subject: subject,
    		body: body
    	});
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
    
    function approveSalesOrder(internalID){
    	//Load the Sales Order record
    	
    	var soRecord = record.load({
    		type: record.Type.SALES_ORDER,
    		id: internalID,
    		isDynamic: false
    	});
    	if(soRecord.getValue({ fieldId: 'orderstatus'}) == 'A'){
    		//If the Sales Order is 'Pending Approval', set it to 'Pending Fulfillment'
        	soRecord.setValue({ fieldId: 'orderstatus', value: 'B'});
        	soRecord.setValue({ fieldId: 'custbody_nsacs_mr_processed', value: true});
        	
        	var currentDate = new Date();
    		var mm = currentDate.getMonth()+1;	//+1 since January is tagged as zero (0). When setting the date, it's using the actual string values.
    		var dd = currentDate.getDate();
    		var yyyy = currentDate.getFullYear();
    		var dateString = mm + '/' + dd + '/' + yyyy;
    		var formattedDate = format.parse({ value: dateString, type: format.Type.DATE});
        	soRecord.setValue({ fieldId: 'custbody_nsacs_mr_process_date', value: formattedDate});
        	
        	log.debug('Order Status set to', soRecord.getValue({ fieldId: 'orderstatus'}));
        	log.debug('SO Processed?', soRecord.getValue({ fieldId: 'custbody_nsacs_mr_processed'}));
        	log.debug('SO Date', soRecord.getValue({ fieldId: 'custbody_nsacs_mr_process_date'}));
			soRecord.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});
    	}
    	else{
    		log.debug('Order Status is not Pending Approval for Sales Order ' + internalID, 'Status: ' + soRecord.getValue({ fieldId: 'orderstatus'}));
    	}
    }
    
    function errorHandler(e, stage, internalID){
    	log.error('Transaction processing failed.', 'Stage: ' + stage + ' SO internal ID ' + internalID + ' | Details: ' + e);
    	
		var stringEmail = runtime.getCurrentScript().getParameter({ name: 'custscript_nsacs_email_list'});
		var emailStrHolder = '';
		var emailList = new Array();
		for(var x = 0; x < stringEmail.length; x++){
			if(stringEmail[x] != ','){
				emailStrHolder+= stringEmail[x];
			}
			else{
				emailList.push(emailStrHolder);
				emailStrHolder = '';
			}
			if((x+1) == stringEmail.length){
				emailList.push(emailStrHolder);
				emailStrHolder = '';
			}
		}
		log.debug('Array String', emailList);
    	
    	var author = -5;
    	var recipients = emailList;
    	var subject = 'Map/Reduce script ID: ' + runtime.getCurrentScript().id + ' failed on Stage: ' + stage;
    	var body = 'An error occurred. More details below\n\nSales Order internal ID: ' + internalID + '\n\n' + e;
    	email.send({
    		author: author,
    		recipients: recipients,
    		subject: subject,
    		body: body
    	});
    }
});
