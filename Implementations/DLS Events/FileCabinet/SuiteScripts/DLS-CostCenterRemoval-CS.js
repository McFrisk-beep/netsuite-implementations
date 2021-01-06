/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/transaction', 'N/ui/dialog', 'N/currentRecord'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {transaction} transaction
 * @param {serverWidget} serverWidget
 */
function(record, runtime, search, transaction, dialog, currentRecord) {
    
	/*
	 * AP Bill - nlapiGetCurrentLineItemValue('expense','location')
	 * Journal Entry - nlapiGetCurrentLineItemValue('line','location')
	 * AR Invoices - nlapiGetFieldValue('location')
	 */
	
    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {
    	var formRecord = scriptContext.currentRecord;
    	var fieldId = scriptContext.fieldId;
    	var shouldAlert = false;
    	
    	//'3' is an Administrator role. Users that are NOT an Administrator will see this restriction.
    	if(runtime.getCurrentUser().role == '3'){
    		var locationSearch = search.create({
    			type: 'location',
    			columns: ['internalid', 'name', 'custrecord1']
    		});
    		if(fieldId == 'location'){
    			//AR Invoice
        		locationSearch.run().each(function(result){
        			if(result.getValue({ name: 'internalid'}) == formRecord.getValue({ fieldId: 'location'}) && result.getValue({ name: 'custrecord1'}) == true){
        				shouldAlert = true;
        			}
        			return true;
        		});
    		}
    	}
    	
    	if(shouldAlert == true){
    		dialog.alert({
    			title: 'Alert!',
    			message: 'Invalid Cost Center selected. Please change the value of the Cost Center.'
    		});
    		formRecord.setValue({ fieldId: 'location', value: ''});
    	}
    	return true;
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
    	var formRecord = scriptContext.currentRecord;
    	var sublistFieldId = scriptContext.sublistId;
    	var shouldAlert = false;
    	var locationSearch = search.create({
    		type: 'location',
    		columns: ['internalid', 'name', 'custrecord1']
    	});
    	
    	//Role ID 1013 = DLS General Manager
    	if(runtime.getCurrentUser().role == '3'){
    		if(sublistFieldId == 'expense'){
    			//AP Bill
        		locationSearch.run().each(function(result){
        			if(result.getValue({ name: 'internalid'}) == formRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'location'}) && result.getValue({ name: 'custrecord1'}) == true){
        				shouldAlert = true;
        			}
        			return true;
        		});
    		}
    		else if(sublistFieldId == 'line'){
    			//Journal Entry
        		locationSearch.run().each(function(result){
        			if(result.getValue({ name: 'internalid'}) == formRecord.getCurrentSublistValue({ sublistId: 'line', fieldId: 'location'}) && result.getValue({ name: 'custrecord1'}) == true){
        				shouldAlert = true;
        			}
        			return true;
        		});
    		}
    		else if(sublistFieldId == 'item'){
    			//AP Bill - Item
        		locationSearch.run().each(function(result){
        			if(result.getValue({ name: 'internalid'}) == formRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'location'}) && result.getValue({ name: 'custrecord1'}) == true){
        				shouldAlert = true;
        			}
        			return true;
        		});
    		}
    	}
    	
    	if(shouldAlert == true){
    		dialog.alert({
    			title: 'Alert!',
    			message: 'Invalid Cost Center selected. Please change the value of the Cost Center.'
    		});
    		return false;
    	}
    	else{
    		return true;
    	}
    }
    
    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	var formRecord = scriptContext.currentRecord;
    	var fieldId = scriptContext.fieldId;
    	var shouldAlert = false;
		var recType = formRecord.type;
    	
    	if(runtime.getCurrentUser().role == '3' && recType == 'invoice'){
    		log.debug('conditions met on invoice save');
    		if(fieldId == 'location'){
    			//AR Invoice
        		locationSearch.run().each(function(result){
        			if(result.getValue({ name: 'internalid'}) == formRecord.getValue({ fieldId: 'location'}) && result.getValue({ name: 'custrecord1'}) == true){
        				shouldAlert = true;
        			}
        			return true;
        		});
    		}
    	}
    	
    	if(shouldAlert == true){
    		dialog.alert({
    			title: 'Alert!',
    			message: 'Invalid Cost Center selected. Please change the value of the Cost Center.'
    		});
    		formRecord.setValue({ fieldId: 'location', value: ''});
    		return false;
    	}
    	else{
    		return true;
    	}
    }

    return {
        validateField: validateField,
        validateLine: validateLine,
        saveRecord: saveRecord
    };
    
});
