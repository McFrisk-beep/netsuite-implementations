/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/dialog', 'N/runtime'],
/**
 * @param {search} search
 * @param {dialog} dialog
 */
function(search, dialog, runtime) {
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
    	//1026 - Headspace Controller
		var currRec = scriptContext.currentRecord;
    	if(runtime.getCurrentUser().role != '3' && scriptContext.fieldId == 'approved'){
    		if(currRec.id == '' && currRec.getValue({ fieldId: 'approved'}) == true){
    			dialog.alert({
    				title: 'Alert',
    				message: 'You cannot approve your own Journal Entry.'
    			});
    	    	log.debug('Self-Approval function trigger', 'New Record self-approval');
    			return false;
    		}
    	}
    	return true;
    }

    return {
        validateField: validateField
    };
    
});
