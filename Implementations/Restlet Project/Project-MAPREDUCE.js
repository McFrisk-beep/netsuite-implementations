/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/file'],

function(record, search, file) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
	
    function getInputData() {
    	log.audit({
    		title: 'Sales Order ID',
    		details: search.load({
        		id: 'customsearch_pending_so_search'
        	})
    	});
    	
    	return search.load({
    		id: 'customsearch_pending_so_search'
    	});
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
		
		log.audit({
			title: 'Returned by MAP',
			details: context
		});
		
		//context.write(mapContext.key, mapContext.value); 
    	
    	var searchResult = JSON.parse(context.value);
    	var salesId = searchResult.id;
    	var soStatus = searchResult.values.statusref.value;
    	
		log.audit({
			title: 'Returned by salesId',
			details: soStatus
		});
    	
		if(soStatus == 'pendingFulfillment'){
	    	createFulfillment(salesId);
		}
		else if(soStatus == 'pendingBilling'){
			createInvoice(salesId);
		}
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
    	
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.audit({
            title: 'Usage units consumed', 
            details: summary.usage
        });

        log.audit({
            title: 'Concurrency',
            details: summary.concurrency
        });
        
        log.audit({
            title: 'Number of yields', 
            details: summary.yields
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
    function createFulfillment(salesId){
    	var fulfillment = record.transform({
    		fromType: 'salesorder',
    		fromId: salesId,
    		toType: 'itemfulfillment',
    		isDynamic: true
    	});
    	fulfillment.setValue({
    		fieldId: 'shipstatus',
    		value: 'C'
    	});
    	
    	var lineCount = fulfillment.getLineCount({
    		sublistId: 'item'
    	});
    	
    	for(var x = 0; x < lineCount; x++){
        	fulfillment.selectLine({
				sublistId : 'item',
				line: x
			});
        	
        	var itemrcrd = fulfillment.getCurrentSublistValue({
        		sublistId: 'item',
        		fieldId: 'item'
        	});
        	var seriallotSearch = search.load({
        		id: 'customsearch_inventory_detail_search'
        	});
        	var len = 0, hasInventoryDetail = false, canSubmit = true;
        	seriallotSearch.run().each(function(result){
        		if(itemrcrd == result.getValue({
        			name: 'internalid'
        		})){
        			hasInventoryDetail = true;
        			canSubmit = false;
        		}
        		return true;
        	});
        	/*log.error({
        		title: 'InventoryDetail',
        		details: intId
        	});*/
        	if(hasInventoryDetail){
            	fulfillment.setCurrentSublistValue({
            		sublistId: 'item',
            		fieldId: 'itemreceive',
            		value: false
            	});
            	fulfillment.setValue({
            		fieldId: 'memo',
            		value: 'User-action required - Inventory Details for Serial/Lot numbered items'
            	});
            	fulfillment.commitLine({
            		sublistId: 'item'
            	});
        	}
        	else{
            	fulfillment.setCurrentSublistValue({
            		sublistId: 'item',
            		fieldId: 'location',
            		value: '5'
            	});
        		
            	fulfillment.setCurrentSublistValue({
            		sublistId: 'item',
            		fieldId: 'itemreceive',
            		value: true
            		});
            	
            	
            	fulfillment.commitLine({
            		sublistId: 'item'
            	});
        	}
    	}
    	
    	if(canSubmit){
            fulfillment.save();
    	}
    }
    
    function createInvoice(salesId){
    	var invoice = record.transform({
    		fromType: 'salesorder',
    		fromId: salesId,
    		toType: 'invoice',
    		isDynamic: true
    	});
    	
    	invoice.setValue({
    		fieldId: 'custbody_ns_pos_total_tendered',
    		value: invoice.getValue({
    			fieldId: 'total'
    		})
    	});
    	
    	invoice.save();
    }
    
});
