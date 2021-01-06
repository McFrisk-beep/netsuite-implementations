/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['./escodegen.browser', './esprima','N/record', 'N/search', 'N/ui/serverWidget', 'N/file', './NS_ESM_SSConverter_Const', './NS_ESM_SSConverter_Lib', './NS_ESM_Common', 'N/log'],
/**
 * @param {record} record
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(esprima, escodegen, record, search, serverWidget, file, CONST, LIB, ESM, log) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
		var form = serverWidget.createForm({
			title: 'SuiteScript 2.0 Converter',
			hideNavBar: false
		});
		form.clientScriptFileId = '132';
    	if(context.request.method == 'GET'){
    		
    		//RESTlet not included (yet)
    		var scriptTypes = ['User Event', 'Suitelet', 'Scheduled', 'Client', 'Portlet', 'Mass Update', 'Workflow Action', 'Bundle Install'];
    		var scriptID	= ['usereventscript', 'suitelet', 'scheduledscript', 'clientscript', 'portlet', 'massupdatescript', 'workflowactionscript', 'bundleinstallationscript'];
    		form.addFieldGroup({
	        	id : 'custgroup_1',
	            label : 'File Selection'
	        });
    		form.addFieldGroup({
	        	id : 'custgroup_2',
	            label : 'Converter'
	        });
    		
    		form.addField({
    			id: 'custpage_fileuploader',
    			type: serverWidget.FieldType.FILE,
    			label: 'Upload Script'
    		}); 
    		var scTypes = form.addField({
    			id: 'custpage_scripttype',
    			label: 'Script Type',
    			type: serverWidget.FieldType.SELECT,
    			container: 'custgroup_1'
    		});
    		scTypes.addSelectOption({
    			value: 0,
    			text: '- Select Value -'
    		});
    		scTypes.isMandatory = true;
    		for(var x = 0; x < scriptTypes.length; x++){
    			scTypes.addSelectOption({
    				value: scriptID[x],
    				text: scriptTypes[x]
    			});
    		}
    		form.addField({
    			id: 'custpage_scriptin',
    			label: '1.0 Script',
    			type: serverWidget.FieldType.TEXTAREA,
    			container: 'custgroup_2'
    		});
    		form.addField({
    			id: 'custpage_scriptout',
    			label: 'Converted 2.0 Script',
    			type: serverWidget.FieldType.TEXTAREA,
    			container: 'custgroup_2'
    		});
    		
    		form.addButton({
    		    id : 'custpage_convert',
    		    label : 'Convert',
    		    functionName: 'convertScript()'
    		});
            form.addSubmitButton({
            	label: 'Upload and Convert'
            });
    	}
    	else if(context.request.method == 'POST'){
    		/*var scriptUpload = context.request.files['custpage_fileuploader'];
    		scriptUpload.folder = '7';
    		var fileID = scriptUpload.save();*/
    		var x = LIB.convert({
    			src		: context.request.parameters.custpage_scriptin,
    			type	: context.request.parameters.custpage_scripttype,
    			textadhoc : true
    		});
    		
    		form.addField({
    			id: 'custpage_scriptout',
    			label: 'Converted 2.0 Script',
    			type: serverWidget.FieldType.TEXTAREA,
    			container: 'custgroup_2'
    		});
    		var textArea = form.getField('custpage_scriptout');
    		textArea.defaultValue = x;
    	}
    	
    	context.response.writePage(form);
    }
    
    /*function convertScript(str, type, textadhoc){
    	log.debug('went in the function', 'function inside');
		var x = LIB.convert({
			src		: str,
			type	: type,
			textadhoc : textadhoc
		});
		var textArea = form.getField('custpage_scriptout');
		textArea.defaultValue = x;
    }*/

    return {
        onRequest: onRequest
    };
    
});
