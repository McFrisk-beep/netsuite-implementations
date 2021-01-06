/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/email'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime, email) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	//Saved Search name: ACS | Revenue Arrangements with Failed Plans
    	var searchId = '877';
    	var scriptObj = runtime.getCurrentScript();		//Usage monitor. Scheduled script has 10,000 units.
    	
    	var revArrSearch = search.load({ id: searchId });
    	var ctr = 0;
    	var submittedArray = new Array();
		revArrSearch.run().each(function(result){ 
	    	//If script has less than 1000 governance units, don't run anything anymore.
	    	if(scriptObj.getRemainingUsage() > 1000){
	    		var sourceid = result.getValue({ name: 'internalid', summary: 'GROUP', join: 'sourceTransaction'});
	    		var tranid = result.getValue({ name: 'tranid', summary: 'GROUP', join: 'revenueArrangement'});
	    		var revStartDate = result.getValue({ name: 'custcol_rev_rec_start_date', summary: 'GROUP', join: 'revenueArrangement'});
	    		var revEndDate = result.getValue({ name: 'custcol_rev_rec_end_date', summary: 'GROUP', join: 'revenueArrangement'});
	    		var srcStartDate = result.getValue({ name: 'custcol_rev_rec_start_date', summary: 'GROUP', join: 'sourceTransaction'});
	    		var srcEndDate = result.getValue({ name: 'custcol_rev_rec_end_date', summary: 'GROUP', join: 'sourceTransaction'});
	    		var revInternalID = result.getValue({ name: 'internalid', summary: 'GROUP', join: 'revenueArrangement'});
	    		var changeFlag = false;
	    		
	    		//Data-check Sanity Testing
	    		log.debug('source id | tranid | revStartDate | revEndDate | srcStartDate | srcEndDate | revInternalID', sourceid + ' | ' + tranid + ' | ' + revStartDate + ' | ' + revEndDate + ' | ' + srcStartDate + ' | ' + srcEndDate + ' | ' + revInternalID);
	    		
	    		var revArrRecord = record.load({
	    			type: record.Type.REVENUE_ARRANGEMENT,
	    			id: revInternalID
	    		});
	    		
	    		var lines = revArrRecord.getLineCount({ sublistId: 'revenueelement'});
	    		for(var x = 0; x < lines; x++){
	    			if(revStartDate == ''){
	    				srcStartDate = new Date(srcStartDate);
	    				revArrRecord.setSublistValue({
	    					sublistId: 'revenueelement',
	    					fieldId: 'revrecstartdate',
	    					line: x,
	    					value: srcStartDate
	    				});
	    				changeFlag = true;
	    				log.debug('Field changed Rev Rec Start Date', srcStartDate);
	    			}
	    			if(revEndDate == ''){
	    				srcEndDate = new Date(srcEndDate);
	    				revArrRecord.setSublistValue({
	    					sublistId: 'revenueelement',
	    					fieldId: 'revrecenddate',
	    					line: x,
	    					value: srcEndDate
	    				});
	    				changeFlag = true;
	    				log.debug('Field changed Rev Rec End Date', srcEndDate);
	    			}
                  if(revArrRecord.getSublistValue({ sublistId: 'revenueelement', fieldId: 'forecaststartdate', line: x}) == ''){
                      revArrRecord.setSublistValue({ sublistId: 'revenueelement', fieldId: 'forecaststartdate', line: x, value: srcStartDate});
                      log.debug('Field change Forecast Start Date', srcStartDate);
                    changeFlag = true;
                  }
                  if(revArrRecord.getSublistValue({ sublistId: 'revenueelement', fieldId: 'forecastenddate', line: x}) == ''){
                      revArrRecord.setSublistValue({ sublistId: 'revenueelement', fieldId: 'forecastenddate', line: x, value: srcEndDate});
                      log.debug('Field changed Forecast End Date', srcEndDate);
                    changeFlag = true;
                  }
	    		}
	    		
	    		try{
		    		if(changeFlag == true){
		    			//var updatedRevArrRecord = 'Rev Arr ID ' + revInternalID + ' updated. [TEST MODE]';
		    			var updatedRevArrRecord = revArrRecord.save({
		    			    enableSourcing: true,
		    			    ignoreMandatoryFields: true
		    			});
		    			log.debug('Revenue Arrangement successfully saved!', 'Internal ID: ' + updatedRevArrRecord + ' | Document number: ' + tranid);
		    			submittedArray.push(tranid);
		    		}
	    		}
	    		catch(e){
	    			log.error('Error occured during Record Save.', e);
	    		}
	    		
	    		ctr++;
	    		//log.debug('Usage limit remaining: ' + scriptObj.getRemainingUsage(), 'Pass ' + ctr);
	    		
	    		//Script for testing on one (1) transaction at a time. Uncomment for testing purposes.
	    		/*if(changeFlag == true){
	    			return false;
	    		}
	    		else{
	    			return true;
	    		}*/
	    		
	    		return true;
	    	}
	    	else{
	    		//Exit loop. Marks the end of the Scheduled script instance.
	    		if(submittedArray.length != 0){
		        	var str = '\n';
		        	for(var x = 0; x < submittedArray.length; x++){
		        		str += (x+1) + ') ' + submittedArray[x] + '\n';
		        	}
		        	email.send({
		        		author: -5,
		        		recipients: '39138',
		        		subject: '(Scheduled Script) Revenue Arrangements Adjusted',
		        		body: 'The following Revenue Arrangements has their Rev Rec Start/End Dates adjusted accordingly. Please see the following transactions below:\n' + str + '\n\n===THIS IS A SCRIPT-GENERATED MESSAGE==='
		        	});
	    		}
	        	
	    		return false;
	    	}
		});
		
		if(submittedArray.length != 0){
        	var str = '\n';
        	for(var x = 0; x < submittedArray.length; x++){
        		str += (x+1) + ') ' + submittedArray[x] + '\n';
        	}
        	email.send({
        		author: -5,
        		recipients: '39138',
        		subject: '(Scheduled Script) Revenue Arrangements Adjusted',
        		body: 'The following Revenue Arrangements has their Rev Rec Start/End Dates adjusted accordingly. Please see the following transactions below:\n' + str + '\n\n===THIS IS A SCRIPT-GENERATED MESSAGE==='
        	});
		}
    }

    return {
        execute: execute
    };
    
});