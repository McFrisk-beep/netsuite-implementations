/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/record', 'N/runtime', 'N/search'],
/**
 * @param {file} file
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(file, record, runtime, search) {
   
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
    	
    	//log.debug('File ID Read', runtime.getCurrentScript().getParameter({ name: 'custscript2'}));
    	//var fileInternalId = runtime.getCurrentScript().getParameter({ name: 'custscript2'});
    	
    	return file.load({
    		id: '369'
    	});
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    
    //PUBLIC VARIABLE DECLARATIONS
	var firstLine = true;
	var fileFieldInternalID = new Array();
	var fileFieldValue = new Array();
	var savedSearchId = 'customsearch123'; //change accordingly.
	var objRecord;	//The Sales Order object record
	var isFirstTime = true;
	var currLine = 0;
	var lastLine = 0;	//to identify if the next line is still on the item sublist, or for a new sales order. Reliant on externalId variable
	var ptr = 0;		//pointer for the fileFieldValue array
	var recordAdjustmentLine = 1;
    
    function map(context) {
    	
		log.audit({ title: 'Returned by MAP', details: context });
		log.audit({ title: 'context.value', details: context.value});
		log.audit({ title: 'length', details: context.value.length});
		
		//=============== VARIABLE DECLARATIONS
		var str = '';
		var subscriptionPlan = 0;
		var adjType = 0;
		
		log.debug('first Line? ', firstLine);
		if(firstLine == true){
			for(var x = 0; x < context.value.length; x++){
				if(context.value[x] != ','){
					str += context.value[x];
				}
				else if((x+1) == context.value.length){
					fileFieldInternalID.push(str);
				}
				else{
					fileFieldInternalID.push(str);
					//log.audit('Internal ID ' + x, str);
					str = '';
				}
			}
			str = '';
		}
		else{
			var internalIdCount = fileFieldInternalID.length;
			
			for(var x = 0; x < context.value.length; x++){
				if(context.value[x] != ','){
					str += context.value[x];
				}
				else if((x+1) == context.value.length){
					fileFieldValue.push(str);
				}
				else{
					fileFieldValue.push(str);
					//log.audit('Value ' + x, str);
					str = '';
				}
			}
			str = '';
			
			//=============== SEARCH FOR 'item.custcol_sb_item_billingpackage'
			//=============== SEARCH FOR 'item.custcol_sb_item_start_type'
			//=============== SEARCH FOR 'externalid'
			for(var y = 0; y < internalIdCount; y++){
				if(fileFieldInternalID[y].search('item.custcol_sb_item_billingpackage') != -1){
					subscriptionPlan = fileFieldValue[y+ptr];
					log.debug('subscription plan', subscriptionPlan);
				}
				else if(fileFieldInternalID[y].search('item.custcol_sb_item_start_type') != -1){
					if(fileFieldValue[y+ptr] == 'Immediate')
						adjType = 1;
					else
						adjType = 2;
					
					log.debug('start type', adjType);
				}
				else if(fileFieldInternalID[y].search('externalid') != -1){
					currLine = fileFieldValue[y+ptr];
					log.debug('external id', currLine);
				}
			}
			
			log.debug('=== IS FIRST TIME? ===', isFirstTime);
			log.debug('=== currLine | lastLine', currLine + ' | ' + lastLine);
			if(isFirstTime == true){
				objRecord = record.create({
					type: record.Type.SALES_ORDER,
					isDynamic: true
				});
				isFirstTime = false;
			}
			else if(currLine != lastLine && isFirstTime == false){
				try{
					log.debug('=== PTR ===', ptr);
					log.debug('fileFieldValue length', fileFieldValue.length);
					log.debug('fileFieldInternalID length',fileFieldInternalID.length);
					
					var recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: true});
					log.debug('=== Sales Order created ===', 'Internal ID - ' + recordId);
					objRecord = record.create({ type: record.Type.SALES_ORDER, isDynamic: true});
					recordAdjustmentLine = 1;
				}
				catch(e){
					log.debug('Error creating Sales Order.', e);
				}
			}
			else if(currLine == lastLine){
				recordAdjustmentLine++;
			}
			
			//=============== MAIN LINE FIELDS
			for(var y = 0; y < internalIdCount; y++){
				try{
					if(fileFieldInternalID[y].search('item') == -1 && fileFieldInternalID[y].search('adjrate') == -1){
						if(fileFieldInternalID[y].search('date') != -1){
							log.debug(fileFieldInternalID[y], fileFieldValue[ptr]);
							var dateVar = new Date(fileFieldValue[ptr]);
							objRecord.setValue({
								fieldId: fileFieldInternalID[y],
								value: dateVar
							});
						}
						else{
							log.debug(fileFieldInternalID[y], fileFieldValue[ptr]);
							
							if(fileFieldInternalID[y].search('orderstatus') != -1){
								if(fileFieldValue[ptr] == 'Pending Approval')
									objRecord.setValue({ fieldId: 'orderstatus', value: 'A'});
								else if(fileFieldValue[ptr] == 'Pending Fulfillment')
									objRecord.setValue({ fieldId: 'orderstatus', value: 'B'});
							}
							else if(fileFieldInternalID[y].search('custbody_sb_subscription_option') != -1){
								if(fileFieldValue[ptr] == 'New Subscription')
									objRecord.setValue({ fieldId: 'custbody_sb_subscription_option', value: 1});
								else if(fileFieldValue[ptr] == 'Add to existing, align with current billing close and prorate')
									objRecord.setValue({ fieldId: 'custbody_sb_subscription_option', value: 2});
								else if(fileFieldValue[ptr] == 'Add to existing, align with next billing cycle start with no proration')
									objRecord.setValue({ fieldId: 'custbody_sb_subscription_option', value: 3});
							}
							else if(fileFieldInternalID[y].search('custbody_sb_billing_transaction') != -1){
								if(fileFieldValue[ptr] == 'Invoice')
									objRecord.setValue({ fieldId: 'custbody_sb_billing_transaction', value: 1});
								else if(fileFieldValue[ptr] == 'Cash Sale')
									objRecord.setValue({ fieldId: 'custbody_sb_billing_transaction', value: 2});
							}
							else{
								try{
									objRecord.setValue({ fieldId: fileFieldInternalID[y], value: fileFieldValue[ptr]});
								}
								catch(e){
									objRecord.setText({ fieldId: fileFieldInternalID[y], value: fileFieldValue[ptr]});
								}
							}
						}
					}
				}
				catch(e){
					log.debug('Main Line Error at ' + fileFieldInternalID[y], e);
				}
				ptr++;	//move to next array value
			}
			
			//LOOP 1 EXIT: RESET ptr to original value
			ptr = ptr - internalIdCount;
			
			//=============== ITEM SUBLIST
			for(var y = 0; y < internalIdCount; y++){
				if(y == 0){
					//Select New Line item
					objRecord.selectNewLine({ sublistId: 'item' });
				}
				
				try{
					if(fileFieldInternalID[y].search('item') != -1){
						if(fileFieldInternalID[y].search('date') != -1){
							log.debug(fileFieldInternalID[y], fileFieldValue[ptr]);
							var dateVar = new Date(fileFieldValue[ptr]);
							objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: fileFieldInternalID[y].replace('item.',''), value: dateVar});
						}
						else{
							log.debug(fileFieldInternalID[y], fileFieldValue[ptr]);
							if(fileFieldInternalID[y].search('item.item') != -1){
								objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: fileFieldValue[ptr]});
							}
							else if(fileFieldInternalID[y].search('item.custcol_sb_item_start_type') != -1){
								objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sb_item_start_type', value: adjType});
							}
							else if(fileFieldInternalID[y].search('custcol_sb_item_billingpackage') != -1){
								objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sb_item_billingpackage', value: subscriptionPlan});
							}
							else{
								try{
									objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: fileFieldInternalID[y].replace('item',''), value: fileFieldValue[ptr]});
								}
								catch(e){
									objRecord.setCurrentSublistText({ sublistId: 'item', fieldId: fileFieldInternalID[y].replace('item',''), value: fileFieldValue[ptr]});
								}
							}
						}
					}
				}
				catch(e){
					log.debug('Item Sublist error at - ' + fileFieldInternalID[y], e);
				}
				ptr++; //mmove to next array value
			}
			
			objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: 1});
			log.debug('Try Commit Line', 'Trying. . .');
			objRecord.commitLine({ sublistId: 'item'});		//Commit Item Sublist
			log.debug('Line successfully commited!', 'Success');
			
			//LOOP 2 EXIT: RESET ptr to original value
			ptr = ptr - internalIdCount;
			
			//================== ADJUSTMENT SUBLIST
			for(var y = 0; y < internalIdCount; y++){
				try{
					if(fileFieldInternalID[y].search('adjrate') != -1){
						var subId = 'recmachcustrecord_sb_adj_salesorder';
						var rateId = 7;
						var sbplanItem = 17;
						
						var ratePlanSearch = search.load({ id: savedSearchId});
						var filter = search.createFilter({ name: 'custrecord_rb_sp_item_subscription_plan', operator: search.Operator.ANYOF, values: subscriptionPlan});
						ratePlanSearch.filters.push(filter);
						ratePlanSearch.run().each(function(result){
							//rateId = result.getValue({ name: 'custrecord_rb_sb_item_rate_plan'});
							//sbplanItem = result.getValue({ name: 'custrecord_sb_adj_sbplanitem'});
							log.debug('Results [internal ID, rate plan ID, sub plan ID', '[' + result.getValue({ name: 'internalid'}) + ', ' + result.getValue({ name: 'custrecord_rb_sb_item_rate_plan'}) + ', ' + result.getValue({ name: 'custrecord_sb_adj_sbplanitem'}) + ']');
							return false;
						});
						
						log.debug('Rate ID', rateId);
						log.debug('Subscription Plan Item ID', sbplanItem);
						
						objRecord.selectNewLine({ sublistId: subId});
						
						if(fileFieldInternalID[y].search('1') != -1){
							//========================= ADJUSTMENT RATE = 1
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_rateplan',
								value: rateId
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_value',
								value: fileFieldValue[ptr]
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_sbplanitem',
								value: sbplanItem
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_linenum',
								value: recordAdjustmentLine
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_sbplan',
								value: subscriptionPlan
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_adjtype',
								value: 1
							});
							objRecord.commitLine({
								sublistId: subId
							});
						}
						else if(fileFieldInternalID[y].search('2') != -1){
							//========================= ADJUSTMENT DISCOUNT = 2
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_value',
								value: fileFieldValue[ptr]
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_sbplanitem',
								value: sbplanItem
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_linenum',
								value: recordAdjustmentLine
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_sbplan',
								value: subscriptionPlan
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_adjtype',
								value: 2
							});
							objRecord.commitLine({
								sublistId: subId
							});
						}
						else if(fileFieldInternalID[y].search('4') != -1){
							//========================= ADJUSTMENT FIXED USAGE = 4
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_value',
								value: fileFieldValue[ptr]
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_sbplanitem',
								value: sbplanItem
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_linenum',
								value: recordAdjustmentLine
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_sbplan',
								value: subscriptionPlan
							});
							objRecord.setCurrentSublistValue({
								sublistId: subId,
								fieldId: 'custrecord_sb_adj_adjtype',
								value: 4
							});
							objRecord.commitLine({
								sublistId: subId
							});
						}
					}
				}
				catch(e){
					log.debug('Adjustment Sublist error at - ' + fileFieldInternalID[y], e);
				}
				ptr++;
			}
			lastLine = currLine;
			
			try{
				var recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: true});
				log.debug('=== TEST SALES ORDER ===', 'Internal ID - ' + recordId);
			}
			catch(e){
				log.debug('SALES ORDER ERROR.', e);
			}
		}
		
		//First line of CSV is always the internal IDs.
		firstLine = false;
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

    }

    return {
        getInputData: getInputData,
        map: map,
        //reduce: reduce,
        summarize: summarize
    };
    
});
