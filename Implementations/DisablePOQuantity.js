/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/file', 'N/search', 'N/error', 'N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {runtime} runtime
 */
function(record, runtime, file, search, error, serverWidget) {
   
	/*
	 * Last modified log:
	 * 
	 * - Raphael Baligod - 10/8/2018 - v1 Script creation.
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
    	//1018 = 'Serial Upload' role internal ID
    	//136 = 'PO Serial Upload' form ID
    	try{
        	if((scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.COPY || scriptContext.UserEventType.CREATE) 
        				&& runtime.getCurrentUser().role == '1018'){
        		//&& scriptContext.newRecord.getValue({ fieldId: 'customform'}) == '136' 
            	scriptContext.form.getSublist('item').getField('quantity').updateDisplayType({
            		displayType: 'disabled'
            	});
            	scriptContext.form.getSublist('item').getField('amount').updateDisplayType({
            		displayType: 'disabled'
            	});
            	try{
                	scriptContext.form.getSublist('item').getField('location').updateDisplayType({
                		displayType: 'disabled'
                	});
            	}
            	catch(e){
            		//Do nothing. field does not exist.
            	}
        	}
    	}
    	catch(e){
    		//Do nothing. If field 'Quantity' does not exist in form for some reason, skip the code entirely.
    	}
    }
    
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
    	log.debug('User/Uploader Role', runtime.getCurrentUser().role);
    	if ((runtime.executionContext == 'CSV_IMPORT' || runtime.executionContext == 'CSVIMPORT') && runtime.getCurrentUser().role == '1018') {
        	// && scriptContext.type == scriptContext.UserEventType.EDIT
        		log.debug('Session', 'CSV ACCESS');
        		var currRec = scriptContext.newRecord;
        		var lines = currRec.getLineCount({ sublistId: 'item'});
        		var recordLoad = record.load({
        			type: record.Type.PURCHASE_ORDER,
        			id: currRec.getValue({ fieldId: 'id'}),
        			isDynamic: true
        		});
        		var oldLines = recordLoad.getLineCount({ sublistId: 'item'});
        		log.debug('Old Line Count', oldLines);
        		
        		if(oldLines != lines){
        			var errorThrow = error.create({
        				name: 'CODE 200',
        				message: 'New Line Item detected. Please re-check your CSV data and try again',
        				notifyOff: false
        			});
        			log.debug('Error', 'New Line Item detected.');
        			throw errorThrow;
        		}
        		
        		for(var currLine = 0; currLine < lines; currLine++){
        			log.debug('ID', currRec.getValue({ fieldId: 'id'}));
            		log.debug('CSV Quantity', currRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: currLine}));
            		log.debug('Old Record QTY', recordLoad.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: currLine}));
            		
            		if(currRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: currLine}) != recordLoad.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: currLine})){
            			var errorThrow = error.create({
            				name: 'CODE 100',
            				message: 'Quantity Mis-match. Please re-check your CSV data and try again.',
            				notifyOff: false
            			});
            			log.debug('Error', 'Quantity mis-match');
            			throw errorThrow;
            		}
            		else{
                		currRec.setSublistValue({
                			sublistId: 'item',
                			fieldId: 'quantity',
                			line: currLine,
                			value: recordLoad.getSublistValue({
                				sublistId: 'item',
                				fieldId: 'quantity',
                				line: currLine
                			})
                		});
                		currRec.setSublistValue({
                			sublistId: 'item',
                			fieldId: 'amount',
                			line: currLine,
                			value: recordLoad.getSublistValue({
                				sublistId: 'item',
                				fieldId: 'amount',
                				line: currLine
                			})
                		});
            		}
            		log.debug('New Record QTY', currRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: currLine}));
        		}
        	}
        	else {
        		log.debug('Session', 'UI ACCESS');
        	}
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
    
});