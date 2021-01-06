/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/error', 'N/search'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {dialog} dialog
 */
function(record, runtime, error, search) {
   
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
    	var formRecord = scriptContext.newRecord;
    	if(scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.COPY || scriptContext.type == scriptContext.UserEventType.CREATE){
    		var recType = formRecord.type;
    		var locationSearch = search.create({
    			type: 'location',
    			columns: ['internalid', 'name', 'custrecord1']
    		});
    		
    		if(recType == 'vendorbill'){
    			log.debug('Vendor Bill record type');
        		var sublistCount = formRecord.getLineCount({ sublistId: 'item'});
        		for(var x = 0; x < sublistCount; x++){
            		locationSearch.run().each(function(result){
            			if(result.getValue({ name: 'internalid'}) == formRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: x}) && result.getValue({ name: 'custrecord1'}) == true){
            				//throw 'One or more of the Cost Centers from the Item sublist is invalid. Please change the Cost Centers and try saving again.';
            				throw 'The Cost Center Location "' + result.getValue({ name: 'name'}) + '" cannot be added to this record. Please try changing the Cost Centers and try saving again.';
            				return false;
            			}
            			return true;
            		});
        		}
        		
        		sublistCount = formRecord.getLineCount({ sublistId: 'expense'});
        		for(var x = 0; x < sublistCount; x++){
            		locationSearch.run().each(function(result){
            			if(result.getValue({ name: 'internalid'}) == formRecord.getSublistValue({ sublistId: 'expense', fieldId: 'location', line: x}) && result.getValue({ name: 'custrecord1'}) == true){
            				//throw 'One or more of the Cost Centers from the Expense sublist is invalid. Please change the Cost Centers and try saving again.';
            				throw 'The Cost Center Location "' + result.getValue({ name: 'name'}) + '" cannot be added to this record. Please try changing the Cost Centers and try saving again.';
            				return false;
            			}
            			return true;
            		});
        		}
    		}
    		else if(recType == 'journalentry'){
    			log.debug('Journal Entry record type');
        		var sublistCount = formRecord.getLineCount({ sublistId: 'line'});
        		for(var x = 0; x < sublistCount; x++){
            		locationSearch.run().each(function(result){
            			if(result.getValue({ name: 'internalid'}) == formRecord.getSublistValue({ sublistId: 'line', fieldId: 'location', line: x}) && result.getValue({ name: 'custrecord1'}) == true){
            				//throw 'One or more of the Cost Centers from the Line sublist is invalid. Please change the Cost Centers and try saving again.';
            				throw 'The Cost Center Location "' + result.getValue({ name: 'name'}) + '" cannot be added to this record. Please try changing the Cost Centers and try saving again.';
            				return false;
            			}
            			return true;
            		});
        		}
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
