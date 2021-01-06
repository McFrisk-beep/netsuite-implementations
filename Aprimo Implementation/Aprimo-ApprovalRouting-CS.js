/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/dialog', 'N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 * @param {dialog} dialog
 */
function(record, search, dialog, runtime) {
    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	var poForm = scriptContext.currentRecord;
    	var fieldId = scriptContext.fieldId;
    	log.debug('client script logging');
    	
		if(fieldId == 'employee'){
    		//var currentEmployee = runtime.getCurrentUser().id;
			try{
	    		var employeeSearch = record.load({
	    			type: record.Type.EMPLOYEE,
	    			id: poForm.getValue({ fieldId: 'employee'})
	    		});
				var nextApproverEmployee = record.load({
					type: record.Type.EMPLOYEE,
					id: employeeSearch.getValue('purchaseorderapprover')
				});
	    		
				poForm.setValue({ fieldId: 'nextapprover', value: nextApproverEmployee.getValue('id')});
			}
			catch(e){
				poForm.setValue({ fieldId: 'nextapprover', value: ''});
			}
		}
    }

    return {
        fieldChanged: fieldChanged
    };
    
});
