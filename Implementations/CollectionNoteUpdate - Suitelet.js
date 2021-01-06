/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/ui/dialog', 'N/task', 'N/redirect'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(record, runtime, search, serverWidget, url, dialog, task, redirect) {
   
	/*
	 * 10/4/2018 - Raphael Baligod - NS Case 3165794
	 */
	
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
    			title: 'Collection Note Update',
    			hideNavBar: true
    		});
    		form.clientScriptFileId = '14651649';
    		form.addSubmitButton({
    			label: 'Save'
    		});
    		form.addField({
    			id: 'custpage_enternote',
    			label: 'Enter Collection Note',
    			type: serverWidget.FieldType.TEXTAREA
    		});
    		var colStatus = form.addField({
    			id: 'custpage_collectionstatus',
    			label: 'Collection Status',
    			type: serverWidget.FieldType.SELECT
    		});
    		
    		colStatus.addSelectOption({
    			value: 0,
    			text: '- Select Value -'
    		});
    		//record.load is used to load the Custom List
    		for(var x = 1; x != -1; x++){
    			try{
    				//goes to 'catch' to break the loop once the list reaches out-of-bounds
        			var statusVal = record.load({
        				type: 'customlist_collections_status',
        				id: x
        			});
        			colStatus.addSelectOption({
        				value: x,
        				text: statusVal.getValue({ fieldId: 'name'})
        			});
    			}
    			catch(e){
    				//if record.load loads from a value that no longer exists, it will break the loop here.
    				x = -2;
    			}
    		}
    		
    		
    		var sublist = form.addSublist({
    			id: 'custpage_collectionnotes',
    			type: serverWidget.SublistType.LIST,
    			label: 'Collection Notes'
    		});
    		sublist.addField({
    			id: 'custpage_updatecollection',
    			label: 'Update',
    			type: serverWidget.FieldType.CHECKBOX
    		});
    		sublist.addField({
    			id: 'custpage_trandate',
    			label: 'Transaction Date',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_invoicenum',
    			label: 'Invoice Number',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_invoice',
    			label: 'Internal ID',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_custname',
    			label: 'Customer Name',
    			type: serverWidget.FieldType.TEXT
    		});
    		if(context.request.parameters.eid == 'partner'){
        		sublist.addField({
        			id: 'custpage_partname',
        			label: 'Partner Name',
        			type: serverWidget.FieldType.TEXT
        		});
    		}
    		sublist.addField({
    			id: 'custpage_coltext',
    			label: 'Collection Note',
    			type: serverWidget.FieldType.TEXTAREA
    		});
    		sublist.addField({
    			id: 'custpage_colstatus',
    			label: 'Collection Status',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addMarkAllButtons();
    		form.getSublist({ id: 'custpage_collectionnotes'}).getField({id: 'custpage_invoice'}).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN});
    		
    		//Invoice search as per parameters on filter.push
    		var invoiceSearch = search.create({
    			type: 'transaction',
    			columns: ['internalid', 'custbody_collection_note','tranid','custbody_collections_status', 'trandate', 'entity', 'partner']
    		});
    		var filters = new Array();
    		if(context.request.parameters.eid == 'customer'){
        		filters.push(search.createFilter({ name: 'type', operator: search.Operator.IS, values: 'CustInvc'}));
        		filters.push(search.createFilter({ name: 'name', operator: search.Operator.IS, values: context.request.parameters.entityid}));
        		filters.push(search.createFilter({ name: 'status', operator: search.Operator.IS, values: 'CustInvc:A'}));
        		//filters.push(search.createFilter({ name: 'allownonglchanges', operator: search.Operator.IS, join: 'accountingperiod', values: 'T'}));
        		//filters.push(search.createFilter({ name: 'closed', operator: search.Operator.IS, join: 'accountingperiod', values: 'F'}));
    		}
    		else if(context.request.parameters.eid == 'partner'){
    			filters.push(search.createFilter({ name: 'type', operator: search.Operator.IS, values: 'CustInvc'}));
    			//filters.push(search.createFilter({ name: 'partner', operator: search.Operator.ANYOF, join: 'customer', values: context.request.parameters.entityid}));
    			filters.push(search.createFilter({ name: 'partner', operator: search.Operator.ANYOF, values: context.request.parameters.entityid}));
    			filters.push(search.createFilter({ name: 'status', operator: search.Operator.IS, values: 'CustInvc:A'}));
    			//filters.push(search.createFilter({ name: 'allownonglchanges', operator: search.Operator.IS, join: 'accountingperiod', values: 'T'}));
    			//filters.push(search.createFilter({ name: 'closed', operator: search.Operator.IS, join: 'accountingperiod', values: 'F'}));
    		}
    		invoiceSearch.filters = filters;
    		var lineNum = 0;
    		var previousValue = '';
    		invoiceSearch.run().each(function(result){
    			//display values and render on sublist. Ignore duplicate transactions (if any)
    			if(previousValue != result.getValue({name: 'tranid'})){
        			sublist.setSublistValue({
        				id: 'custpage_invoicenum',
        				line: lineNum,
        				value: result.getValue({
            				name: 'tranid'
            			})
        			});
        			sublist.setSublistValue({
        				id: 'custpage_invoice',
        				line: lineNum,
        				value: result.getValue({
            				name: 'internalid'
            			})
        			});
        			try{
            			sublist.setSublistValue({
            				id: 'custpage_partname',
            				line: lineNum,
            				value: result.getText({
                				name: 'partner'
                			})
            			});
        			}
        			catch(e){
        				//blank value
        			}
        			try{
        				sublist.setSublistValue({
        					id: 'custpage_trandate',
        					line: lineNum,
        					value: result.getValue({
        						name: 'trandate'
        					})
        				});
        			}catch(e){
        				//blank value
        			}
					var lookUpFields = search.lookupFields({
						type: search.Type.CUSTOMER,
						id: result.getValue({ name: 'entity'}),
						columns: 'companyname'
					});
					var lookUpNameEntity = lookUpFields['companyname'];
					var lookUpFields = search.lookupFields({
						type: search.Type.CUSTOMER,
						id: result.getValue({ name: 'entity'}),
						columns: 'companyname'
					});
					var lookUpNameEntity = lookUpFields['companyname'];
        			try{
        				sublist.setSublistValue({
        					id: 'custpage_custname',
        					line: lineNum,
        					value: lookUpNameEntity
        				});
        			}catch(e){
        				//blank value
        			}
        			try{
            			sublist.setSublistValue({
            				id: 'custpage_coltext',
            				line: lineNum,
            				value: result.getValue({
                				name: 'custbody_collection_note'
                			})
            			});
        			}catch(e){
        				//blank value
        			}
        			try{
            			sublist.setSublistValue({
            				id: 'custpage_colstatus',
            				line: lineNum,
            				value: result.getText({
                				name: 'custbody_collections_status'
                			})
            			});
        			}
        			catch(e){
        				//blank value
        			}
        			previousValue = result.getValue({ name: 'tranid'});
        			lineNum++;
    			}
    			return true;
    		});

    		//render page.
        	context.response.writePage(form);
    	}
    	else if(context.request.method == 'POST'){
    		//on successful changes, render this page.
    		var collectionNote = context.request.parameters.custpage_enternote;
    		var collectionStatus = context.request.parameters.custpage_collectionstatus;
    		var invNum = '';
    		var invCount = 0;
    		var req = context.request;
    		for(var x = 0; x != -1; x++){
    			if(req.getSublistValue({group: 'custpage_collectionnotes',name: 'custpage_invoice',line: x}) == '' || req.getSublistValue({group: 'custpage_collectionnotes',name: 'custpage_invoice',line: x}) == null){
    				x = -2;
    			}
    			else{
    	    		var invSave = req.getSublistValue({
    	    			group: 'custpage_collectionnotes',
    	    			name: 'custpage_updatecollection',
    	    			line: x
    	    		});
    	    		if(invSave == 'T'){
        	    		if(invCount == 0){
        	    			invNum = req.getSublistValue({
            	    			group: 'custpage_collectionnotes',
            	    			name: 'custpage_invoice',
            	    			line: x
            	    		});
        	    		}
        	    		else{
        	    			invNum += ',' + req.getSublistValue({
            	    			group: 'custpage_collectionnotes',
            	    			name: 'custpage_invoice',
            	    			line: x
            	    		});
        	    		}
        	    		invCount++;
    	    		}
    			}
    		}
    		
    		try{
        		var taskMaster = task.create({
        			taskType: task.TaskType.SCHEDULED_SCRIPT,
        			scriptId: 1420
        			//deploymentId: 3
        		});
        		taskMaster.params = {
        				'custscript_colnotes' : collectionNote,
        				'custscript_colstatus' : collectionStatus,
        				'custscript_invlist' : invNum
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
            	obJResult.defaultValue = '<html>Please wait for a couple of minutes for the changes to take effect.<br>Feel free to close this window.<br><br><button onclick="windowClose()">Close Window</button><script language="javascript" type="text/javascript">function windowClose() {window.open("","_parent","");window.close();}</script></html>';
    		}
    		catch(e){
        		var form = serverWidget.createForm({
        			title: 'Another Task is currently saving.',
        			hideNavBar: true
        		});
        	    var obJResult = form.addField
                ({
                	id : 'custpage_result',
                	label : 'Result',
                	type : 'inlinehtml'
               	});
    			obJResult.defaultValue = '<html>Another task is currently being saved. Please wait for a couple of minutes for the current task to save before trying again.<br>Feel free to close this window.<br><br><button onclick="windowClose()">Close Window</button><script language="javascript" type="text/javascript">function windowClose() {window.open("","_parent","");window.close();}</script></html>';
    		}
    	    //redirect.toTaskLink({id:'LIST_SCRIPTSTATUS'});
    		context.response.writePage(form);
    	}
    }
    
    function closeWindow(){
    	window.close();
    }

    return {
        onRequest: onRequest,
        closeWindow: closeWindow
    };
    
});