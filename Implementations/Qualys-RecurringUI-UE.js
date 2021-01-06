/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/record', 'N/search'],
/**
 * @param {email} email
 * @param {record} record
 * @param {search} search
 */
function(email, record, search) {
    
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
    	if(scriptContext.type == scriptContext.UserEventType.COPY){
    		var invcRecord = scriptContext.newRecord;
    		invcRecord.setValue({ fieldId: 'custbody_nsacs_eligible_recurring', value: false});
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
    	if(scriptContext.type == scriptContext.UserEventType.EDIT){
    		//Employee e-mail distro to be used when sending e-mails. Change the internal ID per account accordingly.
        	var ARqualysEmployeeID = '2654424';
    		
        	try{
            	var invcRecord = scriptContext.newRecord;
            	var isRecurring = invcRecord.getValue({ fieldId: 'custbody_nsacs_eligible_recurring'});
            	var total = invcRecord.getValue({ fieldId: 'total'});
            	var remAmt = invcRecord.getValue({ fieldId: 'amountremaining'});
            	//var lastAmt = invcRecord.getValue({ fieldId: 'custbody_nsacs_orig_amt'});
            	var invcId = invcRecord.getValue({ fieldId: 'id'});
            	var firstDeposit = invcRecord.getValue({ fieldId: 'custbody_nsacs_first_deposit'});
            	var nextChargeDate = invcRecord.getValue({ fieldId: 'custbody_nsacs_next_chargedate'});
            	var terms = invcRecord.getValue({ fieldId: 'custbody_nsacs_terms_remaining'});
            	var termsRemaining = invcRecord.getValue({ fieldId: 'custbody_nsacs_terms_remaining'});
            	//var customerEmail = invcRecord.getValue({ fieldId: 'email'});
    			var currency = invcRecord.getValue({ fieldId: 'currency'});
    			
    			var currencySearch = search.create({
    				type: search.Type.CURRENCY,
    				columns: ['internalid', 'symbol']
    			});
    			var currFilters = currencySearch.filters;
    			currFilters.push(search.createFilter({
    				name: 'internalid',
    				operator: 'is',
    				values: currency
    			}));
    			
    			//ISO-code to be used when sending e-mails for the changed charge amount.
    			var ISOcode = '';
    			currencySearch.run().each(function(result){
    				ISOcode = result.getValue({ name: 'symbol'});
    				return false;
    			});
            	
        		var x = search.lookupFields({
    				type: search.Type.INVOICE,
    				id: invcId,
    				columns: ['total', 'custbody_nsacs_terms_remaining', 'amountremaining', 'tranid', 'exchangerate']
    			});
        		
        		log.debug('total | x.total | x.amountremaining', total + ' | ' + x.total + ' | ' + x.amountremaining);
        		log.debug('old terms | current terms', x.custbody_nsacs_terms_remaining + ' | ' + terms);
            	
            	if(Number(Math.round((total * x.exchangerate)+'e'+2)+'e-'+2) != x.total && isRecurring == true && firstDeposit != '' && nextChargeDate != '' && x.custbody_nsacs_terms_remaining != terms){
    	    		/*
    	    		 * Is the original total not equal to the current total?
    	    		 * Is the transaction recurring?
    	    		 * Is the firstDeposit field not blank?
    	    		 * Is the nextChargeDate not blank?
    	    		 * Is the original terms remaining not equal to the current terms remaining?
    	    		 */
            		
            		var weekDays = new Array('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
	    			var subj = 'Invoice # ' + x.tranid + ' Amount Changed.';
	    			var recurringAmount = (((total * x.exchangerate) - (x.total - x.amountremaining)) / termsRemaining);
	    			var convertedRecurringTotal = Number(Math.round((recurringAmount / x.exchangerate)+'e'+2)+'e-'+2);
	    			var bdy = '<html><head></head><body><p>Dear Valued Qualys Customer,<br/><br/>The recurring charge for Invoice # '+ x.tranid +' that is scheduled for '+ weekDays[(nextChargeDate.getDay() - 1)] + ' ' + (nextChargeDate.getMonth() + 1) + '/' + nextChargeDate.getDay() + '/' + nextChargeDate.getFullYear() +' has been revised. As of your next payment the recurring remittance amount is ' + ISOcode + ' '+ convertedRecurringTotal +'.<br/><br/>This is due to a change on the remaining balance due and recurring payment terms. For all invoice-related questions, please send an email directly to AR@qualys.com.<br/><br/>Sincerely,<br/>Qualys AR Team<br/><br/>Qualys, Inc.<br/>http://www.qualys.com </p></body></html>';
		    		var arQualys = search.lookupFields({
		    			type: search.Type.EMPLOYEE,
		    			id: ARqualysEmployeeID,
		    			columns: ['email']
		    		});
	    			email.send({
	                    author: -5,
	                    recipients: arQualys.email,
	                    subject: subj,
	                    body: bdy
	                });
	                log.debug('Adjustment email change sent to: ', arQualys.email);
            	}
            	else if(Number(Math.round((total * x.exchangerate)+'e'+2)+'e-'+2) != x.total && isRecurring == true){
            		/*
            		 * Is the original total not equal to the current total?
            		 * Is the transaction recurring?
            		 */
            		
    	    		var weekDays = new Array('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
	    			var subj = 'Invoice # ' + x.tranid + ' Amount Changed.';
	    			var recurringAmount = (((total * x.exchangerate) - (x.total - x.amountremaining)) / termsRemaining);
	    			var convertedRecurringTotal = Number(Math.round((recurringAmount / x.exchangerate)+'e'+2)+'e-'+2);
	    			var bdy = '<html><head></head><body><p>Dear Valued Qualys Customer,<br/><br/>The recurring charge for Invoice # '+ x.tranid +' that is scheduled for '+ weekDays[(nextChargeDate.getDay() - 1)] + ' ' + (nextChargeDate.getMonth() + 1) + '/' + nextChargeDate.getDay() + '/' + nextChargeDate.getFullYear() +' has been revised. As of your next payment the recurring remittance amount is ' + ISOcode + ' '+ convertedRecurringTotal +'.<br/><br/>This is due to a change on the remaining balance due and recurring payment terms. For all invoice-related questions, please send an email directly to AR@qualys.com.<br/><br/>Sincerely,<br/>Qualys AR Team<br/><br/>Qualys, Inc.<br/>http://www.qualys.com </p></body></html>';
		    		var arQualys = search.lookupFields({
		    			type: search.Type.EMPLOYEE,
		    			id: ARqualysEmployeeID,
		    			columns: ['email']
		    		});
	    			email.send({
	                    author: -5,
	                    recipients: arQualys.email,
	                    subject: subj,
	                    body: bdy
	                });
	                log.debug('Adjustment email change sent to: ', arQualys.email);
            	}
            	else if(isRecurring == true && firstDeposit != '' && nextChargeDate != '' && x.custbody_nsacs_terms_remaining != terms){
            		/*
            		 * Is the transaction recurring?
            		 * Is the nextChargeDate not blank?
            		 * Is the original terms remaining not equal to the current termms?
            		 */
            		
	    			var subj = 'Invoice # ' + x.tranid + ' Amount Changed.';
	    			var recurringAmount = (((total * x.exchangerate) - (x.total - x.amountremaining)) / termsRemaining);
    	    		var weekDays = new Array('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
    	    		var convertedRecurringTotal = Number(Math.round((recurringAmount / x.exchangerate)+'e'+2)+'e-'+2);
	    			var bdy = '<html><head></head><body><p>Dear Valued Qualys Customer,<br/><br/>The recurring charge for Invoice # '+ x.tranid +' that is scheduled for '+ weekDays[(nextChargeDate.getDay() - 1)] + ' ' + (nextChargeDate.getMonth() + 1) + '/' + nextChargeDate.getDay() + '/' + nextChargeDate.getFullYear() +' has been revised. As of your next payment the recurring remittance amount is ' + ISOcode + ' '+ convertedRecurringTotal +'.<br/><br/>This is due to a change on the remaining balance due and recurring payment terms. For all invoice-related questions, please send an email directly to AR@qualys.com.<br/><br/>Sincerely,<br/>Qualys AR Team<br/><br/>Qualys, Inc.<br/>http://www.qualys.com </p></body></html>';
		    		var arQualys = search.lookupFields({
		    			type: search.Type.EMPLOYEE,
		    			id: ARqualysEmployeeID,
		    			columns: ['email']
		    		});
	    			email.send({
	                    author: -5,
	                    recipients: arQualys.email,
	                    subject: subj,
	                    body: bdy
	                });
	                log.debug('Adjustment email change sent to: ', arQualys.email);
            	}
        	}
        	catch(e){
        		log.error('Error', e);
        	}
    	}
    }
    
    /*
    function roundNumber(num, scale) {
    	    return +(Math.round(num + "e+" + scale)  + "e-" + scale);
    }*/

    return {
    	beforeLoad: beforeLoad,
    	beforeSubmit: beforeSubmit
    };
    
});
