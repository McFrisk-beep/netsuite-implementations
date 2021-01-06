/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/file'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime, file) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var savedSearchId = '11535'; //125 test account - change accordingly. 11535 - temp.
    	var scriptObj = runtime.getCurrentScript();
    	
    	log.debug('File ID Read', runtime.getCurrentScript().getParameter({ name: 'custscript5'}));
    	var fileInternalId = runtime.getCurrentScript().getParameter({ name: 'custscript5'});
    	
		var fileObj = file.load({
		    id: fileInternalId
		});
		if (fileObj.size < 10485760){
			
			var firstLine = true;
			var fileFieldInternalID = new Array();
			var fileFieldValue = new Array();
			
			var fileReader = fileObj.lines.iterator();
			fileReader.each(function (line){
				var lineHead = line.value.split(',');
				var len = lineHead.length;
				for(var x = 0; x < len; x++){
    				var lineAmt = lineHead[x];
        			if(firstLine){
        				fileFieldInternalID.push(lineAmt);
        			}
        			else{
        				fileFieldValue.push(lineAmt);
        			}
				}
				firstLine = false;
    			return true;
			});
			
			fileObj.isOnline = true;
			fileObj.save();
			
			log.debug('Internal IDs Count', fileFieldInternalID.length);
			log.debug('Total Line Count', (fileFieldValue.length / fileFieldInternalID.length));
			
			var lines = fileFieldValue.length / fileFieldInternalID.length;
			var internalIdCount = fileFieldInternalID.length;
			var objRecord;	//The Sales Order object record
			var isFirstTime = true;
			var currLine = 0;
			var lastLine = 0;	//to identify if the next line is still on the item sublist, or for a new sales order. Reliant on externalId variable
			var ptr = 0;		//pointer for the fileFieldValue array
			var recordAdjustmentLine = 1;	//
			
			for(var x = 0; x < lines; x++){
				
				//=============== VARIABLE DECLARATIONS
				var subscriptionPlan = 0;
				var adjType = 0;
				var customer = '';
				var subsidiaryId = '';
				
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
					else if(fileFieldInternalID[y].search('Legacy_Identifier') != -1){
						currLine = fileFieldValue[y+ptr];
						log.debug('Legacy_Identifier', currLine);
					}
					else if(fileFieldInternalID[y].search('entity') != -1){
						customer = fileFieldValue[y];
						log.debug('Entity', customer);
					}
				}
				
				//log.debug('=== IS FIRST TIME? ===', isFirstTime);
				//log.debug('=== currLine | lastLine', currLine + ' | ' + lastLine);
				if(isFirstTime == true){
					objRecord = record.create({
						type: record.Type.SALES_ORDER,
						isDynamic: true,
						defaultValues:{
							entity: customer
						}
					});
					isFirstTime = false;
				}
				else if(currLine != lastLine && isFirstTime == false){
					try{
						var recordId = objRecord.save({ enableSourcing: true, ignoreMandatoryFields: true});
						log.debug('=== Sales Order created for Line ' + (x+1), 'Internal ID - ' + recordId);
						objRecord = record.create({
							type: record.Type.SALES_ORDER,
							isDynamic: true,
							defaultValues:{
								entity: customer
							}
						});
						recordAdjustmentLine = 1;
					}
					catch(e){
						log.debug('Error creating Sales Order for Line ' + (x+1), e);
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
						log.debug('Main Line Error at ' + fileFieldInternalID[y] + ' on line ' + (x+1), e);
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
									objRecord.setCurrentSublistText({ sublistId: 'item', fieldId: 'item', value: fileFieldValue[ptr]});
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
						log.debug('Item Sublist error at - ' + fileFieldInternalID[y] + ' on line ' + (x+1), e);
					}
					ptr++; //mmove to next array value
				}
				
				//objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: 1});
				//log.debug('Try Commit Line', 'Trying. . .');
				try{
					objRecord.commitLine({ sublistId: 'item'});		//Commit Item Sublist
				}
				catch(e){
					log.error('Error committing field.', e);
				}
				//log.debug('Line successfully commited!', 'Success');
				
				//LOOP 2 EXIT: RESET ptr to original value
				ptr = ptr - internalIdCount;
				
				//================== ADJUSTMENT SUBLIST
				for(var y = 0; y < internalIdCount; y++){
					try{
						if(fileFieldInternalID[y].search('adjrate') != -1){
							var subId = 'recmachcustrecord_sb_adj_salesorder';
							var rateId = ''; //7
							var sbplanItem = ''; //17
							//dun 
							var ratePlanSearch = search.load({ id: savedSearchId});
							var filter1 = search.createFilter({ name: 'internalidnumber', join: 'custrecord_rb_sp_item_subscription_plan', operator: search.Operator.ANYOF, values: subscriptionPlan})
							//var filter1 = search.createFilter({ name: 'custrecord_sb_sbitem_subscriptionplan', operator: search.Operator.ANYOF, values: subscriptionPlan});
							//var filter1 = search.createFilter({ name: 'custrecord_rb_sp_item_subscription_plan', operator: search.Operator.ANYOF, join: 'custrecord_rb_sp_item_subscription_plan', values: subscriptionPlan});
							ratePlanSearch.filters.push(filter1);
							ratePlanSearch.run().each(function(result){
								//rateId = result.getValue({ name: 'custrecord_sb_sbitem_billrateplan'});
								//sbplanItem = result.getValue({ name: 'custrecord_sb_sbitem_subsplanitem'});
								rateId = result.getValue({ name: 'custrecord_rb_sp_item_rate_plan', join: 'CUSTRECORD_RB_SP_ITEM_SUBSCRIPTION_PLAN'});
								sbplanItem = result.getValue({ name: 'internalid'});
								log.debug('Results [rate plan ID, sub plan ID]', '[' + rateId + ', ' + sbplanItem + ']');
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
						log.debug('Adjustment Sublist error at - ' + fileFieldInternalID[y] + ' on line ' + (x+1), e);
					}
					ptr++;
				}
				
				//After loop. Don't reset ptr value. Next Line will start with the next ptr value from the array.
				//Add +1 to the pointer to go to the next line
				//Set last external ID with current one. Next iteration of loop, if externalID is different, and firstTime is false, save the record then create a new one
				lastLine = currLine;
				
				//Governance Unit Check
				log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
			}
			
			try{
				var recordId = objRecord.save({ enableSourcing: true, ignoreMandatoryFields: true});
				log.debug('=== EXIT MAIN LOOP === Last Sales Order created', 'Internal ID - ' + recordId);
			}
			catch(e){
				log.debug('Sales Order saving error on Last line of file', e);
			}
		}
    }

    return {
        execute: execute
    };
    
});
