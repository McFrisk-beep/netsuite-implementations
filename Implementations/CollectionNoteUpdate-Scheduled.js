/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/dialog', 'N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 * @param {dialog} dialog
 */
function(record, search, dialog, runtime) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	log.debug('Suitelet - Notes', runtime.getCurrentScript().getParameter({ name: 'custscript_colnotes'}));
    	log.debug('Suitelet - Status', runtime.getCurrentScript().getParameter({ name: 'custscript_colstatus'}));
    	log.debug('Suitelet - Invoice List', runtime.getCurrentScript().getParameter({ name: 'custscript_invlist'}));
    	
    	var updateNotes = runtime.getCurrentScript().getParameter({ name: 'custscript_colnotes'});
    	var updateColStatus = runtime.getCurrentScript().getParameter({ name: 'custscript_colstatus'});
    	var invList = runtime.getCurrentScript().getParameter({ name: 'custscript_invlist'});
    	var invArr = new Array();
    	
    	//Splicing invoice numbers than doing a search is quicker. Saved around 40% on time efficiency as opposed to searching for values.
    	var invoiceNum = '';
    	for(var x = 0; x < invList.length; x++){
			if(invList[x] != ','){
				invoiceNum += invList[x];
			}
			else{
				invArr.push(invoiceNum);
				log.debug('Loop - Invoice', invoiceNum);
				invoiceNum = '';
			}
    	}
		invArr.push(invoiceNum);
		log.debug('Outside Loop - Invoice', invoiceNum);
		log.debug('Array length', invArr.length);
		
		for(var x = 0; x < invArr.length; x++){
			var lookUpFields = search.lookupFields({
				type: search.Type.INVOICE,
				id: invArr[x],
				columns: 'custbody_collection_note'
			});
			
			if(updateNotes == '' || updateNotes == null){
				//do nothing
			}
			else{
				var lookUpNoteEntity = lookUpFields['custbody_collection_note'];
				var str = updateNotes + '\n' + lookUpNoteEntity;
				//updateNotes += '\n' + lookUpNoteEntity;
				
				var updateNote = record.submitFields({
					type: record.Type.INVOICE,
					id: invArr[x],
					values:{
						custbody_collection_note: str
					}
				});
				
			}
			
			if(updateColStatus != '0'){
				var updateStatus = record.submitFields({
					type: record.Type.INVOICE,
					id: invArr[x],
					values:{
						custbody_collections_status: updateColStatus
					}
				});
			}
		}
    }

    return {
        execute: execute
    };
    
});
