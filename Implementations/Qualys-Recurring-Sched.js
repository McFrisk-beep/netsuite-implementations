/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/email', 'N/format'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime, email, format) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
	
	//=======GLOBAL VARIABLES=========
	//Employee e-mail distro to be used when sending e-mails. Change the internal ID per account accordingly.
	var ARqualysEmployeeID = '2654424';
	var ARqualysAdminEmployeeID = '-5';
	
    function execute(scriptContext) {
    	
    	var searchId = '19046';		//Recurring Invoice Search. Change ID accordingly.
    	var scriptObj = runtime.getCurrentScript();		//Usage monitor. Scheduled script has 10,000 units.
    	
		var invcSearch = search.load({
			id: searchId
		});
		invcSearch.run().each(function(result){
			//If Usage is less than 1,000; Don't consume anymore units. Skip entire search for next Scheduled instance.
			if(scriptObj.getRemainingUsage() > 1000){
				//Get Invoice details
				var invcId = result.getValue({ name: 'internalid'});
				var invcPayment = result.getValue({ name: 'custbody_nsacs_recurring_amt'});
				var invcAmt = result.getValue({ name: 'amountremaining'});
				var invcDeposit = result.getValue({ name: 'custbody_nsacs_first_deposit'});
				var invcNextCharge = result.getValue({ name: 'custbody_nsacs_next_chargedate'});
				var invcLastCharge = result.getValue({ name: 'custbody_nsacs_last_chargedate'});
				var termsRemaining = result.getValue({ name: 'custbody_nsacs_terms_remaining'});
				var invcCCExpiry = result.getValue({ name: 'custbody_nsacs_cc_expiry'});
				var customerMail = result.getValue({ name: 'email', join: 'customer'});
				var invcExchangeRate = result.getValue({ name: 'exchangerate'});
				
	    		var depLookup = search.lookupFields({
	    			type: search.Type.CUSTOMER_DEPOSIT,
	    			id: invcDeposit,
	    			columns: ['memo']
	    		});
	    		var contactMail = depLookup.memo;
				
				log.audit('invcExchangeRate', invcExchangeRate);
				var exchangeRatePayment = (invcPayment / invcExchangeRate);
				log.audit('exchangeRatePayment', exchangeRatePayment);
				invcPayment = Number(Math.round(exchangeRatePayment+'e'+2)+'e-'+2);
				log.audit('Invoice ID | Payment Amt | Invoice Remaining', invcId + ' | ' + invcPayment + ' | ' + invcAmt);
				
				try{
					if(invcCCExpiry != '' && invcCCExpiry != null){
			    		var monthStr = '';
			    		var yearStr = '';
			    		var monthVal = 0;
			    		var yearVal = 0;
			    		var isYear = false;
			    		for(var i = 0; i < invcCCExpiry.length; i++){
			    			if(isYear == false){
			    				if(invcCCExpiry[i] == '/'){
			    					isYear = true;
			    					monthVal = monthStr;
			    				}
			    				else{
			    					if(invcCCExpiry[i] == '0' && invcCCExpiry[i+1] != '/'){
			    						//do nothing. Ignore first 'zero' value should the customer place the cc date as 01/2020 for instance.
			    					}
			    					else{
			    						monthStr += invcCCExpiry[i];
			    					}
			    				}
			    			}
			    			else if(isYear == true){
			    				yearStr += invcCCExpiry[i];
			    			}
			    		}
			    		if(invcCCExpiry.length != 0){
			        		yearVal = yearStr;
			        		var currentDate = new Date();
			        		var nextMonth = currentDate.getMonth()+2;
			        		var nextTwoMonths = currentDate.getMonth()+3;
			        		var checkYear1 = currentDate.getFullYear();
			        		var checkYear2 = currentDate.getFullYear();
			        		
			        		if(nextMonth > 12){
			        			nextMonth -= 12;
			        			checkYear1++;
			        		}
			        		if(nextTwoMonths > 12){
			        			nextTwoMonths -= 12;
			        			checkYear2++;
			        		}
			        		
			        		log.debug('monthVal | yearVal', monthVal + ' | ' + yearVal);
			        		log.debug('nextMonth | nextTwoMonths', nextMonth + ' | ' + nextTwoMonths);
			        		log.debug('checkYear1', checkYear1);
			        		log.debug('checkYear2', checkYear2);
			        		
				    		var invctranid = search.lookupFields({
				    			type: search.Type.INVOICE,
				    			id: invcId,
				    			columns: ['tranid']
				    		});
			        		
			        		if(monthVal == nextMonth && yearVal == checkYear1){
			        			//Send e-mail for the 30-days expiry
			        			emailEngine(customerMail, contactMail, invcId, invctranid.tranid, '30Expiry');
			        		}
			        		else if(monthVal == nextTwoMonths && yearVal == checkYear2){
			        			//Send e-mail for the 60-days expiry
			        			emailEngine(customerMail, contactMail, invcId, invctranid.tranid, '60Expiry');
			        		}
			        		else if(monthVal == (nextMonth - 1) && yearVal == checkYear1){
			        			//Send e-mail for the 30-days expiry
			        			emailEngine(customerMail, contactMail, invcId, invctranid.tranid, '30Expiry');
			        		}
			    		}
					}
					
			    	//Create Customer Deposit
					var depRcrd = record.copy({
						type: record.Type.CUSTOMER_DEPOSIT,
						id: invcDeposit,
						isDynamic: true
					});
					//if(invcPayment > invcAmt){
					//	depRcrd.setValue({ fieldId: 'payment', value: invcAmt});
					//}
					//else if(invcPayment < invcAmt || invcPayment == invcAmt){
						depRcrd.setValue({ fieldId: 'payment', value: invcPayment});
					//}
					
					var newDeposit = depRcrd.save({
						enableSourcing: true,
						ignoreMandatoryFields: true
					});
					
			    	//Apply Customer Deposit.
			    	var custPayment = record.transform({
			    		fromType: record.Type.INVOICE,
			    		fromId: invcId,
			    		toType: record.Type.CUSTOMER_PAYMENT,
			    		isDynamic: false
			    	});
			    	var depCount = custPayment.getLineCount({ sublistId: 'deposit'});
			    	var invCount = custPayment.getLineCount({ sublistId: 'apply'});
			    	var remainingAmt = '';
			    	var createCustomerPayment = true;
			    	for(var x = 0; x < depCount; x++){
			    		if(custPayment.getSublistValue({ sublistId: 'deposit', fieldId: 'doc', line: x}) == newDeposit){
			    			remainingAmt = custPayment.getSublistValue({ sublistId: 'deposit', fieldId: 'remaining', line: x});
			    			custPayment.setSublistValue({ sublistId: 'deposit', fieldId: 'apply', line: x, value: true});
			    			custPayment.setSublistValue({ sublistId: 'deposit', fieldId: 'amount', line: x, value: remainingAmt});
			    			x = depCount;	//escape the loop
			    		}
			    	}
			    	log.audit('remainingAmt', remainingAmt);
			    	
			    	//If Customer Deposit is greater than the remaining amount, skip this logic.
			    	//Auto-apply will not create a Customer Payment since remaining amount after Customer Deposit is zero (0.00)
			    	for(var x = 0; x < invCount; x++){
			    		if(custPayment.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: x}) == invcId){
			    			custPayment.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: x, value: true});
			    			//custPayment.setSublistValue({ sublistId: 'apply', fieldId: 'userenteredamount', line: x, value: remainingAmt});
			    			
			    			if(remainingAmt == custPayment.getSublistValue({ sublistId: 'apply', fieldId: 'due', line: x})){
			    				createCustomerPayment = false;	//don't create a customer payment if there's no more 'Amount Remaining' after this payment.
			    			}
			    			
			    			x = invCount;
			    		}
			    		else{
			    			custPayment.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: x, value: false});
			    		}
			    	}
			    	
			    	//Prevents double-charging. Just in-case for some reason it might set the payment for the Payment.
			    	custPayment.setValue({ fieldId: 'paymentmethod', value: ''});
			    	custPayment.setValue({ fieldId: 'chargeit', value: false});
			    	//custPayment.setValue({ fieldId: 'payment', value: '0.01'});	//gives an error when it's set to 0.00 or 0
			    	log.debug('Create Customer Payment?', createCustomerPayment);
					var appliedDeposit = custPayment.save({
						enableSourcing: true,
						ignoreMandatoryFields: true
					});
					
					if(createCustomerPayment){
						//Delete the Customer Payment record in order to just 'Apply' from the customer deposit.
						//NOTE: This is essential due to a restriction with NetSuite where the Customer Payment is always required to be created.
						//Removing this line of code will not allow the creation of the Customer Deposit record. That, or other unforseen problems would ensue.
						var delCustPayment = record.delete({ type: record.Type.CUSTOMER_PAYMENT, id: appliedDeposit});
			    	}
					
					//Last Charge Date. Remove next charge so that Saved Search will not read said record and over-bill
					//Else, if not yet last charge date, add 1 month to next charge date
					if(invcNextCharge == invcLastCharge){
			    		var removeNextChargeDate = record.submitFields({
			    			type: record.Type.INVOICE,
			    			id: invcId,
			    			values: {
			    				custbody_nsacs_next_chargedate: '',
			    				custbody_nsacs_terms_remaining: ''
			    			},
			    			options:{
			    				enableSourcing: true,
			    				ignoreMandatoryFields: true
			    			}
			    		});
					}
					else{
						//invcNextCharge
						var nextDateCharge = new Date(invcNextCharge);
						var mm = nextDateCharge.getMonth()+2;
						var dd = nextDateCharge.getDate();
						var yyyy = nextDateCharge.getFullYear();
			    		if(mm > 12){
			    			mm = 1;
			    			yyyy += 1;
			    		}
			    		var updatedDate = mm + '/' + dd + '/' + yyyy;
			    		var nextTerm = termsRemaining - 1;
			    		
			    		var removeNextChargeDate = record.submitFields({
			    			type: record.Type.INVOICE,
			    			id: invcId,
			    			values: {
			    				custbody_nsacs_next_chargedate: updatedDate,
			    				custbody_nsacs_terms_remaining: nextTerm
			    			},
			    			options:{
			    				enableSourcing: true,
			    				ignoreMandatoryFields: true
			    			}
			    		});
					}
					
		    		var invctranid = search.lookupFields({
		    			type: search.Type.INVOICE,
		    			id: invcId,
		    			columns: ['email', 'tranid']
		    		});
		    		var currency = depRcrd.getValue({ fieldId: 'currency'});
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
					var ISOcode = '';
					currencySearch.run().each(function(result){
						ISOcode = result.getValue({ name: 'symbol'});
						return false;
					});
					
		    		/*var deptranid = search.lookupFields({
		    			type: search.Type.CUSTOMER_DEPOSIT,
		    			id: newDeposit,
		    			columns: ['tranid']
		    		});*/
					var newDepositLoad = record.load({                
						type: record.Type.CUSTOMER_DEPOSIT,                
						id: newDeposit
					});
		    		
		    		var subj = 'Customer Deposit #' + newDepositLoad.getValue({ fieldId: 'tranid'}) + ' successfully created.';
					var bdy = 'This e-mail is to confirm that the Customer Deposit has been successfully created.<br/><br/>TOTAL: ' + ISOcode + ' ' + newDepositLoad.getSublistValue({ sublistId: 'paymentevent', fieldId: 'amount', line: 0});
		            try{
						email.send({
			                author: -5,
			                recipients: [customerMail, contactMail],
			                subject: subj,
			                body: bdy
			            });
			            log.audit('E-mail receipt sent to', customerMail + ', ' + contactMail);
		            }
		            catch(e){
		            	//No e-mail.
			    		var arQualys = search.lookupFields({
			    			type: search.Type.EMPLOYEE,
			    			id: ARqualysEmployeeID,
			    			columns: ['email']
			    		});
		    			email.send({
		                    author: -5,
		                    recipients: arQualys.email,
		                    subject: 'Email on Customer record is blank for Invoice # ' + invctranid.tranid,
		                    body: 'The customer associated with the Invoice does not have an e-mail address.\nPlease inform the customer that the Customer Deposit #' + newDepositLoad.getValue({ fieldId: 'tranid'}) + ' has been successfully created with TOTAL: ' + ISOcode + ' ' + newDepositLoad.getSublistValue({ sublistId: 'paymentevent', fieldId: 'amount', line: 0})
		                });
		            }
		            
		    		var removeRecurring = record.submitFields({
		    			type: record.Type.INVOICE,
		    			id: invcId,
		    			values: {
		    				custbody_nsacs_chargeagain: false
		    			},
		    			options:{
		    				enableSourcing: true,
		    				ignoreMandatoryFields: true
		    			}
		    		});
					
					log.audit('Success! Customer Deposit ID: ', newDeposit);
				}
				catch(e){
					log.debug('Transaction creation failed.', e);
					
		    		var invctranid = search.lookupFields({
		    			type: search.Type.INVOICE,
		    			id: invcId,
		    			columns: ['tranid','email','custbody_nsacs_chargeagain','custbody_nsacs_next_chargedate']
		    		});
		    		
					if(invctranid.custbody_nsacs_chargeagain == false){
						//Failed the first time.
						log.debug('Payment failed for Invoice ' + invctranid.tranid, e.message);
						var invcNextDate = new Date(invctranid.custbody_nsacs_next_chargedate);
						var month = invcNextDate.getMonth() + 1;
						var day = invcNextDate.getDate()+1;
						var year = invcNextDate.getFullYear();
						var fullDateTomorrow = month + '/' + day + '/' + year;
						var tomorrow = format.parse({ value: fullDateTomorrow, type: format.Type.DATE});
						
			    		var removeRecurring = record.submitFields({
			    			type: record.Type.INVOICE,
			    			id: invcId,
			    			values: {
			    				custbody_nsacs_chargeagain: true,
			    				custbody_nsacs_next_chargedate: tomorrow
			    			},
			    			options:{
			    				enableSourcing: true,
			    				ignoreMandatoryFields: true
			    			}
			    		});
					}
					else{
						//The next day that the payment failed again.
			    		var removeRecurring = record.submitFields({
			    			type: record.Type.INVOICE,
			    			id: invcId,
			    			values: {
			    				custbody_nsacs_eligible_recurring: false,
			    				custbody_nsacs_charge_date: ''
			    			},
			    			options:{
			    				enableSourcing: true,
			    				ignoreMandatoryFields: true
			    			}
			    		});
					}
					
		    		var depLookup = search.lookupFields({
		    			type: search.Type.CUSTOMER_DEPOSIT,
		    			id: invcDeposit,
		    			columns: ['email']
		    		});
		    		var contactMail = depLookup.email;
		    		
		    		var arQualys = search.lookupFields({
		    			type: search.Type.EMPLOYEE,
		    			id: ARqualysAdminEmployeeID,
		    			columns: ['email']
		    		});
	    			email.send({
	                    author: -5,
	                    recipients: arQualys.email,
	                    subject: 'Failed Payment for Invoice # ' + invctranid.tranid,
	                    body: 'The following error was encountered for the Invoice # ' + invctranid.tranid + '\n' + e
	                });
	    			var subj = 'Payment failed for Invoice: ' + invctranid.tranid;
	    			var bdy = 'Hello Customer,<br/><br/>The transaction was declined, please use a different credit card or contact us immediately at 650 801-6256 or send an email to AR@qualys.com.<br/><br/>Thank you in advance,<br/>Qualys Collections Team';
	                email.send({
	                    author: -5,
	                    recipients: [invctranid.email, contactMail],
	                    subject: subj,
	                    body: bdy
	                });
				}
				
			}
			return true;
		});
    }
    
    function emailEngine(customerMail, contactMail, invcId, tranId, status){
    	if(status == '30Expiry'){
    		log.debug('30Expiry function call');
    		
			var subj = 'Credit Card Expiry Notice for Invoice # ' + tranId;
			var bdy = 'Your credit card will expire 30-days from now. Please renew your current Credit Card details to retain the Recurring payment.';
			log.debug('Customer Email | Contact Mail', customerMail + ' | ' + contactMail);
			
    		var arQualys = search.lookupFields({
    			type: search.Type.EMPLOYEE,
    			id: ARqualysEmployeeID,
    			columns: ['email']
    		});
            
            if(customerMail == '' && contactMail == ''){
    			email.send({
                    author: -5,
                    recipients: arQualys.email,
                    subject: 'Email on Customer record is blank for Invoice # ' + tranId,
                    body: 'The customer associated with the Invoice does not have an e-mail address. Please notify the customer that the Credit Card associated with the Invoice record is almost expiring less than 30-days from now.'
                });
            }
            else{
                email.send({
                    author: -5,
                    recipients: [customerMail, contactMail, arQualys.email],
                    subject: subj,
                    body: bdy
                });
            }
    	}
    	else if(status == '60Expiry'){
    		log.debug('60Expiry function call');
    		
			var subj = 'Credit Card Expiry Notice for Invoice # ' + tranId;
			var bdy = 'Your credit card will expire 60-days from now. Please renew your current Credit Card details to retain the Recurring payment.';
			log.debug('Customer Email | Contact Mail', customerMail + ' | ' + contactMail);
			
    		var arQualys = search.lookupFields({
    			type: search.Type.EMPLOYEE,
    			id: ARqualysEmployeeID,
    			columns: ['email']
    		});
            
            if(customerMail == '' && contactMail == ''){
    			email.send({
                    author: -5,
                    recipients: arQualys.email,
                    subject: 'Email on Customer record is blank for Invoice # ' + tranId,
                    body: 'The customer associated with the Invoice does not have an e-mail address. Please notify the customer that the Credit Card associated with the Invoice record is almost expiring less than 60-days from now.'
                });
            }
            else{
                email.send({
                    author: -5,
                    recipients: [customerMail, contactMail, arQualys.email],
                    subject: subj,
                    body: bdy
                });
            }
    	}
    }

    return {
        execute: execute
    };
    
});
