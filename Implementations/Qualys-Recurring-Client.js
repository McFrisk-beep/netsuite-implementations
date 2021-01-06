/**
 * Copyright (c) 1998-2017 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 * 
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 **/
/**
 * 
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07/29/2017     mjpascual	   	   initial: 2754148
 * 2.00		  11/30/2018	 rbaligod		   Incorporated with updated features for the Suitelet being used.
 */
/**
 * al_CS_WIPItemRecordListSSV2.js
 * @NApiVersion 2.0
 * @NScriptType clientscript
 */

var uooValuesList = new Array();
var prodScaleValsList = new Array();
	
define(['N/ui','N/ui/dialog','N/url','N/format','N/currentRecord', 'N/runtime', 'N/search', 'N/record'],

function(ui,dialog,url,format,currentRecord,runtime,search, record) {
	
	//================= GLOBAL VARIABLES
	var suiteletURL = '/app/site/hosting/scriptlet.nl?script=1500&deploy=1&compid=626022_SB1';
	//Change script to the Suitelet internal ID
	//Change compid to the Account number
	//==================================
	
	function pageInit(scriptContext) {
    	var objCurrentRecord = scriptContext.currentRecord;
    	resetField(objCurrentRecord);
    	//hideRecurring(objCurrentRecord)
		var disablefld = objCurrentRecord.getField({
			fieldId: 'custpage_invamt'
		});
		disablefld.isDisabled = true;
		
		var disablefld2 = objCurrentRecord.getField({
			fieldId: 'custpage_invtopay'
		});
		disablefld2.isDisabled = true;
		
		var disablefld3 = objCurrentRecord.getField({
			fieldId: 'custpage_isrecurring'
		});
		disablefld3.isDisabled = true;
		
		var disablefld4 = objCurrentRecord.getField({
			fieldId: 'custpage_payevery'
		});
		disablefld4.isDisabled = true;
		
		var disablefld5 = objCurrentRecord.getField({
			fieldId: 'custpage_next_recurring'
		});
		disablefld5.isDisabled = true;
		
		var disablefld6 = objCurrentRecord.getField({
			fieldId: 'custpage_last_recurring'
		});
		disablefld6.isDisabled = true;
		
		var disablefld7 = objCurrentRecord.getField({
			fieldId: 'custpage_terms'
		});
		disablefld7.isDisabled = true;
		
		var disablefld8 = objCurrentRecord.getField({
			fieldId: 'custpage_currencies'
		});
		disablefld8.isDisabled = true;
		//custbody_nsacs_eligible_recurring
		
		objCurrentRecord.setValue({ fieldId: 'custpage_invoice', value: objCurrentRecord.getValue({ fieldId: 'custpage_invoice'})});
    }
	
    /**
     * Function to be executed when field is changed.
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) 
    {
    	
    	//check for dropdown changes.
    	//context.request.parameters.eid == 'partner'
    	var oCurrentRecord = scriptContext.currentRecord;
    	var fieldId = scriptContext.fieldId;
    	var isRecurring = oCurrentRecord.getValue({ fieldId: 'custpage_isrecurring'});
    	
    	
    	if(fieldId == 'custpage_invoice'){
    		if(oCurrentRecord.getValue({ fieldId: 'custpage_invoice'}) == '-'){
    			//hideRecurring(oCurrentRecord);
    			var disablefld2 = oCurrentRecord.getField({ fieldId: 'custpage_invoice' });
    			disablefld2.isDisabled = false;
    			var disablefld3 = oCurrentRecord.getField({ fieldId: 'custpage_payment_amt' });
    			disablefld3.isDisabled = false;
    			var disablefld4 = oCurrentRecord.getField({ fieldId: 'custpage_payevery' });
    			disablefld4.isDisabled = true;
    			var disablefld5 = oCurrentRecord.getField({ fieldId: 'custpage_currencies'});
    			disablefld5.isDisabled = false;
    			
    			oCurrentRecord.setValue({ fieldId: 'custpage_isrecurring', value: false});
    			oCurrentRecord.setValue({ fieldId: 'custpage_payment_amt', value: 0});
    			oCurrentRecord.setValue({ fieldId: 'custpage_terms', value: ''});
    			oCurrentRecord.setValue({ fieldId: 'custpage_payevery', value: 'none'});
        		oCurrentRecord.setValue({ fieldId: 'custpage_next_recurring', value: ''});
        		oCurrentRecord.setValue({ fieldId: 'custpage_last_recurring', value: ''});
        		oCurrentRecord.setValue({ fieldId: 'custpage_isrecurring', value: false});
        		oCurrentRecord.setValue({ fieldId: 'custpage_invamt', value: 0});
        		oCurrentRecord.setValue({ fieldId: 'custpage_invtopay', value: 0});
    			
    			var urlString = window.location.href;
    			if(urlString.search('recur=false') == -1 && urlString.search('recur') != -1){
        			window.onbeforeunload = null;
        			window.open(suiteletURL+'&recur=false&invcid='+oCurrentRecord.getValue(fieldId),'_self');
    			}
    		}
    		else if(oCurrentRecord.getValue({ fieldId: 'custpage_invoice'}) != '-'){
    			/*var invcSearch = search.lookupFields({
    				type: search.Type.INVOICE,
    				id: oCurrentRecord.getValue({ fieldId: 'custpage_invoice'}),
    				columns: ['currency']
        		});*/
    			var invcSearch = record.load({                
					type: record.Type.INVOICE,                
					id: oCurrentRecord.getValue({ fieldId: 'custpage_invoice'})
				});
        		oCurrentRecord.setValue({ fieldId: 'custpage_currencies', value: invcSearch.getValue({ fieldId: 'currency'})});
    			//oCurrentRecord.defaultValue = invcSearch.currency;
    			
    			oCurrentRecord.setValue({ fieldId: 'custpage_payment_amt', value: 0});
    			oCurrentRecord.setValue({ fieldId: 'custpage_terms', value: ''});
    			oCurrentRecord.setValue({ fieldId: 'custpage_payevery', value: 'none'});
        		oCurrentRecord.setValue({ fieldId: 'custpage_next_recurring', value: ''});
        		oCurrentRecord.setValue({ fieldId: 'custpage_last_recurring', value: ''});
        		oCurrentRecord.setValue({ fieldId: 'custpage_isrecurring', value: false});
        		oCurrentRecord.setValue({ fieldId: 'custpage_invamt', value: 0});
        		oCurrentRecord.setValue({ fieldId: 'custpage_invtopay', value: 0});
    			var disablefld5 = oCurrentRecord.getField({ fieldId: 'custpage_currencies'});
    			disablefld5.isDisabled = true;
    		}
    	}
    	
    	if(fieldId == 'custpage_payment_amt'){
    		var val = oCurrentRecord.getValue({ fieldId: 'custpage_payment_amt'});
    		
    		if(val < 0){
        		dialog.alert({
        			title: 'Alert!',
        			message: 'Cannot enter a value less than zero (0.00).'
        		});
        		oCurrentRecord.setValue({ fieldId: 'custpage_payment_amt', value: 0});
    		}
    	}
    	
    	if(fieldId=='custpage_invoice' && oCurrentRecord.getValue(fieldId) != '-'){
    		var x = search.lookupFields({
				type: search.Type.INVOICE,
				id: oCurrentRecord.getValue(fieldId),
				columns: ['total','amountremaining','custbody_nsacs_eligible_recurring','custbody_nsacs_recurring_terms','exchangerate', 'currency']
			});
    		var termCount = 0;
    		var exchangeRate = x.exchangerate;
			/*var x = search.lookupFields({
				type: search.Type.INVOICE,
				id: oCurrentRecord.getValue({ fieldId: 'custpage_invoice'}),
				columns: 'currency'
			});
			oCurrentRecord.setValue({ fieldId: 'custpage_currencies', value: x.currency});*/
    		
    		var preInvAmt = (x.total / exchangeRate);
    		var convInvAmt = Number(Math.round(preInvAmt+'e'+2)+'e-'+2);
    		oCurrentRecord.setValue({
    			fieldId: 'custpage_invamt',
    			value: convInvAmt,
    			ignoreFieldChange: true
    		});
    		
    		var preInvPay = (x.amountremaining / exchangeRate);
    		var convInvPay = Number(Math.round(preInvPay+'e'+2)+'e-'+2);
    		oCurrentRecord.setValue({
    			fieldId: 'custpage_invtopay',
    			value: convInvPay,
    			ignoreFieldChange: true
    		});
    		
    		if(x.custbody_nsacs_recurring_terms == '' || x.custbody_nsacs_recurring_terms == null)
    			termCount = 12;
    		else
        		termCount = x.custbody_nsacs_recurring_terms;
    		
    		oCurrentRecord.setValue({
    			fieldId: 'custpage_terms',
    			value: termCount
    		});
    		
    		
    		var eligibleForRecurring = x.custbody_nsacs_eligible_recurring;
    		if(eligibleForRecurring == true){
    			//showRecurring(oCurrentRecord);
    			oCurrentRecord.setValue({ fieldId: 'custpage_isrecurring', value: true});
    			var disablefld = oCurrentRecord.getField({
    				fieldId: 'custpage_payevery'
    			});
    			disablefld.isDisabled = false;
    			var disablefld2 = oCurrentRecord.getField({
    				fieldId: 'custpage_payment_amt'
    			});
    			disablefld2.isDisabled = true;
    		}
    		else{
    			//hideRecurring(oCurrentRecord);
    			oCurrentRecord.setValue({ fieldId: 'custpage_isrecurring', value: false});
    			var disablefld = oCurrentRecord.getField({
    				fieldId: 'custpage_payevery'
    			});
    			disablefld.isDisabled = true;
    			var disablefld2 = oCurrentRecord.getField({
    				fieldId: 'custpage_payment_amt'
    			});
    			disablefld2.isDisabled = false;
    		}
    		
    		if(eligibleForRecurring == true){
    			var calculatedAmount = (oCurrentRecord.getValue({ fieldId: 'custpage_invtopay'}) / oCurrentRecord.getValue({ fieldId: 'custpage_terms'}));
    			var convCalculatedAmount = Number(Math.round(calculatedAmount+'e'+2)+'e-'+2);
    			oCurrentRecord.setValue({ fieldId: 'custpage_payment_amt', value: convCalculatedAmount, ignoreFieldChange: true});
    			
    			var urlString = window.location.href;
    			if(urlString.search('recur=true') == -1){
        			window.onbeforeunload = null;
        			window.open(suiteletURL+'&recur=true&invcid='+oCurrentRecord.getValue(fieldId),'_self');
    			}
    		}
    		else{
    			oCurrentRecord.setValue({ fieldId: 'custpage_payment_amt', value: 0});
    			oCurrentRecord.setValue({ fieldId: 'custpage_terms', value: ''});
    			oCurrentRecord.setValue({ fieldId: 'custpage_payevery', value: 'none'});
        		oCurrentRecord.setValue({ fieldId: 'custpage_next_recurring', value: ''});
        		oCurrentRecord.setValue({ fieldId: 'custpage_last_recurring', value: ''});
    			var urlString = window.location.href;
    			if(urlString.search('recur=false') == -1 && urlString.search('recur') != -1){
        			window.onbeforeunload = null;
        			window.open(suiteletURL+'&recur=false&invcid='+oCurrentRecord.getValue(fieldId),'_self');
    			}
    			//window.onbeforeunload = null;
    			//window.open(suiteletURL+'&recur=false&invcid='+oCurrentRecord.getValue(fieldId),'_self');
    		}
    	}
    	
    	if(fieldId == 'custpage_payevery' && isRecurring == true && oCurrentRecord.getValue({ fieldId: 'custpage_payevery'}) != 'none'){
    		var payEvery = oCurrentRecord.getValue({ fieldId: 'custpage_payevery'});
    		
    		var today = new Date();
    		var mm = today.getMonth()+1;
    		var dd = today.getDate();
    		var yyyy = today.getFullYear();
    		var nextCalculatedDate = '';
    		var lastCalculatedDate = '';
    		
    		if(payEvery == '1st')
    			dd = '1';
    		else if(payEvery == '15th')
    			dd = '15';
    		
    		//if(dd < today.getDate()){
    			mm++;
    		//}
    		
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
    		
    		var y = format.parse({ value: nextCalculatedDate, type: format.Type.DATE});
    		
    		mm+=(oCurrentRecord.getValue({ fieldId: 'custpage_terms'}) - 2);
    		if(mm > 12){
    			mm = mm - 12;
    			yyyy++;
    		}
    		if(mm < 10)
    			lastCalculatedDate = '0' + mm + '/' + dd + '/' + yyyy;
    		else
    			lastCalculatedDate = mm + '/' + dd + '/' + yyyy;
    		
    		var z = format.parse({ value: lastCalculatedDate, type: format.Type.DATE});
    		
    		oCurrentRecord.setValue({ fieldId: 'custpage_next_recurring', value: y});
    		oCurrentRecord.setValue({ fieldId: 'custpage_last_recurring', value: z});
    	}
    	else if(fieldId == 'custpage_payevery' && isRecurring == true && oCurrentRecord.getValue({ fieldId: 'custpage_payevery'}) == 'none'){
    		oCurrentRecord.setValue({ fieldId: 'custpage_next_recurring', value: ''});
    		oCurrentRecord.setValue({ fieldId: 'custpage_last_recurring', value: ''});
    	}
      
    	if(fieldId=='custpage_creditcardselect')
    	{
    		
        	var stSelectId = oCurrentRecord.getValue(fieldId);
        	if(stSelectId == '-') resetField(oCurrentRecord);
        
        	var stObjCCs = oCurrentRecord.getValue('custpage_cclisthidden');
        	var objCCs = JSON.parse(stObjCCs);
       
        	if(objCCs[stSelectId])
        	{
        		var objCC = objCCs[stSelectId];
        		var arrDate = objCC.expDate.split('-');
        		
        		oCurrentRecord.setValue('custpage_ccno', objCC.ccNumber);
        		if(arrDate.length > 0){
        			oCurrentRecord.setValue('custpage_expires', arrDate[1]+'/'+arrDate[0]);
        		}
        		oCurrentRecord.setValue('custpage_nameoncard', objCC.ccHolderName);
        		
        		oCurrentRecord.setValue({fieldId : 'custpage_payment_mtd', value : objCC.ccType, ignoreFieldChange : true});
        		
        	}
       
    	}
    	if(fieldId=='custpage_payment_mtd')
    	{
    		resetField(oCurrentRecord);
    	}
    	if(fieldId=='custpage_expires'){
    		var dtVal = oCurrentRecord.getValue({ fieldId: 'custpage_expires'});
    		var monthStr = '';
    		var yearStr = '';
    		var monthVal = 0;
    		var yearVal = 0;
    		var isYear = false;
    		for(var i = 0; i < dtVal.length; i++){
    			if(isYear == false){
    				if(dtVal[i] == '/'){
    					isYear = true;
    					monthVal = monthStr;
    				}
    				else{
    					if(dtVal[i] == '0' && dtVal[i+1] != '/'){
    						//do nothing. Ignore first 'zero' value should the customer place the cc date as 01/2020 for instance.
    					}
    					else{
    						monthStr += dtVal[i];
    					}
    				}
    				
    				//If month exceeds 2-digits.
    				if(i > 2){
    					dialog.alert({
    						title: 'Alert!',
    						message: 'Credit Card month exceeds 2-digits. Please enter a valid Date.'
    					});
    					oCurrentRecord.setValue({ fieldId: 'custpage_expires', value: ''});
    					return false;
    				}
    			}
    			else if(isYear == true){
    				yearStr += dtVal[i];
    			}
    		}
    		if(dtVal.length != 0){
        		yearVal = yearStr;
        		var currentYear = new Date();
        		if(yearVal < currentYear.getFullYear()){
            		dialog.alert({
            			title: 'Alert!',
            			message: 'Invalid Credit Card Year. Year must be this year, or greater than this Year.'
            		});
            		oCurrentRecord.setValue({ fieldId: 'custpage_expires', value: ''});
            		return false;
        		}
    		}
    	}
    	
    	return true;
    }
    
    function resetField(oCurrentRecord)
    {
    	oCurrentRecord.setValue('custpage_expires','');
		oCurrentRecord.setValue('custpage_nameoncard','');
		oCurrentRecord.setValue({fieldId : 'custpage_creditcardselect', value :'-', ignoreFieldChange : true});
		oCurrentRecord.setValue('custpage_ccno','');
		oCurrentRecord.setValue('custpage_cc_cvv','');
    }
    
    function inArray(val, arr)
	{   
		var bIsValueFound = false;  
		
		for(var i = 0; i < arr.length; i++)
		{
			if(val == arr[i])
			{
				bIsValueFound = true;        
				break;    
			}
		}
		
		return bIsValueFound;
	}
   
    function saveRecord(scriptContext)
    {
    	var oCurrentRecord = scriptContext.currentRecord;
    	
    	var isRecurring = oCurrentRecord.getValue({ fieldId: 'custpage_isrecurring'});
    	var payEvery = oCurrentRecord.getValue({ fieldId: 'custpage_payevery'});
    	var val = oCurrentRecord.getValue({ fieldId: 'custpage_payment_amt'});
    
    	//get required values list.
    	//check for required values.
    	if(isRecurring == true && payEvery == 'none'){
    		dialog.alert({
    			title: 'Alert!',
    			message: 'Credit Card Charge Date should be populated.'
    		});
    		return false;
    	}
    	else if(val == 0){
    		dialog.alert({
    			title: 'Alert!',
    			message: 'Please enter a value for "Payment Amount"'
    		});
    		return false;
    	}
    	else{
    		return true;
    	}
    }
    
    
    return {
    	pageInit : pageInit,
        fieldChanged: fieldChanged,
        saveRecord : saveRecord
    };
    

});




