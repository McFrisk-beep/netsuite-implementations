/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime) {
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
    	//Change keyEntity depending on requirement. 1557 = "W222 Saks" customer record.
    	var keyEntity = '1557';
    	
    	if(scriptContext.type == scriptContext.UserEventType.CREATE){
    		var fulRecord = scriptContext.newRecord;
    		var recType = fulRecord.type;
    		
    		//Check if the customer is the correct record assigned. Otherwise, skip this and end the script.
    		if(fulRecord.getValue({ fieldId: 'entity'}) == keyEntity && recType == 'itemfulfillment'){
        		var soNum = fulRecord.getValue({ fieldId: 'createdfrom'});
        		log.debug('soNum', soNum);
        		
        		//Load Sales Order reference
        		var soRecord = record.load({
        			type: record.Type.SALES_ORDER,
        			id: soNum
        		});
        		var spsRefTwo = soRecord.getValue({ fieldId: 'custbody_sps_ref02'});
        		if(spsRefTwo != ''){
        			fulRecord.setValue({ fieldId: 'custbody_nsacs_spsreftwo', value: spsRefTwo});
        		}
        		else{
        			log.debug('spsRef02 field from Sales Order is blank.', 'Script aborted.');
        		}
        		
        		if(spsRefTwo == '1'){
        			//If 1, print the Gift Note.
        			fulRecord.setValue({ fieldId: 'custbody_nsacs_giftnote', value: soRecord.getValue({ fieldId: 'custbody_gift_note'})});
        			log.debug('Inside spsRef 1. Gift message', fulRecord.getValue({ fieldId: 'custbody_nsacs_giftnote'}));
        		}
        		else if(spsRefTwo == '2'){
        			//If 2, print the Item Price.
        			log.debug('Inside spsRef 2. Item Price', '-');
            		var line = soRecord.getLineCount({ sublistId: 'item'});
            		var fulline = fulRecord.getLineCount({ sublistId: 'item'});
            		var item = '';
            		for(var x = 0; x < line; x++){
            			//Get the Item from Sales Order
            			item = soRecord.getSublistValue({
            				sublistId: 'item',
            				fieldId: 'item',
            				line: x
            			});
            			log.debug('sales order item line', soRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: x}));
            			
            			//Match with the Item on the Item Fulfillment. If it matches, set the custom line "source price" with the amount from the Sales Order
            			for(var y = 0; y < fulline; y++){
            				log.debug('compared fulfillment item', fulRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: y}));
            				if(item == fulRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: y})){
            					fulRecord.setSublistValue({
            						sublistId: 'item',
            						fieldId: 'custcol_nsacs_sourceprice',
            						line: y,
            						value: soRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: x})
            					});
            					y = fulline;
            				}
            			}
            		}
        		}
    		}
    	}
    	else if(scriptContext.type == scriptContext.UserEventType.EDIT){
    		var currRec = scriptContext.newRecord;
    		var recType = currRec.type;
    		log.debug('recType', recType);
    		
    		//Plan is to load the item fulfillment record and save it again.
    		/*if(recType == 'salesorder'){
    			var fulfillmentRecord = record.load({
    				type: record.Type.ITEM_FULFILLMENT,
    				id: '<id here>'
    			});
    		}*/
    	}
    }

    return {
        beforeSubmit: beforeSubmit
    };
    
});
