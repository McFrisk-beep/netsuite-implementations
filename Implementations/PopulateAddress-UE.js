/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
/**
 * @param {record} record
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
        	var custObj = scriptContext.newRecord;
        	var lineCount = custObj.getLineCount({ sublistId: 'addressbook'});
        	custObj.insertLine({ sublistId: 'addressbook', line: lineCount});
        	custObj.setSublistValue({ sublistId: 'addressbook', fieldId: 'label', line: lineCount, value: 'Primary Address'});
        	var addrSubrecord = custObj.getSublistSubrecord({ sublistId: 'addressbook', line: lineCount, fieldId: 'addressbookaddress'});
        	addrSubrecord.setValue({ fieldId: 'addr1', value: custObj.getValue({ fieldId: 'custentity_address'})});
        	addrSubrecord.setValue({ fieldId: 'city', value: custObj.getValue({ fieldId: 'custentity_state'})});
        	addrSubrecord.setValue({ fieldId: 'zip', value: custObj.getValue({ fieldId: 'custentity_postalcode'})});
        	addrSubrecord.setValue({ fieldId: 'state', value: custObj.getValue({ fieldId: 'custentity_county'})});
    	}
    }

    return {
        beforeSubmit: beforeSubmit
    };
    
});
