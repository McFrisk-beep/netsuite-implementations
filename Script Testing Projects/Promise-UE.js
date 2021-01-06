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
    	var promiseObj = new Promise(function(resolve, reject){
    		resolve('resolved');
    	});
    	
    	promiseObj.then(function(value){
    		log.debug('Inside then function', value);
    	});
    	
    	log.debug('On the regular log debug', promiseObj);
    }

    return {
    	beforeSubmit: beforeSubmit
    };
    
});
