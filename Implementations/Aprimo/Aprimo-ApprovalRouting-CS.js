/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/dialog', 'N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 * @param {dialog} dialog
 */
function(record, search, dialog, runtime) {
	
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
    	var poForm = scriptContext.currentRecord;
    	var formMode = scriptContext.mode;
    	
    	if(formMode == 'create' || formMode == 'copy'){
    		log.debug('Context', formMode);
    		
    		//Disable all Approval Routing on Create/Copy of the PO.
    		var disablefld1 = poForm.getField({ fieldId: 'custbody_nsacs_initialapproval'});
    		disablefld1.isDisabled = true;
    		var disablefld2 = poForm.getField({ fieldId: 'supervisorapproval'});
    		disablefld2.isDisabled = true;
    		var disablefld3 = poForm.getField({ fieldId: 'custbody_nsacs_rejectpo'});
    		disablefld3.isDisabled = true;
    		var disablefld4 = poForm.getField({ fieldId: 'custbody_nsacs_rejectreason'});
    		disablefld4.isDisabled = true;
    	}
    	if(formMode == 'edit'){
    		log.debug('Context', formMode);
    		log.debug('current USER information', runtime.getCurrentUser());
    	}
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
    	var poForm = scriptContext.currentRecord;
    	var fieldId = scriptContext.fieldId;
    	log.debug('client script logging');
    	
		if(fieldId == 'employee'){
    		//var currentEmployee = runtime.getCurrentUser().id;
			try{
	    		var employeeSearch = record.load({
	    			type: record.Type.EMPLOYEE,
	    			id: poForm.getValue({ fieldId: 'employee'})
	    		});
				var nextApproverEmployee = record.load({
					type: record.Type.EMPLOYEE,
					id: employeeSearch.getValue('purchaseorderapprover')
				});
	    		
				poForm.setValue({ fieldId: 'nextapprover', value: nextApproverEmployee.getValue('id')});
			}
			catch(e){
				poForm.setValue({ fieldId: 'nextapprover', value: ''});
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

    }

    return {
        //pageInit: pageInit,
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
