/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/dialog', 'N/search'],
/**
 * @param {record} record
 */
function(record, dialog, search) {

	/*
	 * 10/4/2018 - Raphael Baligod - NS Case 3165794
	 */
	
    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	var currRec = scriptContext.currentRecord;
    	//Get sublist data
		var lines = currRec.getLineCount({ sublistId: 'custpage_collectionnotes'});
		
		//Check if both fields are empty.
		if(currRec.getValue({ fieldId: 'custpage_enternote'}) == '' && currRec.getValue({ fieldId: 'custpage_collectionstatus'}) == '0'){
			dialog.alert({
				title: 'Alert',
				message: 'Collection Note and Collection Status cannot be blank.'
			});
			return false;
		}
		else{
			return true;
		}
    }

    return {
        saveRecord: saveRecord
    };
    
});
