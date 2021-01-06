/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/dialog', 'N/format'],
/**
 * @param {record} record
 * @param {search} search
 * @param {dialog} dialog
 */
function(record, search, dialog, format) {
	
	var isNew = true;
	
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	var invcForm = scriptContext.currentRecord;
    	var formMode = scriptContext.mode;
    	if(formMode == 'create' || formMode == 'copy'){
    		invcForm.setValue({ fieldId: 'custbody_nsacs_first_deposit', value: ''});
    		invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: ''});
    		invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: ''});
    		invcForm.setValue({ fieldId: 'custbody_nsacs_cc_expiry', value: ''});
    		invcForm.setValue({ fieldId: 'custbody_nsacs_next_chargedate', value: ''});
    		invcForm.setValue({ fieldId: 'custbody_nsacs_charge_date', value: ''});
    		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: ''});
    		invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: ''});
    		invcForm.setValue({ fieldId: 'custbody_nsacs_chargeagain', value: false});
    	}
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	try{
        	var invcForm = scriptContext.currentRecord;
        	var fieldName = scriptContext.fieldId;
        	
        	var recurringEligible = invcForm.getValue({ fieldId: 'custbody_nsacs_eligible_recurring'});
        	var recurringTerms = invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'});
        	var modifyRecurring = invcForm.getValue({ fieldId: 'custbody_nsacs_modify_recurring'});
        	if(fieldName == 'custbody_nsacs_eligible_recurring' && recurringEligible == true){
        		//Recalculate Recurring Amount.
        		var amountRem = invcForm.getValue({ fieldId: 'amountremaining'});
        		var recurringAmt = invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'});
        		if(recurringAmt == '' || recurringAmt == null){
        			invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: '12'});
        		}
        		recurringAmt = invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'});
        		var calcTotal = 0;
        		calcTotal = calculateTotal(amountRem,recurringAmt);
        		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_amt', value: calcTotal});
        		
        		//Reset the Payment failure checkbox.
        		invcForm.setValue({ fieldId: 'custbody_nsacs_chargeagain', value: false});
        		
        		if(invcForm.getValue({ fieldId: 'custbody_nsacs_first_deposit'}) != '' && invcForm.getValue({ fieldId: 'custbody_nsacs_first_deposit'}) != null){
            		dialog.alert({
            			title: 'Alert!',
            			message: 'Invoice has prior Monthly Deposits available. Please populate the "Change Every" and "Terms" in order to set the Monthly billing. If Customers should manually update these fields, feel free to leave these fields blank.'
            		});
        		}
        	}
        	else if(fieldName == 'custbody_nsacs_eligible_recurring' && recurringEligible == false){
        		var options = {
            			title: 'Alert!',
            			message: 'Previous transactions will no longer be picked-up from the Recurring Schedule. If you wish to modify the details, please check "Modify Recurring Details" instead. Are you sure you want to remove the Invoice from the Recurring Billing?',
            			buttons: [
            				{ label: 'Yes', value: 1},
            				{ label: 'No', value: 2}
            			]
            		};
        		function success(result){ 
        			if(result == 1){
                		invcForm.setValue({ fieldId: 'custbody_nsacs_modify_recurring', value: false});
                		var disablefld2 = invcForm.getField({ fieldId: 'custbody_nsacs_modify_recurring'});
                		disablefld2.isDisabled = false;
                		invcForm.setValue({ fieldId: 'custbody_nsacs_charge_date', value: ''});
                		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: ''});
                		invcForm.setValue({ fieldId: 'custbody_nsacs_next_chargedate', value: ''});
                		//invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: ''});
                		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_amt', value: ''});
                		//invcForm.setValue({ fieldId: 'custbody_nsacs_orig_amt', value: ''});
                		invcForm.setValue({ fieldId: 'custbody_nsacs_cc_expiry', value: ''});
                		invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: ''});
                		invcForm.setValue({ fieldId: 'custbody_nsacs_chargeagain', value: false});
        			}
        			else if(result == 2){
        				invcForm.setValue({ fieldId: 'custbody_nsacs_eligible_recurring', value: true, ignoreFieldChange: true});
        			}
        		}
        		function failure(reason){
        			//Failed.
        		}
        		dialog.create(options).then(success).catch(failure);
        	}
        	
        	if(fieldName == 'custbody_nsacs_modify_recurring' && recurringEligible == true && modifyRecurring == true){
        		//Enable Terms modification
        		var disablefld2 = invcForm.getField({ fieldId: 'custbody_nsacs_charge_date'});
        		disablefld2.isDisabled = false;
        		
        		if(invcForm.getValue({ fieldId: 'custbody_nsacs_charge_date'}) == '' || invcForm.getValue({ fieldId: 'custbody_nsacs_charge_date'}) == null){
            		var options = {
                			title: 'Alert!',
                			message: 'Do you want to modify the initial details?',
                			buttons: [
                				{ label: 'Yes', value: 1},
                				{ label: 'No', value: 2}
                			]
                		};
            		function success(result){ 
            			if(result == 1){
        	        		var disablefld = invcForm.getField({ fieldId: 'custbody_nsacs_charge_date' });
        	        		disablefld.isDisabled = false;
        	        		var disablefld1 = invcForm.getField({ fieldId: 'custbody_nsacs_recurring_terms' });
        	        		disablefld1.isDisabled = false;
        	        		var disablefld2 = invcForm.getField({ fieldId: 'custbody_nsacs_modify_recurring'});
        	        		disablefld2.isDisabled = true;
        	        		isNew = true;
                    		/*dialog.alert({
                    			title: 'Notice',
                    			message: 'If you wish to reset your choice, re-check the "Eligible for Monthly Payments" checkbox.'
                    		});*/
            			}
            			else if(result == 2){
        	        		var disablefld = invcForm.getField({ fieldId: 'custbody_nsacs_charge_date' });
        	        		disablefld.isDisabled = true;
                    		var disablefld1 = invcForm.getField({ fieldId: 'custbody_nsacs_recurring_terms' });
                    		disablefld1.isDisabled = true;
        	        		var disablefld2 = invcForm.getField({ fieldId: 'custbody_nsacs_modify_recurring'});
        	        		disablefld2.isDisabled = false;
        	        		invcForm.setValue({ fieldId: 'custbody_nsacs_modify_recurring', value: false});
                    		isNew = true;
                    		//invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'})});
                    		/*dialog.alert({
                    			title: 'Notice',
                    			message: 'If you wish to reset your choice, re-check the "Eligible for Monthly Payments" checkbox.'
                    		});*/
            			}
            		}
            		function failure(reason){
            			//Failed.
            		}
            		dialog.create(options).then(success).catch(failure);
        		}
        		else{
            		var options = {
                			title: 'Alert!',
                			message: 'Do you want to override the Terms Remaining of the Invoice?',
                			buttons: [
                				{ label: 'Yes', value: 1},
                				{ label: 'No', value: 2}
                			]
                		};
            		function success(result){ 
            			if(result == 1){
        	        		var disablefld1 = invcForm.getField({ fieldId: 'custbody_nsacs_terms_remaining' });
        	        		disablefld1.isDisabled = false;
        	        		isNew = false;
            			}
            			else if(result == 2){
                    		var disablefld1 = invcForm.getField({ fieldId: 'custbody_nsacs_terms_remaining' });
                    		disablefld1.isDisabled = true;
                    		isNew = false;
                    		//invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'})});
            			}
            		}
            		function failure(reason){
            			//Failed.
            		}
            		dialog.create(options).then(success).catch(failure);
        		}
        	}
        	else if(fieldName == 'custbody_nsacs_modify_recurring' && modifyRecurring == true && recurringEligible == false){
        		dialog.alert({
        			title: 'Alert!',
        			message: 'Cannot modify recurring details since transaction is not eligible for Monthly Payments.'
        		});
        		invcForm.setValue({ fieldId: 'custbody_nsacs_modify_recurring', value: false});
        	}
        	else if(fieldName == 'custbody_nsacs_modify_recurring' && modifyRecurring == false){
        		//Disable Terms modification
        		var disablefld1 = invcForm.getField({ fieldId: 'custbody_nsacs_terms_remaining' });
        		disablefld1.isDisabled = true;
        		var disablefld2 = invcForm.getField({ fieldId: 'custbody_nsacs_charge_date'});
        		disablefld2.isDisabled = true;
        		var disablefld3 = invcForm.getField({ fieldId: 'custbody_nsacs_recurring_terms'});
        		disablefld3.isDisabled = true;
        	}
        	
        	if(fieldName == 'amountremaining' && recurringEligible == true && recurringTerms != '' && recurringTerms != null){
        		//Recalculate Recurring Amount
        		var amountRem = invcForm.getValue({ fieldId: 'amountremaining'});
        		var recurringAmt = invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'});
        		var calcTotal = 0;
        		calcTotal = calculateTotal(amountRem,recurringAmt);
        		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_amt', value: calcTotal});
        	}
        	
        	if(fieldName == 'custbody_nsacs_recurring_terms' && recurringEligible == true){
        		
        		if(fieldName == 'custbody_nsacs_recurring_terms'){
        			//Sync the Terms Remaining with the entered Terms in months initially.
        			invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'}), ignoreFieldChange: true});
        		}
        		
        		var amountRem = invcForm.getValue({ fieldId: 'amountremaining'});
        		var recurringAmt = invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'});
        		var chargeEvery = invcForm.getValue({ fieldId: 'custbody_nsacs_charge_date'});
        		var isFieldDisabled = invcForm.getField({ fieldId: 'custbody_nsacs_recurring_terms'});
        		
        		if(chargeEvery == '' || chargeEvery == null){
        			invcForm.setValue({ fieldId: 'custbody_nsacs_next_chargedate', value: ''});
        			invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: ''});
        			
            		var calcTotal = 0;
            		calcTotal = calculateTotal(amountRem,recurringAmt);
            		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_amt', value: calcTotal});
        		}
        		else{
            		var calcTotal = 0;
            		calcTotal = calculateTotal(amountRem,recurringAmt);
            		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_amt', value: calcTotal});
            		
            		var today = new Date();
            		var mm = today.getMonth()+1;
            		var dd = today.getDate();
            		var yyyy = today.getFullYear();
            		var nextCalculatedDate = '';
            		var lastCalculatedDate = '';
            		
            		if(chargeEvery == '1')
            			dd = '1';
            		else if(chargeEvery == '2')
            			dd = '15';
            		
            		if(dd < today.getDate()){
            			mm++;
            		}
            		
            		if(dd == '1')
            			dd = '01';
            		
            		if(mm > 12){
            			mm = mm - 12;
            			yyyy++;
            		}
            		if(mm < 10)
            			nextCalculatedDate = '0' + mm + '/' + dd + '/' + yyyy;
            		else
            			nextCalculatedDate = mm + '/' + dd + '/' + yyyy;
            		
            		var x = format.parse({ value: nextCalculatedDate, type: format.Type.DATE});
            		
            		if(recurringAmt == '' || recurringAmt == null)
            			recurringAmt = 12;
            		
            		mm+=(recurringAmt-1);
            		if(mm > 12){
            			mm = mm - 12;
            			yyyy++;
            		}
            		if(mm < 10)
            			lastCalculatedDate = '0' + mm + '/' + dd + '/' + yyyy;
            		else
            			lastCalculatedDate = mm + '/' + dd + '/' + yyyy;
            		
            		var y = format.parse({ value: lastCalculatedDate, type: format.Type.DATE});
            		
            		invcForm.setValue({ fieldId: 'custbody_nsacs_next_chargedate', value: x});
            		invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: y});
        		}
        	}
        	
        	if(fieldName == 'custbody_nsacs_terms_remaining' && recurringEligible == true){
        		//Adjust the dates and recurring amount to pay accordingly.
        		var chargeEvery = invcForm.getValue({ fieldId: 'custbody_nsacs_charge_date'});
        		if(chargeEvery == '' || chargeEvery == null){
        			invcForm.setValue({ fieldId: 'custbody_nsacs_next_chargedate', value: ''});
        			invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: ''});
        			
            		var calcTotal = 0;
            		calcTotal = calculateTotal(amountRem,recurringAmt);
            		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_amt', value: calcTotal});
        		}
        		else{
            		var amountRem = invcForm.getValue({ fieldId: 'amountremaining'});
            		var recurringAmt = invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'});
            		var chargeEvery = invcForm.getValue({ fieldId: 'custbody_nsacs_charge_date'});
            		var calcTotal = 0;
            		calcTotal = calculateTotal(amountRem,recurringAmt);
            		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_amt', value: calcTotal});
        			
        			if(invcForm.getValue({ fieldId: 'custbody_nsacs_next_chargedate'}) != '' && invcForm.getValue({ fieldId: 'custbody_nsacs_last_chargedate'}) != ''){
        				var nextChargeDate = invcForm.getValue({ fieldId: 'custbody_nsacs_next_chargedate'});
        				var lastChargeDate = invcForm.getValue({ fieldId: 'custbody_nsacs_last_chargedate'});
    					var originalInvoice = search.lookupFields({
    						type: search.Type.INVOICE,
    						id: invcForm.getValue({ fieldId: 'id'}),
    						columns: ['custbody_nsacs_next_chargedate']
    					});
    					//custbody_nsacs_last_chargedate previously.
        				
        				var nextMonth = nextChargeDate.getMonth()+1;
        				var lastMonth = lastChargeDate.getMonth()+1;
        				var lastDay = lastChargeDate.getDate();
        				var originalDate = new Date(originalInvoice.custbody_nsacs_next_chargedate);
        				var lastYear = originalDate.getFullYear();
        				
        				lastMonth = (nextMonth + invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'})) - 1;
        				while(lastMonth > 12){
        					lastMonth -= 12;
        					lastYear++;
        				}
        				
        				var calculatedDate = '';
        				if(lastMonth < 10)
        					calculatedDate = '0' + lastMonth + '/' + lastDay + '/' + lastYear;
        				else
        					calculatedDate = lastMonth + '/' + lastDay + '/' + lastYear;
        				
        				var parsedDate = format.parse({ value: calculatedDate, type: format.Type.DATE});
        				invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: parsedDate});
        			}
        		}
        		
        		if(invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}) > invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'})){
        			//If the Original Terms is greater than the Terms remaining entered, the Original Terms match the Terms remaining
        			invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}), ignoreFieldChange: true});
            		dialog.alert({
            			title: 'Alert!',
            			message: 'Terms Remaining is greater than the Originally assigned terms. Terms (in months) adjusted to reflect the Terms Remaining.'
            		});
        		}
        	}
        	if(fieldName == 'custbody_nsacs_charge_date' && recurringEligible == true){
        		if(invcForm.getValue({ fieldId: 'custbody_nsacs_charge_date'}) == '' || invcForm.getValue({ fieldId: 'custbody_nsacs_charge_date'}) == null){
        			invcForm.setValue({ fieldId: 'custbody_nsacs_next_chargedate', value: ''});
        			invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: ''});
        			
            		var calcTotal = 0;
            		calcTotal = calculateTotal(amountRem,recurringAmt);
            		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_amt', value: calcTotal});
        		}
        		else{
            		var chargeEvery = invcForm.getValue({ fieldId: 'custbody_nsacs_charge_date'});
            		var today = new Date();
            		var mm = today.getMonth()+1;
            		var dd = today.getDate();
            		var yyyy = today.getFullYear();
                	//var isNew = true;
    				
    				if(invcForm.getValue({ fieldId: 'id'}) != ''){
    					
                		var isDisabled = invcForm.getField({ fieldId: 'custbody_nsacs_recurring_terms' });
                		var isDisabled2 = invcForm.getField({ fieldId: 'custbody_nsacs_terms_remaining'});
                		if(isDisabled.isDisabled == true && isNew == false){
                			log.debug('isdisabled is true');
                			//next recurring date should not move apart from instances where it should.
        					var originalInvoice = search.lookupFields({
        						type: search.Type.INVOICE,
        						id: invcForm.getValue({ fieldId: 'id'}),
        						columns: ['custbody_nsacs_next_chargedate','custbody_nsacs_last_chargedate']
        					});
        					var originalNext = new Date(originalInvoice.custbody_nsacs_next_chargedate);
        					var originalLast = new Date(originalInvoice.custbody_nsacs_last_chargedate);
        					
        					var nextMonth = originalNext.getMonth()+1;
        					var nextDate = originalNext.getDate();
        					var nextYear = originalNext.getFullYear();
        					var lastMonth = originalNext.getMonth()+invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'});
        					var lastDate = originalNext.getDate();
        					var lastYear = originalNext.getFullYear();
        					
        					if(chargeEvery == '1'){
        						nextDate = 1;
        						lastDate = 1;
        					}
        					else if(chargeEvery == '2'){
        						nextDate = 15;
        						lastDate = 15;
        					}
        					
        					if(nextMonth < mm){
        						log.debug('lagging dates');
        						//Lagging dates that weren't charged for some reason. Nearly impossible to happen, but just in case, the system can catch it.
        						nextMonth = mm;
        						lastMonth = invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}) + mm;
        						if(nextDate <= dd){
        							nextMonth++;
        							//lastMonth++;
        							lastMonth = nextMonth + invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}) - 1;
        						}
        					}
        					else if(nextDate <= dd){
        						log.debug('regular dates');
        						if(nextMonth <= mm){
        							//Dates that have day discrepancy should be moved to next month. For instance,
        							//Next charge date of 1/15/2019 with current date as 1/20/2019 should be charged next month to 2/15/2019 since 1/20 already passed 1/15.
        							nextMonth++;
        							lastMonth = nextMonth + invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}) - 1;
        							//lastMonth++;
        						}
        					}
        					
        					while(nextMonth > 12){
        						nextMonth -= 12;
        						nextYear++;
        					}
        					while(lastMonth > 12){
        						lastMonth -= 12;
        						lastYear++;
        					}
        					
        					var calcuatedNext = '';
        					var calculatedLast = '';
        					if(nextMonth < 10)
        						calculatedNext = '0' + nextMonth + '/' + nextDate + '/' + nextYear;
        					else
        						calculatedNext = nextMonth + '/' + nextDate + '/' + nextYear;
        					
        					if(lastMonth < 10)
        						calculatedLast = '0' + lastMonth + '/' + lastDate + '/' + lastYear;
        					else
        						calculatedLast = lastMonth + '/' + lastDate + '/' + lastYear;
        					
        					var parsedNext = format.parse({ value: calculatedNext, type: format.Type.DATE});
        					var parsedLast = format.parse({ value: calculatedLast, type: format.Type.DATE});
        					invcForm.setValue({ fieldId: 'custbody_nsacs_next_chargedate', value: parsedNext});
        					invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: parsedLast});
                		}
                		else{
                			log.debug('isdisabled is false');
                			var recurringAmt = invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'});
                    		var nextCalculatedDate = '';
                    		var lastCalculatedDate = '';
                    		
                    		if(chargeEvery == '1')
                    			dd = '1';
                    		else if(chargeEvery == '2')
                    			dd = '15';
                    		
                    		if(dd < today.getDate()){
                    			mm++;
                    		}
                    		
                    		if(dd == '1')
                    			dd = '01';
                    		
                    		if(mm > 12){
                    			mm = mm - 12;
                    			yyyy++;
                    		}
                    		if(mm < 10)
                    			nextCalculatedDate = '0' + mm + '/' + dd + '/' + yyyy;
                    		else
                    			nextCalculatedDate = mm + '/' + dd + '/' + yyyy;
                    		
                    		var x = format.parse({ value: nextCalculatedDate, type: format.Type.DATE});
                    		
                    		if(recurringAmt == '' || recurringAmt == null)
                    			recurringAmt = 12;
                    		
                    		mm+=(recurringAmt-1);
                    		if(mm > 12){
                    			mm = mm - 12;
                    			yyyy++;
                    		}
                    		if(mm < 10)
                    			lastCalculatedDate = '0' + mm + '/' + dd + '/' + yyyy;
                    		else
                    			lastCalculatedDate = mm + '/' + dd + '/' + yyyy;
                    		
                    		var y = format.parse({ value: lastCalculatedDate, type: format.Type.DATE});
                    		
                    		invcForm.setValue({ fieldId: 'custbody_nsacs_next_chargedate', value: x});
                    		invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: y});
                		}
    					
    				}
    				else{
                		var recurringAmt = invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'});
                		var nextCalculatedDate = '';
                		var lastCalculatedDate = '';
                		
                		if(chargeEvery == '1')
                			dd = '1';
                		else if(chargeEvery == '2')
                			dd = '15';
                		
                		if(dd < today.getDate()){
                			mm++;
                		}
                		
                		if(dd == '1')
                			dd = '01';
                		
                		if(mm > 12){
                			mm = mm - 12;
                			yyyy++;
                		}
                		if(mm < 10)
                			nextCalculatedDate = '0' + mm + '/' + dd + '/' + yyyy;
                		else
                			nextCalculatedDate = mm + '/' + dd + '/' + yyyy;
                		
                		var x = format.parse({ value: nextCalculatedDate, type: format.Type.DATE});
                		
                		if(recurringAmt == '' || recurringAmt == null)
                			recurringAmt = 12;
                		
                		mm+=(recurringAmt-1);
                		if(mm > 12){
                			mm = mm - 12;
                			yyyy++;
                		}
                		if(mm < 10)
                			lastCalculatedDate = '0' + mm + '/' + dd + '/' + yyyy;
                		else
                			lastCalculatedDate = mm + '/' + dd + '/' + yyyy;
                		
                		var y = format.parse({ value: lastCalculatedDate, type: format.Type.DATE});
                		
                		invcForm.setValue({ fieldId: 'custbody_nsacs_next_chargedate', value: x});
                		invcForm.setValue({ fieldId: 'custbody_nsacs_last_chargedate', value: y});
    				}
        		}
        	}
        	
        	if(fieldName == 'custbody_nsacs_next_chargedate' && recurringEligible == true){
        		//TO DO.
        	}
    	}
    	catch(e){
    		log.debug('Log Message', e);
    	}
    }
    
    function calculateTotal(amount, recurring){
    	if(recurring == '' || recurring == null)
        	return round((amount/12), 2);
    	else
        	return round((amount/recurring), 2);
    }
    
    function round(value, decimals) {
    	return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {
    	var invcForm = scriptContext.currentRecord;
    	var fieldName = scriptContext.fieldId;
    	var recurringEligible = invcForm.getValue({ fieldId: 'custbody_nsacs_eligible_recurring'});
    	
    	if(fieldName == 'custbody_nsacs_recurring_terms' && recurringEligible == true){
    		if(invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'}) == '0'){
        		dialog.alert({
        			title: 'Alert!',
        			message: 'Zero and Negative terms are not eligible for Recurring Billing.'
        		});
        		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: '12'});
    		}
    		else if(invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'}) == '' || invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'}) == null){
    			invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: '12'});
    		}
    		else if(invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'}) < 1){
        		dialog.alert({
        			title: 'Alert!',
        			message: 'Zero and Negative terms are not eligible for Recurring Billing.'
        		});
        		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: '12'});
    		}
    		else if(invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'}) > 12){
        		dialog.alert({
        			title: 'Alert!',
        			message: 'Terms exceeding 1-year (12 months) are not allowed. Please set Terms from 1-month to 12-months only.'
        		});
        		invcForm.setValue({ fieldId: 'custbody_nsacs_recurring_terms', value: '12'});
    		}
    	}
    	else if(fieldName == 'custbody_nsacs_terms_remaining' && recurringEligible == true){
    		if(invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}) == '0'){
        		dialog.alert({
        			title: 'Alert!',
        			message: 'Zero and Negative terms are not eligible for Recurring Billing.'
        		});
        		if(invcForm.getValue({ fieldId: 'id'}) != '' && invcForm.getValue({ fieldId: 'id'}) != null){
    				var originalInvoice = search.lookupFields({
    					type: search.Type.INVOICE,
    					id: invcForm.getValue({ fieldId: 'id'}),
    					columns: ['custbody_nsacs_terms_remaining']
    				});
    				invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: originalInvoice.custbody_nsacs_terms_remaining});
        		}
        		else{
            		invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: '12'});
        		}
    		}
    		else if(invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}) == '' || invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}) == null){
    			invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: '12'});
    		}
    		else if(invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}) < 1){
        		dialog.alert({
        			title: 'Alert!',
        			message: 'Zero and Negative terms are not eligible for Recurring Billing.'
        		});
        		if(invcForm.getValue({ fieldId: 'id'}) != '' && invcForm.getValue({ fieldId: 'id'}) != null){
    				var originalInvoice = search.lookupFields({
    					type: search.Type.INVOICE,
    					id: invcForm.getValue({ fieldId: 'id'}),
    					columns: ['custbody_nsacs_terms_remaining']
    				});
    				invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: originalInvoice.custbody_nsacs_terms_remaining});
        		}
        		else{
            		invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: '12'});
        		}
    		}
    		else if(invcForm.getValue({ fieldId: 'custbody_nsacs_terms_remaining'}) > 12){
        		dialog.alert({
        			title: 'Alert!',
        			message: 'Terms exceeding 1-year (12 months) are not allowed. Please set Terms from 1-month to 12-months only.'
        		});
        		if(invcForm.getValue({ fieldId: 'id'}) != '' && invcForm.getValue({ fieldId: 'id'}) != null){
    				var originalInvoice = search.lookupFields({
    					type: search.Type.INVOICE,
    					id: invcForm.getValue({ fieldId: 'id'}),
    					columns: ['custbody_nsacs_terms_remaining']
    				});
    				invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: originalInvoice.custbody_nsacs_terms_remaining});
        		}
        		else{
            		invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: '12'});
        		}
    		}
    	}
    	
    	return true;
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
    	var invcForm = scriptContext.currentRecord;
    	var modifyRecurring = invcForm.getValue({ fieldId: 'custbody_nsacs_modify_recurring'});
    	var nextRecurring = invcForm.getValue({ fieldId: 'custbody_nsacs_next_chargedate'});
    	var lastRecurring = invcForm.getValue({ fieldId: 'custbody_nsacs_last_chargedate'});
    	
    	if(modifyRecurring == true){
    		var disablefld1 = invcForm.getField({ fieldId: 'custbody_nsacs_recurring_terms' });
    		disablefld1.isDisabled = true;
    		invcForm.setValue({ fieldId: 'custbody_nsacs_modify_recurring', value: false});
    		
    		/*
    		if(nextRecurring != '' && lastRecurring != ''){
    			var next = nextRecurring.getMonth() + 1;
    			var last = lastRecurring.getMonth() + 1;
    			var terms = invcForm.getValue({ fieldId: 'custbody_nsacs_recurring_terms'});
    			for(var x = 0; x < terms; x++){
    				if(next == last){
    					invcForm.setValue({ fieldId: 'custbody_nsacs_terms_remaining', value: (x+1)});
    				}
    				else{
        				next++;
        				if(next > 12){
        					next = 1;
        				}
    				}
    			}
    		}*/
    	}
    	return true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        validateField: validateField,
        saveRecord: saveRecord
    };
    
});
