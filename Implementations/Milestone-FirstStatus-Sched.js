/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var searchId = '894';
        var scriptObj = runtime.getCurrentScript();
    	
    	var oppSearch = search.load({ id: searchId });
		oppSearch.run().each(function(result){ 
			try{
    			var internalId = result.getValue({ name: 'internalid', summary: 'GROUP'});
    			var statusSet = result.getValue({ name: 'formulatext', summary: 'MIN'});
                if(statusSet == '' || statusSet == null){
                    log.audit('statusSet does not have any value.', 'Record ID: ' + internalId + ' | Usage remaining: ' + scriptObj.getRemainingUsage());
                }
                else{
                 	var rcrd = record.submitFields({
    					type: record.Type.OPPORTUNITY,
    					id: internalId,
    					values: {
    						custbody_firststatus: statusSet
    					},
    					options: {
    						ignoreMandatoryFields: true
    					}
                  	});
    				log.audit('internal ID: ' + internalId + ', SUCCESS!', 'statusSet: ' + statusSet + ' | Usage remaining: ' + scriptObj.getRemainingUsage());
                 }
			}
			catch(f){
				log.error('Error!!!', f);
				return false;
			}
			return true;
		});
      log.debug('SUCCESS! Records were updated. No errors encountered', '-');
    }

    return {
        execute: execute
    };
    
});