/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/error'],
/**
 * @param {record} record
 * @param {runtime} runtime
 */
function(record, search, runtime, error) {

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
    	try{
        	var currRec = scriptContext.newRecord;
        	var oldRec = scriptContext.oldRecord;
        	if(scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.COPY){
        		var recordId = currRec.getValue({ fieldId: 'id'});
        		if(recordId == '' || recordId == null){
        			currRec.setValue({ fieldId: 'custbody_firststatus', value: currRec.getText({ fieldId: 'entitystatus'})});
        		}
        	}
        	else if(scriptContext.type == scriptContext.UserEventType.EDIT){
        		// && runtime.getCurrentUser().role != '3'
        		
        		try{
        			if(currRec.getValue({fieldId: 'custbody_firststatus'}) != oldRec.getValue({ fieldId: 'custbody_firststatus'})){
        				log.debug('current value', currRec.getValue({ fieldId: 'custbody_firststatus'}));
        				log.debug('old value', currRec.getValue({ fieldId: 'custbody_firststatus'}));
        	            var errorObj = error.create({
        	                name: 'FIRSTSTATUS_CHANGED',
        	                message: 'First Status value has been changed.',
        	                notifyOff: true
        	            });
        			}
        		}
        		catch(f){
                    var errObj = error.create({name : error.Type.VALUE_CHANGED, message : 'First Status is modified.', notifyOff: false});                 
                    log.error('Error: ' + errObj.name , errObj.message);
                    throw errObj;
        		}
        	}
    	}
    	catch(e){
    		log.error('Error encountered on Saving the record.', e);
    	}
    }

    return {
        beforeSubmit: beforeSubmit
    };
    
});
