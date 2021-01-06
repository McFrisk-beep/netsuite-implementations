/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
/**
 * @param {email} email
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
    	//account 767 = 1040 Amazon Clearing
    	if(scriptContext.type == scriptContext.UserEventType.CREATE){
    		log.debug('New record creation.');
    		var cashRecord = scriptContext.newRecord;
    		var channelSaleChannel = cashRecord.getValue({ fieldId: 'custbody_ca_sales_source'});
    		var channelFbaOrder = cashRecord.getValue({ fieldId: 'custbody_ca_fba_order'});
    		if(channelSaleChannel == 'AMAZON_US' || channelFbaOrder == true){
    			cashRecord.setValue({ fieldId: 'account', value: '767'});
    			log.debug('Account updated to 1040 Amazon Clearing.');
    		}
    	}
    }

    return {
    	beforeSubmit: beforeSubmit
    };
    
});
