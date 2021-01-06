/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/dialog', 'N/error', 'N/currentRecord', 'N/runtime'],
/**
 * @param {record} record
 */
function(record, dialog, error, currentRecord, runtime) {

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
    	var rcrd = scriptContext.currentRecord;
    	
    	try{
    		if(rcrd.getCurrentSublistValue({
    			sublistId: 'item',
    			fieldId: 'department'
    		}) == '126' && runtime.getCurrentUser().role != '3'){
    			if(rcrd.getCurrentSublistValue({
    				sublistId: 'item',
    				fieldId: 'class'
    			}) == '' || rcrd.getCurrentSublistValue({
    				sublistId: 'item',
    				fieldId: 'class'
    			}) == null){
    				dialog.alert({
    					title: 'Alert!',
    					message: 'Please enter a value for Class.'
    				});
    				return false;
    			}
    		}
    		
    		if((rcrd.getCurrentSublistValue({
    			sublistId: 'item',
    			fieldId: 'department'
    		}) == '129' || rcrd.getCurrentSublistValue({
    			sublistId: 'item',
    			fieldId: 'department'
    		}) == '126') && runtime.getCurrentUser().role != '3'){
    			if(rcrd.getCurrentSublistValue({
    				sublistId: 'item',
    				fieldId: 'location'
    			}) == '' || rcrd.getCurrentSublistValue({
    				sublistId: 'item',
    				fieldId: 'location'
    			}) == null){
    				dialog.alert({
    					title: 'Alert!',
    					message: 'Please enter a value for Location.'
    				});
    				return false;
    			}
    		}
    	}
    	catch(e){
            log.error('Error encountered.', 'Theres an error.');
    		//Department or Class field does not exist on the form. Skips the entire operation and returns 'true' instead.
    	}
    	return true;
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
    	var rcrd = scriptContext.currentRecord;
    	
    	var count = rcrd.getLineCount({
    		sublistId: 'item'
    	});
    	
    	for(var x = 0; x < count; x++){
    		if(rcrd.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'department',
    			line: x
    		}) == '126' && runtime.getCurrentUser().role != '3' && (rcrd.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'class',
    			line: x
    		}) == '' || rcrd.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'class',
    			line: x
    		}) == null)){
				dialog.alert({
					title: 'Alert!',
					message: 'Please enter a value for Class for Item: ' + rcrd.getSublistText({
						sublistId: 'item',
						fieldId: 'item',
						line: x
					}) + '.'
				});
				return false;
    		}
    		
    		if((rcrd.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'department',
    			line: x
    		}) == '129' || rcrd.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'department',
    			line: x
    		}) == '126') && runtime.getCurrentUser().role != '3' && (rcrd.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'location',
    			line: x
    		}) == '' || rcrd.getSublistValue({
    			sublistId: 'item',
    			fieldId: 'location',
    			line: x
    		}) == null)){
				dialog.alert({
					title: 'Alert!',
					message: 'Please enter a value for Location for Item: ' + rcrd.getSublistText({
						sublistId: 'item',
						fieldId: 'item',
						line: x
					}) + '.'
				});
				return false;
    		}
    	}
    	
    	return true;
    }

    return {
        validateLine: validateLine,
        saveRecord: saveRecord
    };
    
});
