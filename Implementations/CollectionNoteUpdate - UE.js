/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime, serverWidget) {
   
	/*
	 * 10/4/2018 - Raphael Baligod - NS Case 3165794
	 */
	
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
    	if(scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.COPY || scriptContext.type == scriptContext.UserEventType.VIEW){
    		log.debug('Environment type', runtime.envType);

    		//Needs to be changed as per the script ID once deployed to another environment.
    		//script should be replaced with Suitelet internal ID.
    		
    		if(scriptContext.newRecord.type == "customer"){
        		var script = "window.open('/app/site/hosting/scriptlet.nl?script=1416&deploy=1&entityid="+currRec.getValue({fieldId:'id'})+"&eid=customer','myWindow()','height=500,width=900');";
        		scriptContext.form.addButton({
        			id: 'custpage_button_updatecollection',
        			label: 'Update Collection Notes',
        			functionName: script
        		});
    		}
    		else if(scriptContext.newRecord.type == "partner"){
        		var script = "window.open('/app/site/hosting/scriptlet.nl?script=1416&deploy=1&entityid="+currRec.getValue({fieldId:'id'})+"&eid=partner','myWindow()','height=500,width=900');";
        		scriptContext.form.addButton({
        			id: 'custpage_button_updatecollection',
        			label: 'Update Collection Notes',
        			functionName: script
        		});
    		}
    	}
    }

    return {
        beforeLoad: beforeLoad
    };
    
});
