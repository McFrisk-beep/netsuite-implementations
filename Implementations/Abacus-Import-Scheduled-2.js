/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/file'],

function(record, search, runtime, file) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	//Script internal ID: 1574
    	
    	var searchId = '11535'; //change accordingly
    	var ratePlanSavedSearch = '11536'; //change accordingly
    	log.debug('File ID Read', runtime.getCurrentScript().getParameter({ name: 'custscript6'}));
    	var fileInternalId = runtime.getCurrentScript().getParameter({ name: 'custscript6'});
    	//var fileInternalId = '34789962';
    	var scriptObj = runtime.getCurrentScript();
    	
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
			
			//fileObj.isOnline = true;
			//fileObj.save();
			
			//===== VARIABLES
			var internalIdCount = fileFieldInternalID.length;
			var fieldValueCount = fileFieldValue.length;
			//================
			
			
    		var soSearch = search.load({
    			id: searchId
    		});
    		soSearch.run().each(function(result){
    			
    			if(scriptObj.getRemainingUsage() > 1000){
        			var soId = result.getValue({ name: 'internalid'});
        			var memo = result.getValue({ name: 'memo'});
        			
        			var soLoad = record.load({
        				type: record.Type.SALES_ORDER,
        				id: soId,
        				isDynamic: true
        			});
        			
        			var ptr = 0;
        			var currLine = 0;
        			for(var x = 0; x < soLoad.getLineCount({ sublistId: 'item'}); x++){
        				var subscriptionPlan = soLoad.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sb_item_billingpackage', line: x});
    					var subId = 'recmachcustrecord_sb_adj_salesorder';
    					var rateId = '';
    					var sbplanItem = '';
    					var memoText = '';
    					
    					var ratePlanSearch = search.load({ id: ratePlanSavedSearch});
    					log.debug('subscription plan', subscriptionPlan);
    					var filter1 = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: subscriptionPlan});
    					ratePlanSearch.filters.push(filter1);
    					ratePlanSearch.run().each(function(result){
    						rateId = result.getValue({ name: 'custrecord_rb_sp_item_rate_plan', join: 'CUSTRECORD_RB_SP_ITEM_SUBSCRIPTION_PLAN'});
    						sbplanItem = result.getValue({ name: 'internalid', join: 'CUSTRECORD_RB_SP_ITEM_SUBSCRIPTION_PLAN'});
    						log.debug('Results [rate plan ID, sub plan ID]', '[' + rateId + ', ' + sbplanItem + ']');
    						return false;
    					});
    					
    					log.debug('Rate ID', rateId);
    					log.debug('Subscription Plan Item ID', sbplanItem);
    					
    					
    					soLoad.selectNewLine({ sublistId: subId});
    					for(var z = 0; z < internalIdCount; z++){
    						if(fileFieldInternalID[z].search('memo') != -1){
    							
    							for(var w = currLine; w < (fieldValueCount/internalIdCount); w++){
    								
    								if(memo == fileFieldValue[(ptr)]){
    									
    									if(soLoad.getSublistText({ sublistId: 'item', fieldId: 'item', line: x}) == fileFieldValue[(ptr+1)]){
    										for(var y = 0; y < internalIdCount; y++){
    											if(fileFieldInternalID[y].search('1') != -1){
    												//========================= ADJUSTMENT RATE = 1
    												try{
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_rateplan',
        													value: rateId
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_value',
        													value: fileFieldValue[y+ptr]
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_sbplanitem',
        													value: sbplanItem
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_linenum',
        													value: (x+1)
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_sbplan',
        													value: subscriptionPlan
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_adjtype',
        													value: 1
        												});
        												soLoad.commitLine({
        													sublistId: subId
        												});
    												}
    												catch(e){
    													//no data.
    													log.debug('Instance.', 'No adjustment rate detected.');
    												}
    											}
    											else if(fileFieldInternalID[y].search('2') != -1){
    												//========================= ADJUSTMENT DISCOUNT = 2
    												try{
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_value',
        													value: fileFieldValue[y+ptr]
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_sbplanitem',
        													value: sbplanItem
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_linenum',
        													value: (x+1)
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_sbplan',
        													value: subscriptionPlan
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_adjtype',
        													value: 2
        												});
        												soLoad.commitLine({
        													sublistId: subId
        												});
    												}
    												catch(e){
    													//no data.
    													log.debug('Instance.', 'No adjustment discount detected.');
    												}
    											}
    											else if(fileFieldInternalID[y].search('4') != -1){
    												//========================= ADJUSTMENT FIXED USAGE = 4
    												try{
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_value',
        													value: fileFieldValue[y+ptr]
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_sbplanitem',
        													value: sbplanItem
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_linenum',
        													value: (x+1)
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_sbplan',
        													value: subscriptionPlan
        												});
        												soLoad.setCurrentSublistValue({
        													sublistId: subId,
        													fieldId: 'custrecord_sb_adj_adjtype',
        													value: 4
        												});
        												soLoad.commitLine({
        													sublistId: subId
        												});
    												}
    												catch(e){
    													//no data.
    													log.debug('Instance.', 'No adjustment quantity detected.');
    												}
    											}
    										}
    										
    										z = internalIdCount;
    										w = (fieldValueCount/internalIdCount);
    										
    									}
    									
    								}
    								
    								currLine++;
    								ptr += internalIdCount;
    								
    							}
    							
    						}
    					}
        			}
        			
        			var memoStr = soLoad.getValue({ fieldId: 'memo'});
        			memoStr += ' [DONE]';
        			soLoad.setValue({ fieldId: 'memo', value: memoStr});
        			
    				var recordId = soLoad.save({ enableSourcing: true, ignoreMandatoryFields: true});
    				log.debug('Sales Order updated.', 'Internal ID - ' + recordId);
    			}
    			
				//Governance Unit Check
				log.debug("Remaining governance units: " + scriptObj.getRemainingUsage());
				
    			return true;
    		});
		}
    }

    return {
        execute: execute
    };
    
});
