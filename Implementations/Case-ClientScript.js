/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/search', 'N/ui/dialog'],
/**
 * @param {runtime} runtime
 * @param {search} search
 * @param {dialog} dialog
 */
function(runtime, search, dialog) {
    
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
		log.debug('Page initialize', 'Script triggered.');
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
    	var localCondition = true;
    	while(localCondition){				
    		//Entering 'company' field triggers the fieldChange for multiple fields causing performance behaviors.
    		//Added the while-statement to reduce lag when the company field
        	var caseRecord = scriptContext.currentRecord;
        	var currentField = scriptContext.fieldId;
        	log.debug('currentField', currentField);
        	
        	try{
        		if(currentField == 'email' && caseRecord.getValue({fieldId: 'email'}) != '' && caseRecord.getValue({fieldId: 'contact'}) == ''){
            		log.debug('If-statement', currentField);
            		if(caseRecord.getValue({ fieldId: 'company'}) == ''){
            			dialog.alert({
            				title: 'Alert',
            				message: 'Please enter field values for the field "Company"'
            			});
            			caseRecord.setValue({ fieldId: 'email', value: '', ignoreFieldChange: true});
            			break;
            		}
            		else{
                		var email = caseRecord.getValue({
                			fieldId: 'email'
                		});
                		var company = caseRecord.getValue({
                			fieldId: 'company'
                		});
                		
                		var contactSearch = search.create({ type: 'contact', columns: ['internalid', 'phone']});
                		var filters = new Array();
                		filters.push(search.createFilter({ name: 'email', operator: search.Operator.IS, values: email}));
                		filters.push(search.createFilter({ name: 'company', operator: search.Operator.ANYOF, values: company}));
                		contactSearch.filters = filters;
                		var morethanOne = false;
                		contactSearch.run().each(function(result){
                			if(morethanOne){
                				dialog.alert({
                					title: 'Alert',
                					message: 'Multiple users with the same e-mail detected.\nPlease check if this is the correct record.\nOtherwise, please change to the correct Contact record'
                				});
                				return true;
                			}
                			else{
                    			var contactId = result.getValue({ name: 'internalid'});
                    			var phone = result.getValue({ name: 'phone'});
                    			
                    			log.debug('Search', contactId + ' : ' + phone);
                    			caseRecord.setValue({
                    				fieldId: 'contact',
                    				value: contactId,
                    				ignoreFieldChange: true
                    			});
                    			caseRecord.setValue({
                    				fieldId: 'phone',
                    				value: phone,
                    				ignoreFieldChange: true
                    			});
                    			morethanOne = true;
                			}
                			
                			return true;
                		});
            		}
            	}
        		else{
        			break;
        		}
        	}
        	catch(e){
        		log.debug('Company record is entered', 'Other values not yet populated');
        	}
        	localCondition = false;
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

    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        //validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        //saveRecord: saveRecord
    };
    
});
