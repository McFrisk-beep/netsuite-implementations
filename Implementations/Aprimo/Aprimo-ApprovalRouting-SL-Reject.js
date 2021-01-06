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
    			title: 'Enter the Reject Reason',
    			hideNavBar: true
    		});
    		form.addSubmitButton({
    			label: 'Save'
    		});
    		form.addField({
    			id: 'custpage_enternote',
    			label: 'Reject Reason',
    			type: serverWidget.FieldType.TEXTAREA
    		});
    	}
    	else if(context.request.method == 'POST'){
    		var collectionNote = context.request.parameters.custpage_enternote;
    		
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
