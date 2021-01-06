/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/runtime', 'N/record'],

function(search, runtime, record) {
   
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
    	//only triggers on new emails
    	if(scriptContext.type == scriptContext.UserEventType.CREATE && runtime.getCurrentUser().role == '3'){
    		var currRecord = scriptContext.newRecord;
    		log.debug('Script run', 'Executed script');
        	
    		if(currRecord.getValue({ fieldId: 'baseid'}) == ''){
        		//get internal id of customer
            	log.debug('Customer internal ID', currRecord.getValue({ fieldId: 'baseid' }));
            	var customerId = currRecord.getValue({ fieldId: 'entity'});
            	
        		//Get e-mail template internal ID
        		var emailtpl = search.lookupFields({
        			type: search.Type.CUSTOMER,
        			id: customerId,
        			columns: 'custentity_email_template'
        		});
        		
        		//is there any default email template set?
        		try{
            		log.debug('Email template', emailtpl);
                	var emailEntity = emailtpl['custentity_email_template'];
                	var emailid = emailEntity[0]['value'];
            		log.debug('Email template', emailid);
            		
            		//set template to the one selected
            		currRecord.setValue({
            			fieldId: 'template',
            			value: emailid
            		});
        		}
        		catch(e){
        			log.debug('Default Email Template', 'Field is not populated')
        		}
            	
            	//Returns an object containing all values from the custom field
            	var fieldLookup = search.lookupFields({
            		type: search.Type.CUSTOMER,
            		id: customerId,
            		columns: ['custentity_email_cclist']
            	});
            	
            	//are there any selected e-mails on the list?
            	try{
                	log.debug('Email CC List', fieldLookup);
                	
                	//assigns each to the array
                	var customerEntity = fieldLookup['custentity_email_cclist'];
                	var len = customerEntity.length;
                	log.debug('ID List size', len);
                	
                	//gets the e-mail field associated to the array and gets the individual e-mail associated to the contact record
                	for(var x = 0; x < len; x++){
                		var contactLookup = search.lookupFields({
                			type: search.Type.CONTACT,
                			id: customerEntity[x]['value'],
                			columns: 'email'
                		});
                		log.debug('IDs', contactLookup['email']);
                		
                		var noduplicate = true;
                    	for(var y = 0; y < x; y++){
                    		if(currRecord.getSublistValue({
                    			sublistId: 'otherrecipientslist',
                    			fieldId: 'email',
                    			line: y,
                    		}) == contactLookup['email']){
                    			//don't do anything. skip this line.
                    			noduplicate = false;
                    		}
                    	}
                    	if(noduplicate){
                    		currRecord.setSublistValue({
                    			sublistId: 'otherrecipientslist',
                    			fieldId: 'email',
                    			line: x,
                    			value: contactLookup['email']
                    		});
                    		currRecord.setSublistValue({
                    			sublistId: 'otherrecipientslist',
                    			fieldId: 'cc',
                    			line: x,
                    			value: 'T'
                    		});
                    	}
                	}
            	}
            	catch(e){
            		log.debug('Email CC List', e);
            	}
    		}
    		else{
    			log.debug('Do not copy', 'CC list is not copied.');
    		}
    	}
    }

    return {
        beforeLoad: beforeLoad
        //beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    };
    
});
