/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/dialog', 'N/url'],
/**
 * @param {record} record
 * @param {dialog} dialog
 */
function(record, dialog, url) {
    
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

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	var currRec = scriptContext.currentRecord;
		var urlString = window.location.href;
		var suiteletURL = '/app/site/hosting/scriptlet.nl?script=685&deploy=1&compid=4531577_SB1';
		var fieldId = scriptContext.fieldId;
		
		if(fieldId == 'custpage_changeview'){
			if(currRec.getValue({ fieldId: 'custpage_changeview'}) == '1'){
				window.onbeforeunload = null;
				window.open(suiteletURL+'&viewmode=1','_self');
			}
			else if(currRec.getValue({ fieldId: 'custpage_changeview'}) == '2'){
				window.onbeforeunload = null;
				window.open(suiteletURL+'&viewmode=2','_self');
			}
		}
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	var currRec = scriptContext.currentRecord;
    	
		if(currRec.getValue({ fieldId: 'custpage_updatestatus'}) == '3' && currRec.getValue({ fieldId: 'custpage_rejectnote'}) == ''){
			dialog.alert({
				title: 'Alert',
				message: 'Reject Reason cannot be blank if the action selected is "Reject".'
			});
			return false;
		}
		else{
			var lineCount = currRec.getLineCount({ sublistId: 'custpage_purchaseorders'});
			var linesUpdate = 0;
			for(var x = 0; x < lineCount; x++){
				if(currRec.getSublistValue({ sublistId: 'custpage_purchaseorders', fieldId: 'custpage_approvepo', line: x}) == true){
					linesUpdate++;
				}
			}
			if(linesUpdate == 0){
				dialog.alert({
					title: 'Alert',
					message: 'Please select at least one (1) transaction to Approve/Reject.'
				});
				return false;
			}
			else{
				return true;
			}
		}
    }
    
    function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, pageId, viewmode) {
        document.location = url.resolveScript({
                scriptId : suiteletScriptId,
                deploymentId : suiteletDeploymentId,
                params : {
                    'pageid' : pageId,
                    'viewmode' : viewmode
                }
            });
        
		/*window.onbeforeunload = null;
		window.open(suiteletURL+'&viewmode=1','_self');*/
    }

    return {
        //pageInit: pageInit,
        fieldChanged: fieldChanged,
        /*postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,*/
        saveRecord: saveRecord,
        getSuiteletPage: getSuiteletPage
    };
    
});
