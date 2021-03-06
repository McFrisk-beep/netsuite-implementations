/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
   
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
    	
    }

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
    	
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
    	var oldform = scriptContext.newRecord;
    	var rcrd = record.load({
    		type: record.Type.SALES_ORDER,
    		id: oldform.getValue({ fieldId: 'id'}),
    		isDynamic: true
    	});
    	var lines = rcrd.getLineCount({ sublistId: 'item'});
    	try{
        	for(var x = 0; x < lines; x++){
        		if((x+1) == lines){
        			rcrd.removeLine({
        				sublistId: 'item',
        				line: x,
        				ignoreRecalc: false
        			});
        			rcrd.save();
        		}
        	}
        	log.debug('Success', 'no errors');
    	}
    	catch(e){
    		log.error('Error', e);
    	}
    }

    return {
        //beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
