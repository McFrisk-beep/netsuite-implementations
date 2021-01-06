/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search, serverWidget) {
   
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
    	var currRec = scriptContext.newRecord;
    	if(scriptContext.type == scriptContext.UserEventType.VIEW || scriptContext.type == scriptContext.UserEventType.EDIT){
    		var script = "window.open('/app/site/hosting/scriptlet.nl?script=1508&deploy=1&allocid="+currRec.getValue({fieldId:'id'})+"','myWindow()','height=500,width=900');";
    		scriptContext.form.addButton({
    			id: 'custpage_button_viewjournalhistory',
    			label: 'View Journal History',
    			functionName: script
    		});
    	}
    }

    return {
        beforeLoad: beforeLoad
    };
    
});
