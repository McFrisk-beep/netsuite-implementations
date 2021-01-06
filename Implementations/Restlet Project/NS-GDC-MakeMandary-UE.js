/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/ui/dialog'],
/**
 * @param {error} error
 * @param {record} record
 */
function(record, runtime, dialog) {
   
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
    	/**195 = custom invoice ID (preferred)
    	 * 107 = custom credit memo ID (preferred)
    	 * 
    	 * 129 = Corp-21 (department)
    	 * 126 = Corp-22
    	 */
    	try{
        	if(scriptContext.type == scriptContext.UserEventType.EDIT){
            	if(runtime.getCurrentUser().role != '3'){
                	scriptContext.form.getSublist('item').getField('department').updateDisplayType({
                		displayType: 'disabled'
                	});
            	}
        	}
        	else if(scriptContext.type == scriptContext.UserEventType.CREATE){
        		
        		if(runtime.getCurrentUser().role != '3'){
                	scriptContext.form.getSublist('item').getField('department').updateDisplayType({
                		displayType: 'disabled'
                	});
        		}
        	}
        	else if(scriptContext.type == scriptContext.UserEventType.COPY){
        		
        		if(runtime.getCurrentUser().role != '3'){
                	scriptContext.form.getSublist('item').getField('department').updateDisplayType({
                		displayType: 'disabled'
                	});
        		}
        	}
    	}
    	catch(e){
    		//Fields doesn't exist on the item sublist. Skips the entire code-logic.
    		/*log.debug('Form log', scriptContext.newRecord.getValue({
    			fieldId: 'customform'
    		}));*/
    	}
    }

    return {
        beforeLoad: beforeLoad
    };
    
});
