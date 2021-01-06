/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/ui/dialog', 'N/record'],
/**
 * @param {record} record
 * @param {runtime} runtime
 */
function(runtime, dialog, record) {
	
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
	var items = new Array();
    function pageInit(scriptContext) {
    	var currRec = scriptContext.currentRecord;
		var lines = currRec.getLineCount({ sublistId: 'item'});
		for(var x = 0; x < lines; x++){
			items.push(currRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: x}));
		}
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
    	var currRec = scriptContext.currentRecord;
		/*dialog.alert({
			title: 'Alert',
			message: items[currRec.getCurrentSublistIndex({ sublistId: 'item'})]//currRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: (currRec.getCurrentSublistIndex({ sublistId: 'item'})- 1)})
		});*/
    	if(runtime.getCurrentUser().role == '1018'){
    		if(items[currRec.getCurrentSublistIndex({ sublistId: 'item'})] != currRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item'})){
    			dialog.alert({
    				title: 'Alert',
    				message: 'Cannot add a new item.'
    			});
    			return false;
    		}
        	if((currRec.getCurrentSublistIndex({ sublistId: 'item'}) + 1) > currRec.getLineCount({ sublistId: 'item'})){
    			dialog.alert({
    				title: 'Alert',
    				message: 'Cannot add another item.'
    			});
            	return false;
        	}
        	else{
        		return true;
        	}
    	}
    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {
    	if(runtime.getCurrentUser().role == '1018'){
			dialog.alert({
				title: 'Alert',
				message: 'Cannot delete an item.'
			});
        	return false;
    	}
    	else{
    		return true;
    	}
    }

    return {
    	pageInit: pageInit,
        validateLine: validateLine,
        validateDelete: validateDelete
    };
    
});
