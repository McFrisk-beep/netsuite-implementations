/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/record', 'N/runtime', 'N/search', 'N/format'],
/**
 * @param {file} file
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(file, record, runtime, search, format) {
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
    	var currRec = scriptContext.newRecord;
    	log.debug('Script Start', '-');
    	//if(runtime.executionContext === runtime.ContextType.CSVIMPORT){
        	var lines = currRec.getLineCount({ sublistId: 'item'});
        	var fileInternalId = '34858075';
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
    			
    			//===== VARIABLES
    			var internalIdCount = fileFieldInternalID.length;
    			var fieldValueCount = fileFieldValue.length;
    			//================
    			
                var currLine = 0;
    			for(var x = 0; x < lines; x++){
    				//currRec.selectLine({ sublistId: 'item', line: x});
    				//var testLine = currRec.selectLine({ sublistId: 'item', line: 0});
    				//var currLine = 0;
    				for(var y = 0; y < (fieldValueCount/internalIdCount); y++){
    					/*
    					 * LEGEND:
    					 * 1st line = Memo
    					 * 2nd line = Item Name
    					 * 3rd line = End Date
    					 */
    					//1st line
    					log.debug('fileFieldValue memo', fileFieldValue[currLine]);
    					if(fileFieldValue[currLine] == currRec.getValue({ fieldId: 'memo'})){
    						//2nd line
    						currLine++;
    						log.debug('fileFieldValue item', fileFieldValue[currLine]);
    						if(fileFieldValue[currLine] == currRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: y})){
    							//3rd line
    							currLine++;
    							log.debug('fileFieldValue date', fileFieldValue[currLine]);
    							try{
    								var parseDate = format.parse({ value: fileFieldValue[currLine], type: format.Type.DATE});
    								currRec.setSublistValue({
    									sublistId: 'item',
    									fieldId: 'custcol_sb_end_date',
    									value: parseDate,
    									line: y
    								});
    								currRec.commitLine({ sublistId: 'item'})
    								currLine++;
    								log.debug('fileFieldValue - SET LINE', fileFieldValue[currLine]);
    								log.debug('Commit line value', currRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sb_end_date', line: y}));
    							}
    							catch(e){
    								//no date value. Skip line.
    								currLine++;
    								log.debug('fileFieldValue', fileFieldValue[currLine]);
    							}
    						}
    					}
    					else{
    						currLine+= 3;	//go to the next line of the CSV.
    						log.debug('Skip Line', '-');
    					}
    				}
    			}
    		//}
    	}
    	log.debug('Script end', '-');
    }

    return {
        beforeSubmit: beforeSubmit
    };
    
});
