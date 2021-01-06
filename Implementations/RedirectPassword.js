/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget'],
/**
 * @param {redirect} redirect
 */
function(serverWidget) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
		var form = serverWidget.createForm({
			title: ' ',
			hideNavBar: true
		});
		var objRedirect = form.addField({
			id: 'custpage_redirect',
			label: 'Redirect',
			type: 'inlinehtml'
		});
		objRedirect.defaultValue = '<html><head><a href=""></a><meta http-equiv="Refresh" content="0;url=https://system.netsuite.com/app/center/changepwd.nl"></head></html>';
		context.response.writePage(form);
    }

    return {
        onRequest: onRequest
    };
    
});
