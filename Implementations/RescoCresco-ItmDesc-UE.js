/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'],
/**
 * @param {record} record
 * @param {runtime} runtime
 */
function(record, runtime, search) {
   
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
    	var rcrd = scriptContext.newRecord;
    	var execContext = runtime.executionContext;
    	
		//This probably came from SCIS. For now, the POS Status is used as an additional layer to make sure that the transaction came from the SCIS Application.
    	if(execContext == runtime.ContextType.WEBAPPLICATION && rcrd.getValue({ fieldId: 'custbody_ns_pos_transaction_status'}) != ''){
    		var count = rcrd.getLineCount({ sublistId: 'item'});
    		for(var x = 0; x < count; x++){
    			try{
    				//Check if the "Description" field is blank.
        			if(rcrd.getSublistValue({ sublistId: 'item', fieldId: 'description', line: x}) == ''){
        				//If blank, get the field value from the "NS ACS | Web Store Display Name" Custom Transaction Line field
        				rcrd.setSublistValue({ sublistId: 'item', fieldId: 'description', line: x, value: rcrd.getSublistValue({ sublistId: 'item', fieldId: 'custcol_nsacs_web_displayname', line: x})});
        				log.debug('Description set for Item ID ' + rcrd.getSublistValue({ sublistId: 'item', fieldId: 'item', line: x}), rcrd.getSublistValue({ sublistId: 'item', fieldId: 'custcol_nsacs_web_displayname', line: x}));
        			}
    			}
    			catch(e){
    				//Catch the error and see what happened.
    				log.error('Error occured. See details.', e);
    			}
    		}
    		
    		//Populate the PO Field referenced from the Customer Record.
    		var customerLookup = search.lookupFields({
    		    type: search.Type.CUSTOMER,
    		    id: rcrd.getValue({ fieldId: 'entity'}),
    		    columns: ['custentity_nsacs_ponum']
    		});
    		var lookUpPO = customerLookup['custentity_nsacs_ponum'];
    		if(lookUpPO != ''){
    			rcrd.setValue({ fieldId: 'custbody_nsacs_ponum_ref', value: lookUpPO});
    		}
    	}
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

    }

    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
        //afterSubmit: afterSubmit
    };
    
});
