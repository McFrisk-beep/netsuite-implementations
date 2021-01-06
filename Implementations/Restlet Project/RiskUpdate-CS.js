/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
/**
 * @param {record} record
 * @param {runtime} runtime
 */
function(record) {

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {
    	//12 - green, 11 - yellow, 10 - red
    	//custentity14 - risk status | 3 - green, 2 - yellow, 1 - red
    	
    	var notesRecord = scriptContext.currentRecord;
    	var noteType = notesRecord.getCurrentSublistValue({
    		sublistId: 'usernotes',
    		fieldId: 'notetype'
    	});
    	
    	if(noteType == '12'){
    		notesRecord.setValue({
    			fieldId: 'custentity14',
    			value: '3'
    		});
    	}
    	else if(noteType == '11'){
    		notesRecord.setValue({
    			fieldId: 'custentity14',
    			value: '2'
    		});
    	}
    	else if(noteType == '10'){
    		notesRecord.setValue({
    			fieldId: 'custentity14',
    			value: '1'
    		});
    	}
    }

    return {
        sublistChanged: sublistChanged
    };
    
});
