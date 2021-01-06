/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/https', 'N/ui/dialog'],
/**
 * @param {record} record
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(record, search, https, dialog) {
    
	var suiteletURL = '/app/site/hosting/scriptlet.nl?script=957&deploy=1';
	function approve(internalID){
		var url = suiteletURL + '&rcID=' + internalID + '&status=A';
		var response = https.get({ url: url});
		console.log(url);
		//location.reload();
		window.location = url;
	}
	
	function reject(internalID){
		var url = suiteletURL + '&rcID=' + internalID + '&status=R';
		var response = https.get({ url: url});
		console.log(url);
		//location.reload();
		window.location = url;
	}
	
	function cancel(internalID){
		var url = suiteletURL + '&rcID=' + internalID + '&status=C';
		var response = https.get({ url: url});
		console.log(url);
		//location.reload();
		window.location.replace("/app/common/custom/custrecordentry.nl?rectype=749&id=" + internalID);
	}
	
	function complete_later(internalID){
		var url = suiteletURL + '&rcID=' + internalID + '&status=CL';
		var response = https.get({ url: url});
		console.log(url);
		//location.reload();
		window.location.replace("/app/common/custom/custrecordentry.nl?rectype=749&id=" + internalID);
	}
	
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	//dummy placeholder function to prevent errors of the .js file not being recognized. doesn't do anything.
    }

    return {
        pageInit: pageInit,
        approve: approve,
        reject: reject,
        cancel: cancel,
        complete_later: complete_later
    };
    
});
