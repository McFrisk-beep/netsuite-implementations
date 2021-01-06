/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(record, runtime, search, serverWidget) {
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
	
    function onRequest(context) {
    	//When Suitelet is opened.
    	if(context.request.method == 'GET'){
    		var form = serverWidget.createForm({
    			title: 'Cost Center Restriction Configuration',
    			hideNavBar: false
    		});
    		form.addSubmitButton({
    			label: 'Save'
    		});
    		
    		var helpfld = form.addField({id: 'custpage_description',label: 'Note',type: serverWidget.FieldType.TEXT});
    		helpfld.updateDisplayType({'displayType':'inline'});
    		helpfld.defaultValue = 'Setup page to restrict the Cost Centers from being added to transactions. Locations that are "Checked" are Locations that are restricted to be added on various transaction records.';
    		
    		var sublist = form.addSublist({
    			id: 'custpage_locationlist',
    			type: serverWidget.SublistType.LIST,
    			label: 'Locations'
    		});
    		sublist.addField({
    			id: 'custpage_disablecostcenter',
    			label: 'Disable Cost Center?',
    			type: serverWidget.FieldType.CHECKBOX
    		});
    		sublist.addField({
    			id: 'custpage_location',
    			label: 'Location',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_internalid',
    			label: 'Internal ID',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addMarkAllButtons();
    		
    		//Create a new Custom Record to add the field on the Location record.
    		var locationArr = new Array();
    		var locationSearch = search.create({
    			type: 'location',
    			columns: ['internalid', 'name', 'custrecord1']
    		});
    		var lineNum = 0;
    		locationSearch.run().each(function(result){
    			sublist.setSublistValue({
    				id: 'custpage_location',
    				line: lineNum,
    				value: result.getValue({
        				name: 'name'
        			})
    			});
    			sublist.setSublistValue({
    				id: 'custpage_internalid',
    				line: lineNum,
    				value: result.getValue({
        				name: 'internalid'
        			})
    			});
    			if(result.getValue({ name: 'custrecord1'}) == true){
    				sublist.setSublistValue({
    					id: 'custpage_disablecostcenter',
    					line: lineNum,
    					value: 'T'
    				});
    			}
    			else{
    				sublist.setSublistValue({
    					id: 'custpage_disablecostcenter',
    					line: lineNum,
    					value: 'F'
    				});
    			}
    			lineNum++;
        		return true;
    		});
    		
    		//render page.
        	context.response.writePage(form);
    	}
    	else if(context.request.method == 'POST'){
    		//on successful changes, render this page.
    		var req = context.request;
    		log.debug('req', req);
    		for(var x = 0; x != -1; x++){
    			if(req.getSublistValue({group: 'custpage_locationlist',name: 'custpage_internalid',line: x}) == '' || req.getSublistValue({group: 'custpage_locationlist',name: 'custpage_internalid',line: x}) == null){
    				x = -2;
    			}
    			else{
        			if(req.getSublistValue({ group: 'custpage_locationlist', name: 'custpage_disablecostcenter', line: x}) == 'T'){
        				var objRecord = record.load({
        				    type: record.Type.LOCATION, 
        				    id: req.getSublistValue({ group: 'custpage_locationlist', name: 'custpage_internalid', line: x}),
        				    isDynamic: true
        				});
        				objRecord.setValue({ fieldId: 'custrecord1', value: true});
        				objRecord.save();
        				
        				log.debug('Location ID ' + req.getSublistValue({ group: 'custpage_locationlist', name: 'custpage_internalid', line: x}) + ' updated.', 'true');
        			}
        			else{
        				var objRecord = record.load({
        				    type: record.Type.LOCATION, 
        				    id: req.getSublistValue({ group: 'custpage_locationlist', name: 'custpage_internalid', line: x}),
        				    isDynamic: true
        				});
        				objRecord.setValue({ fieldId: 'custrecord1', value: false});
        				objRecord.save();
        				
        				log.debug('Location ID ' + req.getSublistValue({ group: 'custpage_locationlist', name: 'custpage_internalid', line: x}) + ' updated.', 'false');
        			}
    			}
    		}
    		
    		var form = serverWidget.createForm({
    			title: 'Success!',
    			hideNavBar: false
    		});
    	    var obJResult = form.addField
            ({
            	id : 'custpage_result',
            	label : 'Result',
            	type : 'inlinehtml'
           	});
        	obJResult.defaultValue = '<html>The changes has been successfully submitted!<br>This page can be closed.</html>';
    	    //objResult.defaultValue = '';
    		context.response.writePage(form);
    	}
    }

    return {
        onRequest: onRequest
    };
    
});