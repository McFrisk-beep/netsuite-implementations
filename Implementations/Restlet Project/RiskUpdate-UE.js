/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
/**
 * @param {record} record
 * @param {runtime} runtime
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
    function afterSubmit(scriptContext) {
    	var notesRecord = scriptContext.newRecord;
    	var noteType = notesRecord.getValue({
    		fieldId: 'notetype'
    	});
    	
    	if(noteType == '12'){
    		var custRec = record.submitFields({
    			type: 'customer',
    			id: notesRecord.getValue({
    				fieldId: 'entity'
    			}),
    			values: {
    				'custentity14' : '3'
    			}
    		});
    	}
    	else if(noteType == '11'){
    		var custRec = record.submitFields({
    			type: 'customer',
    			id: notesRecord.getValue({
    				fieldId: 'entity'
    			}),
    			values: {
    				'custentity14' : '2'
    			}
    		});
    	}
    	else if(noteType == '10'){
    		var custRec = record.submitFields({
    			type: 'customer',
    			id: notesRecord.getValue({
    				fieldId: 'entity'
    			}),
    			values: {
    				'custentity14' : '1'
    			}
    		});
    	}
    }

    return {
        afterSubmit: afterSubmit
    };
    
});
