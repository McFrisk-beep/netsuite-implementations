/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/record', 'N/ui/serverWidget', 'N/search', 'N/task'],
/**
 * @param {file} file
 * @param {record} record
 * @param {serverWidget} serverWidget
 */
function(file, record, serverWidget, search, task) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	//Script internal ID: 1573
    	
    	if(context.request.method == 'GET'){
    		
    		var fileSavedSearchId = '11537'; //change accordingly - 122 test account
    		//var fileInternalId = '352';
    		
    		var form = serverWidget.createForm({
    			title: 'Subscriptions Import',
    			hideNavBar: true
    		});
    		form.addSubmitButton({
    			label: 'Start Import'
    		});
    		var filesAvailable = form.addField({
    			id: 'custpage_files',
    			label: 'Files',
    			type: serverWidget.FieldType.SELECT
    		});
    		
    		filesAvailable.addSelectOption({
    			value: 0,
    			text: '- Select Value -'
    		});
    		/*var fileSearch = search.create({
    			type: search.Type.FOLDER,
    			columns: ['internalid', 'name']
    		});*/
    		
    		var fileSearch = search.load({
    			id: fileSavedSearchId
    		});
    		var count = 1;
    		fileSearch.run().each(function(result){
    			filesAvailable.addSelectOption({
    				value: result.getValue({ name: 'internalid', join: 'file'}),
    				text: result.getValue({ name: 'name', join: 'file'})
    			});
    			count++;
    			return true;
    		});
    		context.response.writePage(form);
    	}
    	else if(context.request.method == 'POST'){
    		
    		var scheduledScriptId = '1574';	//change accordingly
    		
    		var csvFileId = context.request.parameters.custpage_files;
    		
    		//LOAD the Passed File ID
    		var fileObj = file.load({
    		    id: csvFileId
    		});
    		if(fileObj.fileType == 'csv' || fileObj.fileType == 'CSV'){
        		var taskMaster = task.create({
        			taskType: task.TaskType.SCHEDULED_SCRIPT,
        			//taskType: task.TaskType.MAP_REDUCE,
        			scriptId: scheduledScriptId
        		});
        		taskMaster.params = {
        				'custscript6' : csvFileId
        		};
        		var taskMasterId = taskMaster.submit();
        		
        		var form = serverWidget.createForm({
        			title: 'Changes have been submitted.',
        			hideNavBar: true
        		});
        	    var obJResult = form.addField
                ({
                	id : 'custpage_result',
                	label : 'Result',
                	type : 'inlinehtml'
               	});
            	obJResult.defaultValue = '<html>Depending on the amount of data, this can take a while.<br>You can check the status of the Scheduled script.<br>Feel free to close this window.<br><br><button onclick="windowClose()">Close Window</button><script language="javascript" type="text/javascript">function windowClose() {window.open("","_parent","");window.close();}</script></html>';
            	context.response.writePage(form);
    		}
    		else{
        		var form = serverWidget.createForm({
        			title: 'Error',
        			hideNavBar: true
        		});
        	    var obJResult = form.addField
                ({
                	id : 'custpage_result',
                	label : 'Result',
                	type : 'inlinehtml'
               	});
            	obJResult.defaultValue = '<html>File is not in the CSV Format. Please try again.<br><br><button onclick="windowClose()">Close Window</button><script language="javascript" type="text/javascript">function windowClose() {window.open("","_parent","");window.close();}</script></html>';
            	context.response.writePage(form);
    		}
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
