/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record) {
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
    	if(scriptContext.type == scriptContext.UserEventType.CREATE){
        	var leadRecord = scriptContext.newRecord;
        	leadRecord.setValue({ fieldId: 'taxitem', value: '-886'});	//Internal ID of the tax item
        	log.debug('Script Execution', 'Tax item set to ' + leadRecord.getValue({ fieldId: 'taxitem'}));
    	}
    }

    return {
        beforeSubmit: beforeSubmit
    };
    
});
