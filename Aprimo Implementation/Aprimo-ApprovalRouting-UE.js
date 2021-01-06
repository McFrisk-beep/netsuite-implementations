/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/transaction', 'N/runtime', 'N/record', 'N/email'],
/**
 * @param {search} search
 * @param {transaction} transaction
 */
function(search, transaction, runtime, record, email) {
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	var poForm = scriptContext.newRecord;
    	
    	try{
        	if(scriptContext.type == scriptContext.UserEventType.VIEW){
        		log.debug('Environment type', runtime.envType);
        		
    			var empIDstore = runtime.getCurrentUser().id;
    			
    			var nextID, isAccountingApprover;
    			
    			if(poForm.getValue({ fieldId: 'employee'}) != ''){
        			var purchaseApprover = record.load({
        				type: record.Type.EMPLOYEE,
        				id: poForm.getValue({ fieldId: 'employee'})
        			});
        			nextID = purchaseApprover.getValue('purchaseorderapprover');
        			isAccountingApprover = purchaseApprover.getValue('custentity_nsacs_acct_approver');
        			if(nextID != empIDstore){
        				log.debug('Employee next immediate approver does not match current user.', nextID + ' | ' + empIDstore);
        				isAccountingApprover = false;
        			}
    			}
    			else{
    				nextID = '';
    				isAccountingApprover = false;
    			}
    			
    			var isRejected = poForm.getValue({ fieldId: 'custbody_nsacs_rejectpo'});
    			var currentEmployee = record.load({
    				type: record.Type.EMPLOYEE,
    				id: empIDstore
    			});
    			var isOtherAccountingApprover = currentEmployee.getValue('custentity_nsacs_acct_approver');
    			log.debug('isAccountingApprover | isOtherAccountingApprover | nextID | approval status', isAccountingApprover + ' | ' + isOtherAccountingApprover + ' | ' + nextID + ' | ' + poForm.getValue({ fieldId: 'approvalstatus'}));
        		
        		if((isAccountingApprover == true || nextID == empIDstore || isOtherAccountingApprover == true) && isRejected == false){
        			//Initial Approver and Super Approver can see the buttons.
        			log.debug('Inside button render');
        			
        			var poClientForm = scriptContext.form;
        			poClientForm.clientScriptFileId = '128741';		//Client Script file internal ID
        			
        			var isInitialApproved = poForm.getValue({ fieldId: 'custbody_nsacs_initialapproval'});
        			if(isInitialApproved == true && poForm.getValue({ fieldId: 'approvalstatus'}) == '1'){
        				if(isAccountingApprover == false && isOtherAccountingApprover == false){
            				log.debug('show reject - 1');
                			poClientForm.addButton({
                    			id: 'custpage_button_reject',
                    			label: 'Reject',
                    			functionName: 'reject('+poForm.getValue({ fieldId: 'id'})+')'
                    		});
        				}
        				else{
            				log.debug('show approve/reject - 1');
                			poClientForm.addButton({
                    			id: 'custpage_button_approve',
                    			label: 'Approve',
                    			functionName: 'approve('+poForm.getValue({ fieldId: 'id'})+')'
                    		});
                			poClientForm.addButton({
                    			id: 'custpage_button_reject',
                    			label: 'Reject',
                    			functionName: 'reject('+poForm.getValue({ fieldId: 'id'})+')'
                    		});
        				}
        			}
        			else if(poForm.getValue({ fieldId: 'approvalstatus'}) == '2'){
        				log.debug('dont show any buttons - 2');
        			}
        			else if(isAccountingApprover == true || isOtherAccountingApprover == true){
        				log.debug('show approve/reject - 2');
            			poClientForm.addButton({
                			id: 'custpage_button_approve',
                			label: 'Approve',
                			functionName: 'approve('+poForm.getValue({ fieldId: 'id'})+')'
                		});
            			poClientForm.addButton({
                			id: 'custpage_button_reject',
                			label: 'Reject',
                			functionName: 'reject('+poForm.getValue({ fieldId: 'id'})+')'
                		});
        			}
        			else{
        				if(poForm.getValue({ fieldId: 'nextapprover'}) == empIDstore){
            				log.debug('show approve/reject - 3');
                			poClientForm.addButton({
                    			id: 'custpage_button_approve',
                    			label: 'Approve',
                    			functionName: 'approve('+poForm.getValue({ fieldId: 'id'})+')'
                    		});
                			poClientForm.addButton({
                    			id: 'custpage_button_reject',
                    			label: 'Reject',
                    			functionName: 'reject('+poForm.getValue({ fieldId: 'id'})+')'
                    		});
        				}else{
                			log.debug('inside no access rights - 1');
                			//User does not have approval rights whatsoever.
        				}
        			}
        		}
        		else if((isAccountingApprover == true || nextID == empIDstore || isOtherAccountingApprover == true) && isRejected == true){
        			log.debug('inside rejected transaction. show re-open');
        			
        			var poClientForm = scriptContext.form;
        			poClientForm.clientScriptFileId = '128741';		//Client Script file internal ID
        			poClientForm.addButton({
            			id: 'custpage_button_reopen',
            			label: 'Re-Open',
            			functionName: 'reopenForm('+poForm.getValue({ fieldId: 'id'})+')'
            		});
        		}
        		else{
        			var poClientForm = scriptContext.form;
        			poClientForm.clientScriptFileId = '128741';		//Client Script file internal ID
        			
    				if(poForm.getValue({ fieldId: 'nextapprover'}) == empIDstore){
        				log.debug('show approve/reject - 4');
            			poClientForm.addButton({
                			id: 'custpage_button_approve',
                			label: 'Approve',
                			functionName: 'approve('+poForm.getValue({ fieldId: 'id'})+')'
                		});
            			poClientForm.addButton({
                			id: 'custpage_button_reject',
                			label: 'Reject',
                			functionName: 'reject('+poForm.getValue({ fieldId: 'id'})+')'
                		});
    				}else{
            			log.debug('inside no access rights - 2');
            			//User does not have approval rights whatsoever.
    				}
        		}
        	}
    	}
    	catch(e){
    		//do nothing. Most likely the custom employee field is not populated.
    		log.debug('error', e);
    	}
    }
    

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
    	if(scriptContext.type == scriptContext.UserEventType.COPY || scriptContext.type == scriptContext.UserEventType.CREATE){
    		log.debug('Context', scriptContext.type);
    		log.debug('current USER information', runtime.getCurrentUser());
    		
    		var poRecord = scriptContext.newRecord;
    		poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: ''});
    		poRecord.setValue({ fieldId: 'custbody_nsacs_secondapprover', value: ''});
    		poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: false});
    		//poRecord.setValue({ fieldId: 'supervisorapproval', value: false});
    		poRecord.setValue({ fieldId: 'approvalstatus', value: 1});
    		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectpo', value: false});
    		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectreason', value: ''});
    		
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
    	}
    	else if(scriptContext.type == scriptContext.UserEventType.EDIT){
    		log.debug('Context', scriptContext.type);
    		log.debug('current USER information', runtime.getCurrentUser());
    		
    		var poRecord = scriptContext.newRecord;
    		var isAccountingApprover;
    		
    		if(poRecord.getValue({ fieldId: 'employee'}) != ''){
    			var purchaseApprover = record.load({
    				type: record.Type.EMPLOYEE,
    				id: poRecord.getValue({ fieldId: 'employee'})
    			});
    			isAccountingApprover = purchaseApprover.getValue('custentity_nsacs_acct_approver');
    		}
    		else{
    			isAccountingApprover = false;
    		}
    		
			var currentEmployee = record.load({
				type: record.Type.EMPLOYEE,
				id: runtime.getCurrentUser().id
			});
			var isOtherAccountingApprover = currentEmployee.getValue('custentity_nsacs_acct_approver');
    		
    		if(runtime.getCurrentUser().id == poRecord.getValue({ fieldId: 'custbody_nsacs_firstapprover'}) || isAccountingApprover == true || isOtherAccountingApprover == true){
    			//log.debug('modified by PO approver. Retaining status');
                log.debug('modified by Eligible PO approver. Set back to Pending Approval');
    			//do nothing. users are authorized to modify
    			//Test scenario. Usually this is commented out.
    			var poLoadRecord = record.load({
    				type: record.Type.PURCHASE_ORDER,
    				id: poRecord.getValue({ fieldId: 'id'})
    			});
    			var oldTotal = poLoadRecord.getValue('total');
    			//var oldTranDate = poLoadRecord.getValue('trandate');
    			var oldVendor = poLoadRecord.getValue('entity');
    			var oldExchangeRate = poLoadRecord.getValue('exchangerate');
    			
    			log.debug('old total check', oldTotal + ' | ' + poRecord.getValue({ fieldId: 'total'}));
    			//og.debug('old trandate check', oldTranDate + ' | ' + poRecord.getValue({ fieldId: 'trandate'}));
    			log.debug('old entity check', oldVendor + ' | ' + poRecord.getValue({ fieldId: 'entity'}));
    			log.debug('old exchangerate check', oldExchangeRate + ' | ' + poRecord.getValue({ fieldId: 'exchangerate'}));
    			
    			if(oldTotal != poRecord.getValue({ fieldId: 'total'}) || oldVendor != poRecord.getValue({ fieldId: 'entity'}) || oldExchangeRate != poRecord.getValue({ fieldId: 'exchangerate'})){
            		//Differentiates the Suitelet's "Approve/Reject" from the User-edited changes.
    				if(poRecord.getValue({ fieldId: 'custbody_nsacs_updateflag'}) == false){
        				poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: ''});
                		poRecord.setValue({ fieldId: 'custbody_nsacs_secondapprover', value: ''});
                		poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: false});
                		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectpo', value: false});
                		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectreason', value: ''});
                        poRecord.setValue({ fieldId: 'approvalstatus', value: 1});
                        
            			try{
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
            			catch(e){
            				poRecord.setValue({ fieldId: 'nextapprover', value: ''});
            			}
            		}
    			}
    		}
    		else{
    			log.debug('modified by non-PO approver. Set back to Pending approval');
    			var poLoadRecord = record.load({
    				type: record.Type.PURCHASE_ORDER,
    				id: poRecord.getValue({ fieldId: 'id'})
    			});
    			var oldTotal = poLoadRecord.getValue('total');
    			//var oldTranDate = poLoadRecord.getValue('trandate');
    			var oldVendor = poLoadRecord.getValue('entity');
    			var oldExchangeRate = poLoadRecord.getValue('exchangerate');
    			
    			log.debug('old total check', oldTotal + ' | ' + poRecord.getValue({ fieldId: 'total'}));
    			//log.debug('old trandate check', oldTranDate + ' | ' + poRecord.getValue({ fieldId: 'trandate'}));
    			log.debug('old entity check', oldVendor + ' | ' + poRecord.getValue({ fieldId: 'entity'}));
    			log.debug('old exchangerate check', oldExchangeRate + ' | ' + poRecord.getValue({ fieldId: 'exchangerate'}));
    			
    			if(oldTotal != poRecord.getValue({ fieldId: 'total'}) || oldVendor != poRecord.getValue({ fieldId: 'entity'}) || oldExchangeRate != poRecord.getValue({ fieldId: 'exchangerate'})){
            		if(poRecord.getValue({ fieldId: 'custbody_nsacs_updateflag'}) == false){
        				poRecord.setValue({ fieldId: 'custbody_nsacs_firstapprover', value: ''});
                		poRecord.setValue({ fieldId: 'custbody_nsacs_secondapprover', value: ''});
                		poRecord.setValue({ fieldId: 'custbody_nsacs_initialapproval', value: false});
                		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectpo', value: false});
                		poRecord.setValue({ fieldId: 'custbody_nsacs_rejectreason', value: ''});
                        poRecord.setValue({ fieldId: 'approvalstatus', value: 1});
                        
            			try{
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
            			catch(e){
            				poRecord.setValue({ fieldId: 'nextapprover', value: ''});
            			}
            		}
    			}
    		}
    	}
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
    
});
