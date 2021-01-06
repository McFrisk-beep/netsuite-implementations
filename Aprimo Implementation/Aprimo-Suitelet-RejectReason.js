/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {task} task
 * @param {dialog} dialog
 * @param {serverWidget} serverWidget
 */
function(record, runtime, search, serverWidget) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	if(context.request.method == 'GET'){
    		var form = serverWidget.createForm({
    			title: 'Enter Reject Reason',
    			hideNavBar: false
    		});
    		
    		var currentUser = runtime.getCurrentUser().id;
    		form.addSubmitButton({
    			label: 'Submit'
    		});
    		
    		//render page.
        	context.response.writePage(form);
    	}
    	else if(context.request.method == 'POST'){
    		context.response.writePage(form);
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
