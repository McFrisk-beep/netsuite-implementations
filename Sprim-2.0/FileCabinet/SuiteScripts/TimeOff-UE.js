/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/runtime', 'N/record', 'N/email'],

function(search, runtime, record, email) {
   
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
    	var timeRecord = scriptContext.newRecord;
    	var timeForm = scriptContext.form;
    	timeForm.clientScriptFileId = '130800';		//Client Script file internal ID
    	var empIDstore = runtime.getCurrentUser().id;
    	var status = timeRecord.getValue({ fieldId: 'custrecord_nsacs_timeoff_status'});
    	
    	//log.debug('empIDstore | record employee', empIDstore + ' | ' + timeRecord.getValue({ fieldId: 'custrecord_nsacs_employee'}));
    	
    	if(scriptContext.type == scriptContext.UserEventType.VIEW && empIDstore != timeRecord.getValue({ fieldId: 'custrecord_nsacs_employee'})
    			&& status == '1'){
    		//Render Approve/Reject options
    		var checkEmployee = record.load({
    			type: record.Type.EMPLOYEE,
    			id: timeRecord.getValue({ fieldId: 'custrecord_nsacs_employee'})
    		});
    		var supervisor = checkEmployee.getValue({ fieldId: 'supervisor'});
    		
    		//If supervisor is the current employee viewing the form, render the Approve/Reject buttons
    		if(supervisor == empIDstore){
        		timeForm.addButton({
        			id: 'custpage_button_approve',
        			label: 'Approve',
        			functionName: 'approve('+timeRecord.getValue({ fieldId: 'id'})+')'
        		});
        		timeForm.addButton({
        			id: 'custpage_button_reject',
        			label: 'Reject',
        			functionName: 'reject('+timeRecord.getValue({ fieldId: 'id'})+')'
        		});
    		}
    		
    	}
    	else if(scriptContext.type == scriptContext.UserEventType.VIEW && empIDstore == timeRecord.getValue({ fieldId: 'custrecord_nsacs_employee'})
    			&& (status == '1' || status == '4')){
    		//Render "Cancel" option
    		timeForm.addButton({
    			id: 'custpage_button_cancel',
    			label: 'Cancel Time-Off Request',
    			functionName: 'cancel('+timeRecord.getValue({ fieldId: 'id'})+')'
    		});
    	}
    	else if((scriptContext.type == scriptContext.UserEventType.EDIT) && empIDstore == timeRecord.getValue({ fieldId: 'custrecord_nsacs_employee'}) && (status == '1' || status == '4')){
    		//Render "Complete Later" option
    		timeForm.addButton({
    			id: 'custpage_button_complete_later',
    			label: 'Complete Later',
    			functionName: 'complete_later('+timeRecord.getValue({ fieldId: 'id'})+')'
    		});
    		
    		//Render "Cancel" button
    		timeForm.addButton({
    			id: 'custpage_button_cancel',
    			label: 'Cancel Time-Off Request',
    			functionName: 'cancel('+timeRecord.getValue({ fieldId: 'id'})+')'
    		});
    	}
    	else if((scriptContext.type == scriptContext.UserEventType.EDIT) && empIDstore == timeRecord.getValue({ fieldId: 'custrecord_nsacs_employee'}) && status == '3'){
    		//Render "Complete Later" option
    		timeForm.addButton({
    			id: 'custpage_button_complete_later',
    			label: 'Complete Later',
    			functionName: 'complete_later('+timeRecord.getValue({ fieldId: 'id'})+')'
    		});
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
    function afterSubmit(scriptContext) {
    	var timeRecord = scriptContext.newRecord;
    	var status = timeRecord.getValue({ fieldId: 'custrecord_nsacs_timeoff_status'});
    	
    	//Email Capture Plugin e-mail: emails.1293220_SB1.958.c0a9869ed7@emails.netsuite.com
    	//Send e-mail to the Supervisor that there's a Time Off request for approval.
    	if(status == '1'){
    		var checkEmployee = record.load({
    			type: record.Type.EMPLOYEE,
    			id: timeRecord.getValue({ fieldId: 'custrecord_nsacs_employee'})
    		});
    		var supervisor = checkEmployee.getValue({ fieldId: 'supervisor'});
    		var subj = "Time Off Request for Approval";
    		var bdy = 
    			"Hello " + checkEmployee.getText({ fieldId: 'supervisor'}) + ",<br/><br/>A Time-Off request has been submitted pending you approval. See details below,<br/><br/>"
    			+ "Employee: " + timeRecord.getText({ fieldId: 'custrecord_nsacs_employee'}) + "<br/>"
    			+ "Date From: " + timeRecord.getValue({ fieldId: 'custrecord_nsacs_datefrom'}) + "<br/>"
    			+ "Date To: " + timeRecord.getValue({ fieldId: 'custrecord_nsacs_dateto'}) + "<br/>"
    			+ "Description: " + timeRecord.getValue({ fieldId: 'custrecord_nsacs_description'}) + "<br/>"
    			+ "Requestor Notes: " + timeRecord.getValue({ fieldId: 'custrecord_nsacs_requestor_notes'}) + "<br/><br/>"
    			+ "Select an action below:<br/>"
    			+ "<a href='https://1293220-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=957&deploy=1&compid=1293220_SB1&h=c33851d2622239daee28&rcID=" + timeRecord.getValue({ fieldId: 'id'}) + "&status=A'>Approve</a><br/>"
    			+ "<a href='https://1293220-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=957&deploy=1&compid=1293220_SB1&h=c33851d2622239daee28&rcID=" + timeRecord.getValue({ fieldId: 'id'}) + "&status=R'>Reject</a><br/><br/><br/>"
    			+ "=== This is a system-generated e-mail ===";
    		
    		//20798 = Email Capture, internal ID of the employee record
			email.send({
                author: 20798,
                recipients: [supervisor],
                subject: subj,
                body: bdy
            });
    	}
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };
    
});
