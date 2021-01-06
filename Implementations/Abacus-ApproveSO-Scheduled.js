/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var searchID = '126'; //change accordingly. 126 - test account
    	
    	var salesOrderSearch = search.load({ id: searchId});
		var salesOrderResult = revenueelementSearchObj.run().getRange({
			start: 0,
			end: 100
		});
		
		if(salesOrderResult)
		{
			for (var x = 0; x < salesOrderResult.length; x++)
			{
				//sumRevenueAmount += parseFloat(revSearchResult[rbiIndex].getValue({name: 'totalrecognized',join: 'revenuePlan'}));
				var rec = record.submitFields({
					type: record.Type.SALES_ORDER,
					id: salesOrderResult[x].getValue({ name: 'internalid'}),
					values: {
						memo: 'Approved by Workflow'
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields: true
					}
				});
				
			}
		}
    }

    return {
        execute: execute
    };
    
});
