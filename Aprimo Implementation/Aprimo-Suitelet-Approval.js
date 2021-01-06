/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/task', 'N/ui/dialog', 'N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 * @param {task} task
 * @param {dialog} dialog
 * @param {serverWidget} serverWidget
 */
function(record, runtime, search, task, dialog, serverWidget) {
   
	/******************GLOBAL VARIABLES***********************/
	var PAGE_SIZE = 50;
	var scriptId = '685';
	var deploymentId = '1';
	/************************END******************************/
	
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	if(context.request.method == 'GET'){
    		var form = serverWidget.createForm({
    			title: 'Approve Purchase Orders',
    			hideNavBar: false
    		});
    		form.clientScriptFileId = '128745';
    		var currentUser = runtime.getCurrentUser().id;
    		
			var colView = form.addField({
				id: 'custpage_changeview',
				label: 'View Type',
				type: serverWidget.FieldType.SELECT
			});
			colView.addSelectOption({
				value: 1,
				text: 'Approval View'
			});
			colView.addSelectOption({
				value: 2,
				text: 'List Approved Transactions'
			});
			//Set the field's default value according to selection. Just so the "field change" is reflected properly.
			if(context.request.parameters.viewmode == '1' || context.request.parameters.viewmode == null){
				colView.defaultValue = '1';
			}
			else if(context.request.parameters.viewmode == '2'){
				colView.defaultValue = '2';
			}
			
    		var colStatus = form.addField({
    			id: 'custpage_updatestatus',
    			label: 'Status Change',
    			type: serverWidget.FieldType.SELECT
    		});
    		colStatus.addSelectOption({
    			value: '',
    			text: '- Select Value -'
    		});
			colStatus.addSelectOption({
				value: 2,
				text: 'Approve'
			});
			colStatus.addSelectOption({
				value: 3,
				text: 'Reject'
			});
			if(context.request.parameters.viewmode == '1' || context.request.parameters.viewmode == null){
				//Field mandatory on "Approval Mode"
				var fld1 = form.getField('custpage_updatestatus');
				fld1.isMandatory = true;
	    		form.addSubmitButton({
	    			label: 'Submit'
	    		});
			}
			else if(context.request.parameters.viewmode == '2'){
				colStatus.updateDisplayType({'displayType':'hidden'});
			}
			
			var usr = form.addField({
				id: 'custpage_user',
				label: 'User',
				type: serverWidget.FieldType.TEXT
			});
			usr.defaultValue = String(currentUser);
			usr.updateDisplayType({'displayType':'hidden'});
			
			var isAccountingApprover = form.addField({
				id: 'custpage_acctingapprover',
				label: 'Accounting Approver',
				type: serverWidget.FieldType.TEXT
			});
    		var employeeSearch = record.load({
    			type: record.Type.EMPLOYEE,
    			id: currentUser
    		});
			isAccountingApprover.defaultValue = employeeSearch.getValue('custentity_nsacs_acct_approver');
			isAccountingApprover.updateDisplayType({'displayType':'hidden'});
			
			var purchaseApprovalLimit = form.addField({
				id: 'custpage_approvallimit',
				label: 'Approval Limit',
				type: serverWidget.FieldType.CURRENCY
			});
			purchaseApprovalLimit.defaultValue = employeeSearch.getValue('purchaseorderapprovallimit');
			purchaseApprovalLimit.updateDisplayType({'displayType':'hidden'});
			
			if(context.request.parameters.viewmode == '1' || context.request.parameters.viewmode == null){
	    		form.addField({
	    			id: 'custpage_rejectnote',
	    			label: 'Reject Reason',
	    			type: serverWidget.FieldType.TEXTAREA
	    		});
			}
    		
    		var sublist = form.addSublist({
    			id: 'custpage_purchaseorders',
    			type: serverWidget.SublistType.LIST,
    			label: 'Purchase Orders'
    		});
			if(context.request.parameters.viewmode == '1' || context.request.parameters.viewmode == null){
	    		sublist.addField({
	    			id: 'custpage_approvepo',
	    			label: 'Update',
	    			type: serverWidget.FieldType.CHECKBOX
	    		});
			}
    		sublist.addField({
    			id: 'custpage_docuid',
    			label: 'Transaction Number',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_trandate',
    			label: 'Date',
    			type: serverWidget.FieldType.DATE
    		});
    		sublist.addField({
    			id: 'custpage_initialapprover',
    			label: 'Initial Approver',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_vendor',
    			label: 'Vendor',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_status',
    			label: 'Approval Status',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_total',
    			label: 'Total',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_internalid',
    			label: 'Internal ID',
    			type: serverWidget.FieldType.TEXT
    		});
    		form.getSublist({ id: 'custpage_purchaseorders'}).getField({id: 'custpage_internalid'}).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN});
    		
			if(context.request.parameters.viewmode == '1' || context.request.parameters.viewmode == null){
				sublist.addMarkAllButtons();
			}
    		
    		var poSearch;
    		
    		//Check the view type. From there, the search would change accordingly.
    		var filters = new Array();
			if(context.request.parameters.viewmode == '1' || context.request.parameters.viewmode == null){
				//If "view" is "Approval View"
				poSearch = search.load({ id: 'customsearch_nsacs_po_approval' });
				
				//Saved search below is the ad-hoc. Recommended to use an NS Saved Search instead for results consistency.
				/*poSearch = search.create({
	    			type: 'transaction',
	    			columns: ['internalid',search.createColumn({ name: 'tranid', sort: 'DESC'}),'custbody_nsacs_firstapprover','entity','status','total','trandate']
	    		});
	    		filters.push(search.createFilter({ name: 'type', operator: search.Operator.IS, values: 'PurchOrd'}));
	    		filters.push(search.createFilter({ name: 'nextapprover', operator: search.Operator.ANYOF, values: '@CURRENT@'}));
	    		filters.push(search.createFilter({ name: 'status', operator: search.Operator.IS, values: 'PurchOrd:A'}));
	    		filters.push(search.createFilter({ name: 'mainline', operator: search.Operator.IS, values: 'T'}));
	    		poSearch.filters = filters;*/
			}
			else if(context.request.parameters.viewmode == '2'){
				//If "view" is "List Approved Transactions"
				poSearch = search.create({
	    			type: 'transaction',
	    			columns: ['internalid',search.createColumn({ name: 'tranid', sort: 'DESC'}),'custbody_nsacs_firstapprover','entity','status','amount','statusref','total','trandate'],
	    			filters: [
	    				['type', search.Operator.IS, 'PurchOrd'], 'and',
	    				['mainline', search.Operator.IS, 'T'], 'and',
	    				[
	    					['status', search.Operator.ANYOF, 'PurchOrd:A'], 'and',
	    					['custbody_nsacs_firstapprover', search.Operator.ANYOF, '@CURRENT@']
	    				], 'or',
	    				[
	    					['status', search.Operator.ANYOF, 'PurchOrd:B'], 'and',
	    					['custbody_nsacs_secondapprover', search.Operator.ANYOF, '@CURRENT@']
	    				]
	    			]
	    		});
			}
			
			
			//PAGINATION MODULE
            var retrieveSearch = poSearch.runPaged({
                pageSize : PAGE_SIZE
            });
            var pageCount = parseInt(retrieveSearch.count / PAGE_SIZE);
            var pageId = context.request.parameters.pageid;

            // Set pageId to correct value if out of index
            if (!pageId || pageId == '' || pageId < 0)
                pageId = 0;
            else if (pageId >= pageCount)
                pageId = pageCount - 1;
			
            // Add buttons to simulate Next & Previous
            if (pageId != 0) {
                form.addButton({
                    id : 'custpage_previous',
                    label : 'Previous',
                    functionName : 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId - 1) + ', ' + context.request.parameters.viewmode + ')'
                });
            }

            if (pageId != pageCount - 1 && pageCount != 0) {
                form.addButton({
                    id : 'custpage_next',
                    label : 'Next',
                    functionName : 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId + 1) + ', ' + context.request.parameters.viewmode + ')'
                });
            }
            
			var results = poSearch.runPaged({
	            pageSize : PAGE_SIZE
	        });
			try{
				//Try-catch in place to check for null
				var searchPage = results.fetch({
					index: pageId
				});
			}
			catch(e){ }
			
    		var lineNum = 0;
    		var previousValue = '';
			
    		try{
    			//Try-catch in place just in case the "searchPage" doesn't return anything. In this instance, the Saved Search doesn't return any values.
        		searchPage.data.forEach(function(result){
        			if(previousValue != result.getValue({name: 'tranid'})){
            			///app/accounting/transactions/purchord.nl?id=465388&e=T
            			sublist.setSublistValue({
            				id: 'custpage_docuid',
            				line: lineNum,
            				value: '<a href="/app/accounting/transactions/purchord.nl?id=' + result.getValue({name: 'internalid'}) + '" target="_blank">' + result.getValue({ name: 'tranid' }) + '</a>'
            			});
            			try{
            				sublist.setSublistValue({
            					id: 'custpage_trandate',
            					line: lineNum,
            					value: result.getValue({
            						name: 'trandate'
            					})
            				});
            			}catch(e){ }
            			try{
                			sublist.setSublistValue({
                				id: 'custpage_initialapprover',
                				line: lineNum,
                				value: result.getText({
                    				name: 'custbody_nsacs_firstapprover'
                    			})
                			});
            			}catch(e){ }
            			try{
                			sublist.setSublistValue({
                				id: 'custpage_vendor',
                				line: lineNum,
                				value: result.getText({
                    				name: 'entity'
                    			})
                			});
            			}catch(e){ }
            			try{
                			sublist.setSublistValue({
                				id: 'custpage_employee',
                				line: lineNum,
                				value: result.getValue({
                    				name: 'employee'
                    			})
                			});
            			}catch(e){ }
            			try{
                			sublist.setSublistValue({
                				id: 'custpage_status',
                				line: lineNum,
                				value: result.getText({
                    				name: 'statusref'
                    			})
                			});
            			}catch(e){ }
            			try{
                			sublist.setSublistValue({
                				id: 'custpage_total',
                				line: lineNum,
                				value: result.getValue({
                    				name: 'amount'
                    			})
                			});
            			}catch(e){ }
            			sublist.setSublistValue({
            				id: 'custpage_internalid',
            				line: lineNum,
            				value: result.getValue({
                				name: 'internalid'
                			})
            			});
            			lineNum++;
            			previousValue = result.getValue({ name: 'tranid'});
        			}
        			return true;
        		});
    		}
    		catch(e){
    			//There's no data. just skip it.
    		}
    		
    		//render page.
        	context.response.writePage(form);
    	}
    	else if(context.request.method == 'POST'){
    		//TO DO
    		var rejectNote = context.request.parameters.custpage_rejectnote;
    		var statusUpdate = context.request.parameters.custpage_updatestatus;
    		var empId = context.request.parameters.custpage_user;
    		var isAcctingApprover = context.request.parameters.custpage_acctingapprover;
    		var approvalLimit = context.request.parameters.custpage_approvallimit;
    		
    		var poNum = '';
    		var poCount = 0;
    		var req = context.request;
    		for(var x = 0; x != -1; x++){
    			if(req.getSublistValue({group: 'custpage_purchaseorders', name: 'custpage_internalid', line: x}) == '' || req.getSublistValue({group: 'custpage_purchaseorders', name: 'custpage_internalid', line: x}) == null){
    				x = -2;
    			}
    			else{
    	    		var poSave = req.getSublistValue({
    	    			group: 'custpage_purchaseorders',
    	    			name: 'custpage_approvepo',
    	    			line: x
    	    		});
    	    		if(poSave == 'T'){
        	    		if(poCount == 0){
        	    			poNum = req.getSublistValue({
            	    			group: 'custpage_purchaseorders',
            	    			name: 'custpage_internalid',
            	    			line: x
            	    		});
        	    		}
        	    		else{
        	    			poNum += ',' + req.getSublistValue({
            	    			group: 'custpage_purchaseorders',
            	    			name: 'custpage_internalid',
            	    			line: x
            	    		});
        	    		}
        	    		poCount++;
    	    		}
    			}
    		}
    		
    		try{
        		var taskMaster = task.create({
        			taskType: task.TaskType.SCHEDULED_SCRIPT,
        			scriptId: 686
        			//deploymentId: 3
        		});
        		taskMaster.params = {
        				'custscript_rejectnote' : rejectNote,
        				'custscript_statusupdate' : statusUpdate,
        				'custscript_employeeid' : empId,
        				'custscript_acctingapprover' : isAcctingApprover,
        				'custscript_approvallimit' : approvalLimit,
        				'custscript_polist' : poNum
        		};
        		var taskMasterId = taskMaster.submit();
        		var form = serverWidget.createForm({
        			title: 'Changes have been submitted.',
        			hideNavBar: false
        		});
        	    var obJResult = form.addField
                ({
                	id : 'custpage_result',
                	label : 'Result',
                	type : 'inlinehtml'
               	});
            	obJResult.defaultValue = '<html>Please wait for a couple of minutes for the changes to take effect.<br>Feel free to close this window.<br><br>Click <a href="/app/common/scripting/scriptstatus.nl?sortcol=dcreated&sortdir=DESC&date=TODAY&scripttype=686">here</a> to check the status of the scheduled script.</html>';
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
    			obJResult.defaultValue = '<html>Another task is currently being saved. Please wait for a couple of minutes for the current task to save before trying again.<br>Feel free to close this window.<br><br>Click <a href="/app/common/scripting/scriptstatus.nl?sortcol=dcreated&sortdir=DESC&date=TODAY&scripttype=686">here</a> to check the status of the scheduled script.</html>';
    		}
    		
    		context.response.writePage(form);
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
