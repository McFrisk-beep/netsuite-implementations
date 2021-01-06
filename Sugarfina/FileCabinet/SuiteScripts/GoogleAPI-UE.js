/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/https'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, https) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
    	//AIzaSyDX3MURo9-fFyeecgXV0ZWovcv6DxsV71Y = Personal Google Geocoding API Key [1 use per day] :(
    	//AIzaSyAOA1oWGtpNGEUYdKFsu3R3TMrxd7UP1dc = Customer Google Geocoding API Key
    	var API_KEY = 'AIzaSyAOA1oWGtpNGEUYdKFsu3R3TMrxd7UP1dc';
    	
    	var rcrd = scriptContext.newRecord;
    	var address = '';
    	
    	for(var x = 0; x < rcrd.getLineCount({ sublistId: 'addressbook'}); x++){
        	var addressSubRecord = rcrd.getSublistSubrecord({
        		sublistId: 'addressbook',
        		fieldId: 'addressbookaddress',
        		line: x
        	});
			address += addressSubRecord.getValue({ fieldId: 'addr1'}) + ' ';
			address += addressSubRecord.getValue({ fieldId: 'addr2'}) + ' ';
			address += addressSubRecord.getValue({ fieldId: 'city'}) + ' ';
			address += addressSubRecord.getValue({ fieldId: 'state'}) + ' ';
			address += addressSubRecord.getValue({ fieldId: 'zip'}) + ' ';
			address += addressSubRecord.getValue({ fieldId: 'country'});
			var replaced = address.split(' ').join('+');
			log.debug('Address sent to Google', replaced);
			
	    	try{
	        	var response = https.request({
	        	    method: https.Method.GET,
	        	    url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + replaced + '&sensor=false&key=' + API_KEY
	        	});
	        	log.debug('Body', response.body);
	        	log.debug('Response', response);
	        	
	        	var rpBody = response.body;
	        	rpBody = JSON.parse(rpBody);
	        	
	        	//Check if Google Returned an error. Otherwise, get the Latitude and Longitude from the Map.
	        	if(rpBody.error_message != null){
	        		log.error('Error ocurred.', rpBody.error_message);
	        	}
	        	else{
	            	var latitude = rpBody.results[0].geometry.location.lat;
	            	var longitude = rpBody.results[0].geometry.location.lng;
	            	
	            	addressSubRecord.setValue({ fieldId: 'custrecord_nsacs_lat', value: latitude});
	            	addressSubRecord.setValue({ fieldId: 'custrecord_nsacs_long', value: longitude});
	            	address = '';
	        	}
	    	}
	    	catch(e){
	    		log.error('Error', e);
	    	}
    	}
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
    	
    }

    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    };
    
});
