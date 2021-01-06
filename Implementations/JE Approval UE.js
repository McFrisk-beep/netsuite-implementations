/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime'],

function(runtime) {
   
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
    	//Controller internal id = 1026
    	var newJE = scriptContext.newRecord;
    	if(scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.COPY){
    		log.debug('User Role Accessed page', runtime.getCurrentUser().role);
    		if(runtime.getCurrentUser().role == '3' || runtime.getCurrentUser().role == '1026'){
    			//Do nothing. Users has the checkbox editable
    		}
    		else{
    			log.debug('Approval', 'Disabled');
            	scriptContext.form.getField('approved').updateDisplayType({
            		displayType: 'disabled'
            	});
    		}
    	}
    	if(scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.COPY){
    		newJE.setValue({
    			fieldId: 'approved',
    			value: false
    		});
    	}
    }

    return {
        beforeLoad: beforeLoad
    };
    
});
