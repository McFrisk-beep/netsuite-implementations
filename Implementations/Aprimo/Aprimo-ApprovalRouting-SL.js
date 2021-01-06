/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/email', 'N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(record, search, runtime, email, serverWidget) {
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
        	var poRecord = record.load({
        		type: record.Type.PURCHASE_ORDER,
        		id: context.request.parameters.rcID,
        		isDynamic: true
        	});
        	log.debug('executed', 'fine.');
    		log.debug('executed GET', '-');
			var purchaseApprover = record.load({
				type: record.Type.EMPLOYEE,
				id: runtime.getCurrentUser().id
			});
			var isAccountingApprover = purchaseApprover.getValue('custentity_nsacs_acct_approver');
			
			log.debug('isaccountingapprover', isAccountingApprover);
        	if(isAccountingApprover == true && context.request.parameters.status == 'T'){
        		//Accounting Approver approves the transaction
        		var currentEmployee = runtime.getCurrentUser().id;
        		var employeeSearch = record.load({
        			type: record.Type.EMPLOYEE,
        			id: currentEmployee
        		});
        		var limit = employeeSearch.getValue('purchaseorderapprovallimit');
        		log.debug('current employee', currentEmployee);
        		log.debug('total | limit', poRecord.getValue({ fieldId: 'total'}) + ' | ' + limit);
        		//Check Accounting Approver's limit
        		if(limit == '' || limit == null){
        			//No limit
        			poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: true});
        			poRecord.setValue({ fieldId: 'approvalstatus', value: 2});
        			poRecord.setValue({ fieldId: 'custbody_nsacs_secondapprover', value: runtime.getCurrentUser().id});
        			poRecord.setValue({ fieldId: 'nextapprover', value: ''});
        			poRecord.setValue({ fieldId: 'custbody_nsacs_updateflag', value: true});
        			log.debug('nextapprover is blank', 'value: ' + poRecord.getValue({ fieldId: 'nextapprover'}));
        	    	var updatePO = poRecord.save({
        	    		enableSourcing: true,
        	    		ignoreMandatoryFields: true
        	    	});
        		}
        		else if(poRecord.getValue({ fieldId: 'total'}) > limit){
        			//Total is above the approver's purchase limit
        			try{
            			var nextApproverEmployee = record.load({
            				type: record.Type.EMPLOYEE,
            				id: employeeSearch.getValue('purchaseorderapprover')
            			});
        				var subj = 'Purchase Order: ' + poRecord.getValue({ fieldId: 'tranid'}) + ' for Approval';
        				//var bdy = 'Approval limit of ' + employeeSearch.getValue('purchaseorderapprovallimit') + ' exceeds the Total value of the transaction.\nPlease check the Purchase Order for your action.';
            			var bdy = 'Good day.\n\nA Purchase Order has been assigned to you for Confirmation.\nPlease check Purchase Order # ' + poRecord.getValue({ fieldId: 'tranid'}) + ' for your approval.\n\nThank you,\n[-System generated mail-]';
        				email.send({
                            author: -5,
                            recipients: [nextApproverEmployee.getValue('email')],
                            subject: subj,
                            body: bdy
                        });
        				
        				var subj = 'Purchase Order: ' + poRecord.getValue({ fieldId: 'tranid'}) + ' Approval Status';
        				var bdy = 'Good day.\n\nThe Purchase Order # ' + poRecord.getValue({ fieldId: 'tranid'}) + ' exceeds the Approval Limit assigned to your Employee Record. An e-mail has been sent to your next Purchase Order Approver for their confirmation.\n\nThank you\n\n[-System generated mail-]';
        				email.send({
                            author: -5,
                            recipients: [employeeSearch.getValue('email')],
                            subject: subj,
                            body: bdy
                        });
        				
        				poRecord.setValue({ fieldId: 'nextapprover', value: nextApproverEmployee.getValue('id')});
            			poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: true});
            			poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: runtime.getCurrentUser().id});
            			poRecord.setValue({ fieldId: 'custbody_nsacs_updateflag', value: true});
        				var updatePO = poRecord.save({
        					enableSourcing: true,
        					ignoreMandatoryFields: true
        				});
        			}
        			catch(e){
        				//No e-mail is assigned.
        			}
        		}
        		else{
        			//Limit is within the Total. Transaction is set to approved.
        			poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: true});
        			poRecord.setValue({ fieldId: 'approvalstatus', value: 2});
        			poRecord.setValue({ fieldId: 'custbody_nsacs_secondapprover', value: runtime.getCurrentUser().id});
        			poRecord.setValue({ fieldId: 'nextapprover', value: ''});
        			poRecord.setValue({ fieldId: 'custbody_nsacs_updateflag', value: true});
        	    	var updatePO = poRecord.save({
        	    		enableSourcing: true,
        	    		ignoreMandatoryFields: true
        	    	});
        		}
        	}
        	else if(isAccountingApprover == false && context.request.parameters.status == 'T'){
        		//Initial approver approves the transaction
        		var currentEmployee = runtime.getCurrentUser().id;
        		var employeeSearch = record.load({
        			type: record.Type.EMPLOYEE,
        			id: currentEmployee
        		});
        		var limit = employeeSearch.getValue('purchaseorderapprovallimit');
        		log.debug('total | limit', poRecord.getValue({ fieldId: 'total'}) + ' | ' + limit);
        		if(limit == '' || limit == null){
        			//No limit
        			poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: true});
        			poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: runtime.getCurrentUser().id});
        			poRecord.setValue({ fieldId: 'approvalstatus', value: 1});
        			poRecord.setValue({ fieldId: 'custbody_nsacs_updateflag', value: true});
        	    	var updatePO = poRecord.save({
        	    		enableSourcing: true,
        	    		ignoreMandatoryFields: true
        	    	});
        		}
        		else if(poRecord.getValue({ fieldId: 'total'}) > limit){
        			//Total is above the approver's purchase limit
        			//poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: false});
        			
        			try{
            			var nextApproverEmployee = record.load({
            				type: record.Type.EMPLOYEE,
            				id: employeeSearch.getValue('purchaseorderapprover')
            			});
        				var subj = 'Purchase Order: ' + poRecord.getValue({ fieldId: 'tranid'}) + ' for Approval';
        				//var bdy = 'Approval limit of ' + employeeSearch.getValue('purchaseorderapprovallimit') + ' exceeds the Total value of the transaction.\nPlease check the Purchase Order for your action.';
        				var bdy = 'Good day.\n\nA Purchase Order has been assigned to you for Confirmation.\nPlease check Purchase Order # ' + poRecord.getValue({ fieldId: 'tranid'}) + ' for your approval.\n\nThank you,\n[-System generated mail-]';
        				email.send({
                            author: -5,
                            recipients: [nextApproverEmployee.getValue('email')],
                            subject: subj,
                            body: bdy
                        });
        				
        				var subj = 'Purchase Order: ' + poRecord.getValue({ fieldId: 'tranid'}) + ' Approval Status';
        				var bdy = 'Good day.\n\nThe Purchase Order # ' + poRecord.getValue({ fieldId: 'tranid'}) + ' exceeds the Approval Limit assigned to your Employee Record. An e-mail has been sent to your next Purchase Order Approver for their confirmation.\n\nThank you\n\n[-System generated mail-]';
        				email.send({
                            author: -5,
                            recipients: [employeeSearch.getValue('email')],
                            subject: subj,
                            body: bdy
                        });
        				
        				poRecord.setValue({ fieldId: 'nextapprover', value: nextApproverEmployee.getValue('id')});
        				//Add initial approver regardless as per customer-request
            			poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: true});
            			poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: runtime.getCurrentUser().id});
            			poRecord.setValue({ fieldId: 'approvalstatus', value: 1});
            			poRecord.setValue({ fieldId: 'custbody_nsacs_updateflag', value: true});
        				var updatePO = poRecord.save({
        					enableSourcing: true,
        					ignoreMandatoryFields: true
        				});
        			}
        			catch(e){
        				//No e-mail is assigned.
        			}
        		}
        		else{
        			//Limit is within the Total
        			var nextApproverEmployee = record.load({
        				type: record.Type.EMPLOYEE,
        				id: employeeSearch.getValue('purchaseorderapprover')
        			});
        			poRecord.setValue({ fieldId: 'nextapprover', value: nextApproverEmployee.getValue('id')});
        			poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: true});
        			poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: runtime.getCurrentUser().id});
        			poRecord.setValue({ fieldId: 'approvalstatus', value: 1});
        			poRecord.setValue({ fieldId: 'custbody_nsacs_updateflag', value: true});
        	    	var updatePO = poRecord.save({
        	    		enableSourcing: true,
        	    		ignoreMandatoryFields: true
        	    	});
        		}
        	}
        	else if(context.request.parameters.status == 'R'){
        		//Re-open
        		
        		var currentEmployee = runtime.getCurrentUser().id;
        		
        		if(poRecord.getValue({ fieldId: 'employee'}) != ''){
            		var employeeSearch = record.load({
            			type: record.Type.EMPLOYEE,
            			id: poRecord.getValue({ fieldId: 'employee'})
            		});
        			var nextApproverEmployee = record.load({
        				type: record.Type.EMPLOYEE,
        				id: employeeSearch.getValue('purchaseorderapprover')
        			});
        			poRecord.setValue({ fieldId: 'nextapprover', value: nextApproverEmployee.getValue('id')});
        		}
        		else{
        			poRecord.setValue({ fieldId: 'nextapprover', value: ''});
        		}
        		
        		poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: ''});
        		poRecord.setValue({ fieldId: 'custbody_nsacs_secondapprover', value: ''});
        		poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: false});
        		poRecord.setValue({ fieldId: 'approvalstatus', value: 1});
        		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectpo', value: false});
        		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectreason', value: ''});
        		poRecord.setValue({ fieldId: 'custbody_nsacs_updateflag', value: true});
    	    	var updatePO = poRecord.save({
    	    		enableSourcing: true,
    	    		ignoreMandatoryFields: true
    	    	});
        	}
        	else if(context.request.parameters.status == 'F'){
        		//Reject
        		var form = serverWidget.createForm({
        			title: 'Enter Reject Reason',
        			hideNavBar: false
        		});
        		form.addField({
        			id: 'custpage_rejectnote',
        			label: 'Reject Reason',
        			type: serverWidget.FieldType.TEXTAREA
        		});
    			var fld1 = form.getField('custpage_rejectnote');
    			fld1.isMandatory = true;
    			var internalID = form.addField({
    				id: 'custpage_internalid',
    				label: 'Internal ID',
    				type: serverWidget.FieldType.TEXT
    			});
    			internalID.defaultValue = String(context.request.parameters.rcID);
    			internalID.updateDisplayType({'displayType':'inline'});
        		
        		form.addSubmitButton({
        			label: 'Submit'
        		});
        		
        		/*poRecord.setValue({ fieldId: 'custbody_nsacs_rejectpo', value: true});
        		poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: false});
        		poRecord.setValue({ fieldId: 'approvalstatus', value: 3});
        		//poRecord.setValue({ fieldId: 'orderstatus', value: 'C'});	//C - Reject
        		poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: ''});
        		poRecord.setValue({ fieldId: 'custbody_nsacs_secondapprover', value: ''});
    	    	var updatePO = poRecord.save({
    	    		enableSourcing: true,
    	    		ignoreMandatoryFields: true
    	    	});*/
        		context.response.writePage(form);
        	}
        	if(context.request.parameters.status != 'F'){
        		context.response.writePage(poRecord);
        	}
    	}
    	else{
    		//TODO
    		var poID = context.request.parameters.custpage_internalid;
        	var poRecord = record.load({
        		type: record.Type.PURCHASE_ORDER,
        		id: poID,
        		isDynamic: true
        	});
    		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectpo', value: true});
    		poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: false});
    		poRecord.setValue({ fieldId: 'approvalstatus', value: 3});
    		poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: ''});
    		poRecord.setValue({ fieldId: 'custbody_nsacs_secondapprover', value: ''});
    		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectreason', value: context.request.parameters.custpage_rejectnote });
    		poRecord.setValue({ fieldId: 'custbody_nsacs_updateflag', value: true});
	    	var updatePO = poRecord.save({
	    		enableSourcing: true,
	    		ignoreMandatoryFields: true
	    	});
	    	//window.location = '/app/accounting/transactions/purchord.nl?id=' + poID;
	    	//window.open('/app/accounting/transactions/purchord.nl?id=' + poID);
	    	//context.response.writePage(poRecord);
	    	var redirect = '<html>'
	             + '<script type="text/javascript">'
	             + 'window.location = "/app/accounting/transactions/purchord.nl?id=' + poID + '";'
	             + '</script>'
	             + '</html>';
	    	context.response.write(redirect);
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
