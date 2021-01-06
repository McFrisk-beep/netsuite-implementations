/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var searchId = '815';
    	//777 - SB Search ID
    	//675 - TA Search ID
    	//815 - Production search ID for 'Bill.com' transactions.
    		//Search name: ACS | JEs from Bill.com [DO NOT TOUCH]
    	try{
    		//log.debug('Search run', 'Went here');
    		search.load({
    			id: searchId
    		}).run().each(function(result){
    			log.debug('Search run', result.id);
    			var fieldLookup = search.lookupFields({
    				type: search.Type.JOURNAL_ENTRY,
    				id: result.id,
    				columns: ['status']
    			});
    			var fieldLookupObj = fieldLookup.status[0];
    			var objValue = fieldLookupObj.value;
    			log.debug('Approved value', objValue);
    			
				var updateStatus = record.submitFields({
					type: record.Type.JOURNAL_ENTRY,
					id: result.id,
					values:{
						approved: 'T'
					}
				});
    			return true;
    		});
    	}
    	catch(e){
    		//error handler here
    		log.debug('Error', e);
    	}
    }

    return {
        execute: execute
    };
    
});
