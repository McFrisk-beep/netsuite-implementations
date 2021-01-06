/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/email'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search, email) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var rejectNote = runtime.getCurrentScript().getParameter({ name: 'custscript_rejectnote'});
    	var statusUpdate = runtime.getCurrentScript().getParameter({ name: 'custscript_statusupdate'});
    	var employeeID = runtime.getCurrentScript().getParameter({ name: 'custscript_employeeid'});
    	var isAcctingApprover = runtime.getCurrentScript().getParameter({ name: 'custscript_acctingapprover'});
    	var approvalLimit = runtime.getCurrentScript().getParameter({ name: 'custscript_approvallimit'});
    	var poList = runtime.getCurrentScript().getParameter({ name: 'custscript_polist'});
    	
    	log.debug('Suitelet - Reject Note', runtime.getCurrentScript().getParameter({ name: 'custscript_rejectnote'}));
    	log.debug('Suitelet - Status Update', runtime.getCurrentScript().getParameter({ name: 'custscript_statusupdate'}));
    	log.debug('Suitelet - Employee ID', runtime.getCurrentScript().getParameter({ name: 'custscript_employeeid'}));
    	log.debug('Suitelet - Is Accounting Approver', runtime.getCurrentScript().getParameter({ name: 'custscript_acctingapprover'}));
    	log.debug('Suitelet - Approval Limit', runtime.getCurrentScript().getParameter({ name: 'custscript_approvallimit'}));
    	log.debug('Suitelet - PO List', runtime.getCurrentScript().getParameter({ name: 'custscript_polist'}));
    	
    	var poArr = new Array();
    	
    	//Splicing purchase order numbers than doing a search is quicker. Saved on time efficiency as opposed to searching for values.
    	var poNum = '';
    	for(var x = 0; x < poList.length; x++){
			if(poList[x] != ','){
				poNum += poList[x];
			}
			else{
				poArr.push(poNum);
				log.debug('Loop - Invoice', poNum);
				poNum = '';
			}
    	}
		poArr.push(poNum);
		log.debug('Outside Loop - Invoice', poNum);
		log.debug('Array length', poArr.length);
		
		/*
		 * 1 = Pending Approval
		 * 2 = Approve
		 * 3 = Reject
		 */
		for(var x = 0; x < poArr.length; x++){
			var lookUpFields = search.lookupFields({
				type: search.Type.PURCHASE_ORDER,
				id: poArr[x],
				columns: ['tranid', 'custbody_nsacs_firstapprover', 'custbody_nsacs_secondapprover', 'custbody_nsacs_initialapproval', 'approvalstatus', 'total', 'nextapprover', 'custbody_nsacs_rejectreason', 'custbody_nsacs_rejectpo']
			});
			var total = lookUpFields['total'];
			var tranid = lookUpFields['tranid'];
			
			if(statusUpdate == 3){
				//Reject the PO
				log.debug('Reject PO', tranid);
				var updateFields = record.submitFields({
					type: record.Type.PURCHASE_ORDER,
					id: poArr[x],
					values:{
						custbody_nsacs_firstapprover : '',
						custbody_nsacs_secondapprover: '',
						custbody_nsacs_initialapproval: false,
						approvalstatus: 3,
						nextapprover: '',
						custbody_nsacs_rejectreason: rejectNote,
						custbody_nsacs_rejectpo: true
					}
				});
			}
			else if(isAcctingApprover == 'true'){
				log.debug('Accounting Approver', tranid);
				log.debug('Approval limit vs. Total', approvalLimit + ' | ' + total);
				if(approvalLimit == '' || approvalLimit == null || Number(approvalLimit) >= Number(total)){
					log.debug('Approve transaction');
					var updateFields = record.submitFields({
						type: record.Type.PURCHASE_ORDER,
						id: poArr[x],
						values:{
							custbody_nsacs_secondapprover: employeeID,
							approvalstatus: 2,
							nextapprover: '',
							custbody_nsacs_initialapproval : true
						}
					});
				}
				else{
					log.debug('Pass to next approver');
	        		var employeeSearch = record.load({
	        			type: record.Type.EMPLOYEE,
	        			id: employeeID
	        		});
        			var nextApproverEmployee = record.load({
        				type: record.Type.EMPLOYEE,
        				id: employeeSearch.getValue('purchaseorderapprover')
        			});
    				var subj = 'Purchase Order: ' + tranid + ' for Approval';
    				//var bdy = 'Approval limit of ' + employeeSearch.getValue('purchaseorderapprovallimit') + ' exceeds the Total value of the transaction.\nPlease check the Purchase Order for your action.';
        			var bdy = 'Good day.\n\nA Purchase Order has been assigned to you for Confirmation.\nPlease check Purchase Order # ' + tranid + ' for your approval.\n\nThank you,\n[-System generated mail-]';
    				email.send({
                        author: -5,
                        recipients: [nextApproverEmployee.getValue('email')],
                        subject: subj,
                        body: bdy
                    });
    				
    				var subj = 'Purchase Order: ' + tranid + ' Approval Status';
    				var bdy = 'Good day.\n\nThe Purchase Order # ' + tranid + ' exceeds the Approval Limit assigned to your Employee Record. An e-mail has been sent to your next Purchase Order Approver for their confirmation.\n\nThank you\n\n[-System generated mail-]';
    				email.send({
                        author: -5,
                        recipients: [employeeSearch.getValue('email')],
                        subject: subj,
                        body: bdy
                    });
    				
					var updateFields = record.submitFields({
						type: record.Type.PURCHASE_ORDER,
						id: poArr[x],
						values:{
							nextapprover: nextApproverEmployee.getValue('id'),
							custbody_nsacs_initialapproval: true,
							custbody_nsacs_firstapprover: employeeID
						}
					});
				}
			}
			else if(isAcctingApprover == 'false'){
				log.debug('Non-Accounting Approver', tranid);
				log.debug('Approval limit vs. Total', approvalLimit + ' | ' + total);
				if(approvalLimit == '' || approvalLimit == null || Number(approvalLimit) >= Number(total)){
					log.debug('Within limit. Pass to next approver');
					
	        		var employeeSearch = record.load({
	        			type: record.Type.EMPLOYEE,
	        			id: employeeID
	        		});
					
					var updateFields = record.submitFields({
						type: record.Type.PURCHASE_ORDER,
						id: poArr[x],
						values:{
							custbody_nsacs_initialapproval: true,
							custbody_nsacs_firstapprover: employeeID,
							approvalstatus: 1,
							nextapprover: employeeSearch.getValue('purchaseorderapprover')
						}
					});
				}
				else{
					log.debug('Not within limit. Pass to next approver');
	        		var employeeSearch = record.load({
	        			type: record.Type.EMPLOYEE,
	        			id: employeeID
	        		});
        			var nextApproverEmployee = record.load({
        				type: record.Type.EMPLOYEE,
        				id: employeeSearch.getValue('purchaseorderapprover')
        			});
        			
    				var subj = 'Purchase Order: ' + tranid + ' for Approval';
    				var bdy = 'Good day.\n\nA Purchase Order has been assigned to you for Confirmation.\nPlease check Purchase Order # ' + tranid + ' for your approval.\n\nThank you,\n[-System generated mail-]';
    				email.send({
                        author: -5,
                        recipients: [nextApproverEmployee.getValue('email')],
                        subject: subj,
                        body: bdy
                    });
    				
    				var subj = 'Purchase Order: ' + tranid + ' Approval Status';
    				var bdy = 'Good day.\n\nThe Purchase Order # ' + tranid + ' exceeds the Approval Limit assigned to your Employee Record. An e-mail has been sent to your next Purchase Order Approver for their confirmation.\n\nThank you\n\n[-System generated mail-]';
    				email.send({
                        author: -5,
                        recipients: [employeeSearch.getValue('email')],
                        subject: subj,
                        body: bdy
                    });
    				
					var updateFields = record.submitFields({
						type: record.Type.PURCHASE_ORDER,
						id: poArr[x],
						values:{
							nextapprover: nextApproverEmployee.getValue('id'),
							custbody_nsacs_initialapproval: true,
							custbody_nsacs_firstapprover: employeeID,
							approvalstatus: 1
						}
					});
				}
			}
		}
    }

    return {
        execute: execute
    };
    
});
