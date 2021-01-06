/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/file', 'N/format'],
/**
 * @param {record} record
 * @param {render} render
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search, file, format) {
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
    	log.debug('Client Save start', '-');
    	if(runtime.executionContext === runtime.ContextType.CSVIMPORT){
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
    			
                var currLine = 0;
    			for(var x = 0; x < lines; x++){
    				currRec.selectLine({ sublistId: 'item', line: x});
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
    						if(fileFieldValue[currLine] == currRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item'})){
    							//3rd line
    							currLine++;
    							log.debug('fileFieldValue date', fileFieldValue[currLine]);
    							try{
    								var parseDate = format.parse({ value: fileFieldValue[currLine], type: format.Type.DATE});
    								currRec.setCurrentSublistValue({
    									sublistId: 'item',
    									fieldId: 'custcol_sb_end_date',
    									value: parseDate
    								});
    								currRec.commitLine({ sublistId: 'item'})
    								currLine++;
    								log.debug('fileFieldValue - SET LINE', fileFieldValue[currLine]);
    								log.debug('Commit line value', currRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sb_end_date'}));
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
    		}
    	}
    }

    return {
        saveRecord: saveRecord
    };
    
});
