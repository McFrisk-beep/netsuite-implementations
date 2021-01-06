/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * 1.00			07/29/2017			mjpascual				initial: 2754148
 * 1.10			20 Jul 2018			Chinmay Shepal			NS-1049 Customer Portal - Make deposit is creating deposit record when Payment Method or payment information is empty
 * 2.00			23 Oct 2018			NS PS Raphael			NS-1062 On Credit Card portal, when customer makes payment using Credit Card, CVV to be authenticated
 * 2.01			16 Nov 2018			NS PS Raphael			Removed the Sales Order being a requirememnt for the creation of Customer Deposit
 * 3.00			22 Nov 2018			NS PS Raphael			Added the Recurring billing functionality for the Suitelet
 *
 */
define(['N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/error', 'N/redirect', 'N/format', 'N/record', 'N/ui/dialog', 'N/email'],
/**
 * @param {runtime} runtime
 */
function(runtime, search, serverWidget, url, error, redirect, format, record, dialog, email) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
	
	var LOCAL_VARS = null;
    function onRequest(context) 
    {
    
    	try {
    		
	    	LOCAL_VARS = new LocalVariables();
	    	log.debug('method >> ', context.request.method);
	    	if (context.request.method === 'GET') 
			{
				processGETMethod(context);
			}
			else
			{
				processPOSTMethod(context);
			}
    	}
		catch (e)
		{
			if (e.message != undefined)
			{
				log.error('ERROR' , e.name + ' ' + e.message);
				throw e.name + ' ' + e.message;
			}
			else
			{
				log.error('ERROR', 'Unexpected Error' , e.toString()); 
				throw error.create({
					name: '99999',
					message: e.toString()
				});
			}
		}
    }
    
    function processGETMethod(context)
    {
        createSuitelet(context);
    }
    
    function processPOSTMethod(context)
    {
    	createDeposit(context, LOCAL_VARS.FIELDS); 
    }
    
    function createSuitelet(context)
    {
    	var arrPaymentMethodList = [];
    	var stPaymentMethodList = runtime.getCurrentScript().getParameter('custscript_paymentMethod');
    	if(stPaymentMethodList)
    	{
    		arrPaymentMethodList = stPaymentMethodList.split(',');
    	}
    	
    	var form = serverWidget.createForm({
             title: LOCAL_VARS.WIPTMPLRECORD.TITLE
        });

    	form.clientScriptFileId = '15416252';//set client script. - old-14266957
         
    	for( fieldgroup in LOCAL_VARS.FIELDGROUP)
        {
    		var x = form.addFieldGroup({
	        	id : LOCAL_VARS.FIELDGROUP[fieldgroup].id,
	            label : LOCAL_VARS.FIELDGROUP[fieldgroup].label
	        });
    		//custpage_recurringinfo
    		if(LOCAL_VARS.FIELDGROUP[fieldgroup].id == 'custpage_recurringinfo'){
    			//x.isCollapsed = true;
    			//x.isBorderHidden = true;
    			if(context.request.parameters.recur == 'false' || context.request.parameters.recur == null){
        			x.isCollapsed = true;
        			x.isBorderHidden = true;
    			}
    			else if(context.request.parameters.recur == 'true'){
        			x.isCollapsed = false;
        			x.isBorderHidden = false;
    			}
    		}
        }
    	
    	for( fieldname in LOCAL_VARS.FIELDS.RECIPE)
        {
    		var oField = form.addField
	        ({
	        	id : LOCAL_VARS.FIELDS.RECIPE[fieldname].id,
	        	label : LOCAL_VARS.FIELDS.RECIPE[fieldname].label,
            	type : LOCAL_VARS.FIELDS.RECIPE[fieldname].type,
            	source : LOCAL_VARS.FIELDS.RECIPE[fieldname].source?LOCAL_VARS.FIELDS.RECIPE[fieldname].source:'',
            	container : LOCAL_VARS.FIELDS.RECIPE[fieldname].container
			});
        	
        	if(LOCAL_VARS.FIELDS.RECIPE[fieldname].displayType)
        	{
            	oField.updateDisplayType({
           			displayType : LOCAL_VARS.FIELDS.RECIPE[fieldname].displayType
           		});
        	}
        }
    	
			
    	var stUserIdObj = runtime.getCurrentUser();
		var stUserId = stUserIdObj.id;
    	
		var custRec =  record.load({                
    		type: record.Type.CUSTOMER,                
    		id: stUserId           
    	});
		
		var invAmt = form.getField({ id: 'custpage_invamt'});
		invAmt.updateDisplayType({'displayType':'inline'});
		var invPay = form.getField({ id: 'custpage_invtopay'});
		invPay.updateDisplayType({'displayType':'inline'});
		
		//Add Recurring Fields.
		var rec1 = form.addField({id: 'custpage_isrecurring',label: 'Recurring Payment?',type: serverWidget.FieldType.CHECKBOX,container: 'custpage_recurringinfo'});
		var rec2 = form.addField({id: 'custpage_payevery',label: 'Credit Card Charge Date',type: serverWidget.FieldType.SELECT,container: 'custpage_recurringinfo'});
		var rec3 = form.addField({id: 'custpage_next_recurring',label: 'Next Billing Date',type: serverWidget.FieldType.DATE,container: 'custpage_recurringinfo'});
		var rec4 = form.addField({id: 'custpage_last_recurring',label: 'Last Billing Date',type: serverWidget.FieldType.DATE,container: 'custpage_recurringinfo'});
		var rec5 = form.addField({id: 'custpage_terms',label: 'Terms (monthly)',type: serverWidget.FieldType.TEXT,container: 'custpage_recurringinfo'});
		
		//https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=1500&deploy=1&compid=626022_SB1&recur=true
		if(context.request.parameters.recur == 'false' || context.request.parameters.recur == null){
			rec1.updateDisplayType({'displayType':'hidden'});
			rec2.updateDisplayType({'displayType':'hidden'});
			rec3.updateDisplayType({'displayType':'hidden'});
			rec4.updateDisplayType({'displayType':'hidden'});
			rec5.updateDisplayType({'displayType':'hidden'});
		}
		else if(context.request.parameters.recur == 'true'){
			rec1.updateDisplayType({'displayType':'normal'});
			rec2.updateDisplayType({'displayType':'normal'});
			rec3.updateDisplayType({'displayType':'inline'});
			rec4.updateDisplayType({'displayType':'inline'});
			rec5.updateDisplayType({'displayType':'inline'});
		}
		
		//Set mandatory fields
		var fld1 = form.getField('custpage_payment_amt');
		var fld2 = form.getField('custpage_cc_cvv');
		var fld3 = form.getField('custpage_payevery');
		var fld4 = form.getField('custpage_creditcardselect');
		var fld5 = form.getField('custpage_payment_mtd');
		var fld6 = form.getField('custpage_expires');
		var fld7 = form.getField('custpage_ccno');
		
		fld1.isMandatory = true;
		fld2.isMandatory = true;
		fld3.isMandatory = true;
		fld4.isMandatory = true;
		fld5.isMandatory = true;
		fld6.isMandatory = true;
		fld7.isMandatory = true;
		
		
		//Add payment scheduled
		var objFld = form.getField('custpage_payevery');
		objFld.addSelectOption({ value : 'none',  text : '- Select -'});
		objFld.addSelectOption({ value : '1st',  text : '1st day of Month'});
		objFld.addSelectOption({ value : '15th',  text : '15th day of Month'});
		
    	//Add Hidden field 
    	var ccList = getCCList(custRec);
    	var ccListFld = form.addField({id: 'custpage_cclisthidden', type: 'longtext', label: 'CC List Hidden'});
    	ccListFld.updateDisplayType({'displayType' : 'hidden'});
    	ccListFld.defaultValue = JSON.stringify(ccList);
		
    	//Get CC Field
    	var objCreditCard = form.getField('custpage_creditcardselect');
    	objCreditCard.addSelectOption({    value : '-',  text : '-New-', isSelected : true});
    	for(var ccPos in ccList)
    	{
    		objCreditCard.addSelectOption({    value : ccList[ccPos].id,  text : ccList[ccPos].ccNumber, isSelected : ccList[ccPos].ccDefault});
    	}
		
		//Get Invoice
    	var invList = getINVList(stUserId);
    	populateList(form, invList, 'custpage_invoice');
    	
    	var invFld = form.getField({ id: 'custpage_invoice'});
    	if(context.request.parameters.invcid != 'null' && context.request.parameters.invcid != ''){
    		invFld.defaultValue = context.request.parameters.invcid;
    	}
		
		//Get PaymentList
    	var paymentList = getPaymentMethodList(arrPaymentMethodList)
    	populateList(form, paymentList, 'custpage_payment_mtd');
		
		//Get Currency LIST
    	var currList = getCurrencyList(custRec);
		var objCurrency = form.getField('custpage_currencies');
    	//objCurrency.addSelectOption({    value : '-',  text : '-New-', isSelected : true});
    	for(var ccPos in currList)
    	{
    		objCurrency.addSelectOption({ value : currList[ccPos].id,  text : currList[ccPos].name, isSelected : currList[ccPos].primary});
    	}
		if(context.request.parameters.invcid == '' || context.request.parameters.invcid == null || context.request.parameters.invcid == '-'){
			//Do nothing. blank value.
		}
		else{
			var x = search.lookupFields({
				type: search.Type.INVOICE,
				id: context.request.parameters.invcid,
				columns: 'currency'
			});
			objCurrency.defaultValue = x.currency;
		}
		
    	form.addSubmitButton({label :'Submit'});
        context.response.writePage(form);//write.
    }
    
    function populateList(form, objlist, field)
    {
		var objFld = form.getField(field);
		objFld.addSelectOption({value : '-', text : '-None-',  isSelected : true});
    	for(var inv in objlist)
    	{
			var obj =  objlist[inv];
			objFld.addSelectOption({ value : obj.id,  text : obj.name});
		}
    }
    
    
    function LocalVariables()
    {
    	this.LISTRECORDTYPE =
    	{
        	INVOICE : 'invoice',
        	PAYMENT_METHOD : 'paymentmethod',
        	CURRENCY : 'currency'
    	};
		this.PARAM =
		{
			WIPTMPLRECORDSS : 'custscript_wisl_wirss',
			WIPTMPLCHILDRECORDSS : 'custscript_wisl_wcrss',
			CLIENTSCRIPT : 'custscript_wisl_cs'
		};
		
		this.WIPTMPLRECORD =
		{
			TITLE : 'Customer Deposit'
		};
		this.FIELDGROUP =
		{
			PRIMARY :
			{
				id : 'custpage_primaryinfo',
				label : 'Primary Information'
			},
			RECURRING :
			{
				id: 'custpage_recurringinfo',
				label: 'Recurring Payment'
			},
			PAYMENT :
			{
				id : 'custpage_paymentmethod',
				label : 'Payment Method'
			}
		};
		this.FIELDS =
		{
			RECIPE :
			{
				
				invoice : 
				{
					id : 'custpage_invoice',
					label : 'Invoice',
					type : serverWidget.FieldType.SELECT,
					container: this.FIELDGROUP.PRIMARY.id
				},
				invoiceamount :
				{
					id : 'custpage_invamt',
					label : 'Total Amount',
					type: serverWidget.FieldType.CURRENCY,
					container : this.FIELDGROUP.PRIMARY.id
				},
				amttopay :
				{
					id: 'custpage_invtopay',
					label: 'Balance',
					type: serverWidget.FieldType.CURRENCY,
					container: this.FIELDGROUP.PRIMARY.id
				},
				payment : 
				{
					id :'custpage_payment_amt',
					label : 'Payment Amount',
					type : serverWidget.FieldType.CURRENCY,
					container: this.FIELDGROUP.PRIMARY.id
				},
				currency : 
				{
					id: 'custpage_currencies',
					label : 'Currency',
					type : serverWidget.FieldType.SELECT,
					//source : this.LISTRECORDTYPE.CURRENCY,
					container: this.FIELDGROUP.PRIMARY.id
				},
				/*checknum : 
				{
					id : 'custpage_check_no',
					label : 'Check No',
					type : serverWidget.FieldType.TEXT,
					container: this.FIELDGROUP.PAYMENT.id
				},*/
				creditcard : 
				{
					id : 'custpage_creditcardselect',
					label : 'Credit Card Select',
					type : serverWidget.FieldType.SELECT,
					container: this.FIELDGROUP.PAYMENT.id
				},
                paymentmethod : 
				{
					id: 'custpage_payment_mtd',
					label : 'Payment Method',
					type : serverWidget.FieldType.SELECT,
                  container: this.FIELDGROUP.PAYMENT.id
					//source : this.LISTRECORDTYPE.PAYMENT_METHOD
				},
				ccnumber : 
				{
					id : 'custpage_ccno',
					label : 'Credit Card #',
					type : serverWidget.FieldType.TEXT,
					container: this.FIELDGROUP.PAYMENT.id
				},
              	ccsecuritycode : 
				{
					id : 'custpage_cc_cvv',
					label : 'CVV',
					type : serverWidget.FieldType.TEXT,
					container: this.FIELDGROUP.PAYMENT.id
				},
				ccexpiredate : 
				{
					id : 'custpage_expires',
					label : 'Expires (MM/YYYY)',
					type : serverWidget.FieldType.TEXT,
					container: this.FIELDGROUP.PAYMENT.id
				},
				ccname : 
				{
					id : 'custpage_nameoncard',
					label : 'Name on Card',
					type : serverWidget.FieldType.TEXT,
					container: this.FIELDGROUP.PAYMENT.id
				},
				ccstreet : 
				{
					id : 'custpage_creditstreet',
					label : 'Credit Street',
					type : serverWidget.FieldType.TEXT,
					container: this.FIELDGROUP.PAYMENT.id
				},
				cczipcode : 
				{
					id : 'custpage_creditzip',
					label : 'Credit ZipCode',
					type : serverWidget.FieldType.TEXT,
					container: this.FIELDGROUP.PAYMENT.id
				}
			}
		};
    }
    
    function createDeposit(context, fields)
    {
    	var stMessage = 'Form values:\n';
    	var bHasError = false;
    	var primaryCustomerMail = '';
    	try 
    	{
	    	var stLogTitle = 'createDeposit';
			log.debug(stLogTitle, ' -->> Enter' );
			
			var paymentMethod = context.request.parameters['custpage_payment_mtd'];
			log.debug('paymentMethod', paymentMethod);
			
			if (paymentMethod == '' || paymentMethod == null || paymentMethod == '-') {
				 var errorObj = error.create({
					    name: '1000',
					    message: 'Please Enter Payment Method and Information',
					    notifyOff: false
					});
				throw errorObj;
				return false;
			}			
			
			var stUserIdObj = runtime.getCurrentUser();
			var stUserId = stUserIdObj.id;
	    	//stUserId = '6364'; //testing

			var primaryCustRec =  record.load({
				type: record.Type.CUSTOMER,
				id: stUserId
			});
			primaryCustomerMail = primaryCustRec.getValue('email');
			
	    	var recDeposit = record.create({
	    		type: record.Type.CUSTOMER_DEPOSIT,                  
	    		isDynamic:true            
	    	}); 
	
	    	recDeposit.setValue('customer', stUserId);
	    	
	    	for(field in fields.RECIPE)
	    	{
	    		var stFormValue = context.request.parameters[fields.RECIPE[field].id];
	    		if(field == 'custpage_payment_amt'){
	    			if(context.request.parameters['custpage_invoice'] != ''){
		        		var invcExchange = search.lookupFields({
		        			type: search.Type.INVOICE,
		        			id: context.request.parameters['custpage_invoice'],
		        			columns: 'exchangerate'
		        		});
		    			stFormValue = stFormValue / invcExchange.exchangerate;
	    			}
	    		}
	    		log.debug(stLogTitle, ' field ='+field );
	    		log.debug(stLogTitle, ' stFormValue ='+stFormValue );
	    		if(stFormValue && stFormValue != '-'){
	    			recDeposit.setValue(field, stFormValue);
	    		}
	    	}
	    	
	    	var x = context.request.parameters['custpage_payment_amt'];
	    	
	    	recDeposit.setValue('payment', x);			//loads the actual amount of the sales order for some reason. Copied the payment to make sure it only applies what the customer entered
	    	if(!recDeposit.getValue('creditcard'))
	    	{
	    		recDeposit.setValue('ccapproved', false);
	    	} else 
	    	{
	    		recDeposit.setValue('ccapproved', true);
	    		recDeposit.setValue('chargeit', true);
	    	}
	    	
	    	recDeposit.setValue('memo', runtime.getCurrentUser().email);	//set the user e-mail to the memo to be sourced later
	    	var stDepositId = recDeposit.save({
	    			enableSourcing: true,                
	    			ignoreMandatoryFields: true           
	    	});
	    	
	    	
	    	if(context.request.parameters['custpage_invoice'] == '' || context.request.parameters['custpage_invoice'] == null || context.request.parameters['custpage_invoice'] == '-'){
	    		//Do nothing. If no Invoice is selected.
	    	}
	    	else{
		    	//Apply Customer Deposit.
		    	var custPayment = record.transform({
		    		fromType: record.Type.INVOICE,
		    		fromId: context.request.parameters['custpage_invoice'],
		    		toType: record.Type.CUSTOMER_PAYMENT,
		    		isDynamic: false
		    	});
		    	var depCount = custPayment.getLineCount({ sublistId: 'deposit'});
		    	var invCount = custPayment.getLineCount({ sublistId: 'apply'});
		    	var remainingAmt = '';
		    	for(var x = 0; x < depCount; x++){
		    		if(custPayment.getSublistValue({ sublistId: 'deposit', fieldId: 'doc', line: x}) == stDepositId){
		    			remainingAmt = custPayment.getSublistValue({ sublistId: 'deposit', fieldId: 'remaining', line: x});
		    			custPayment.setSublistValue({ sublistId: 'deposit', fieldId: 'apply', line: x, value: true});
		    			custPayment.setSublistValue({ sublistId: 'deposit', fieldId: 'amount', line: x, value: remainingAmt});
		    			x = depCount;	//escape the loop
		    		}
		    	}
		    	
		    	//If Customer Deposit is greater than the remaining amount, skip this logic.
		    	//Auto-apply will not create a Customer Payment since remaining amount after Customer Deposit is zero (0.00)
		    	if(remainingAmt >= context.request.parameters['custpage_invtopay']){
			    	for(var x = 0; x < invCount; x++){
			    		if(custPayment.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: x}) == context.request.parameters['custpage_invoice']){
			    			custPayment.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: x, value: true});
			    			custPayment.setSublistValue({ sublistId: 'apply', fieldId: 'userenteredamount', line: x, value: remainingAmt});
			    		}
			    		else{
			    			custPayment.setSublistValue({ sublistId: 'apply', fieldId: 'apply', line: x, value: false});
			    		}
			    	}
			    	custPayment.setValue({ fieldId: 'autoapply', value: true});
			    	if(remainingAmt > context.request.parameters['custpage_invtopay']){
				    	//custPayment.setValue({ fieldId: 'payment', value: '0.01'});	//gives an error when it's set to 0.00 or 0
				    	custPayment.setValue({ fieldId: 'paymentmethod', value: ''});
				    	custPayment.setValue({ fieldId: 'chargeit', value: false});
			    	}
			    	else if(remainingAmt == context.request.parameters['custpage_invtopay']){
			    		//Do nothing.
			    	}
		    	}
		    	
				var appliedDeposit = custPayment.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				
				//Delete the Customer Payment record in order to just 'Apply' from the customer deposit.
				//This is a required step, if the Customer Deposit is to be applied to the Invoice record. Without this, there will be a mismatch with the 'Applied' value.
				var delCustPayment = record.delete({ type: record.Type.CUSTOMER_PAYMENT, id: appliedDeposit});
		    	
				
		    	//If Recurring = true, set the Date Values of Next Charge, and Last Charge.
		    	var isRecurring = context.request.parameters['custpage_isrecurring'];
		    	if(isRecurring){
		    		var dd = '';
		    		if(context.request.parameters['custpage_payevery'] == '1st')
		    			dd = '1';
		    		else if(context.request.parameters['custpage_payevery'] == '15th')
		    			dd = '2';
		    		
		    		var termsRemaining = (context.request.parameters['custpage_terms'] - 1);
		    		var updateBillDates = record.submitFields({
		    			type: record.Type.INVOICE,
		    			id: context.request.parameters['custpage_invoice'],
		    			values: {
		    				custbody_nsacs_next_chargedate: context.request.parameters['custpage_next_recurring'],
		    				custbody_nsacs_last_chargedate: context.request.parameters['custpage_last_recurring'],
		    				custbody_nsacs_recurring_amt: context.request.parameters['custpage_payment_amt'],
		    				custbody_nsacs_recurring_terms: context.request.parameters['custpage_terms'],
		    				custbody_nsacs_charge_date: dd,
		    				custbody_nsacs_first_deposit: stDepositId,
		    				custbody_nsacs_terms_remaining: termsRemaining,
		    				//custbody_nsacs_orig_amt: context.request.parameters['custpage_payment_amt'],
		    				custbody_nsacs_cc_expiry: context.request.parameters['custpage_expires']
		    			},
		    			options:{
		    				enableSourcing: true,
		    				ignoreMandatoryFields: true
		    			}
		    		});
		    	}
	    	}
	    	
    		var deptranid = search.lookupFields({
    			type: search.Type.CUSTOMER_DEPOSIT,
    			id: stDepositId,
    			columns: ['tranid','amount','exchangerate']//customer
    		});
    		
    		
			var subj = 'Customer Deposit #' + deptranid.tranid;
			
			var currency = context.request.parameters['custpage_currencies'];
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
			
			var val = (deptranid.amount / deptranid.exchangerate);
			var convVal = Number(Math.round(val+'e'+2)+'e-'+2);
			
			var bdy = 'This e-mail is to confirm that the Customer Deposit has been successfully created.<br/><br/>TOTAL AMOUNT: ' + ISOcode + ' ' + convVal;
			var userObj = runtime.getCurrentUser();
			var customerMail = userObj.email;
            email.send({
                author: -5,
                recipients: [customerMail,primaryCustomerMail],
                subject: subj,
                body: bdy
            });
            log.audit('E-mail receipt sent to', customerMail);
	    	stMessage = 'Customer Deposit #'+deptranid.tranid+' was successfully created.';
    	}
		catch (e)
		{
			/*
			 * Error messages:
			 * 
			 * - You have entered an Invalid Field Value - for the following field: invoice
			 * - An unexpected error occurred while processing the credit card through Merchant e-Solutions (reason code = 0N7). Please contact NetSuite support.
			 */
			
			bHasError = true;
			if (e.message != undefined)
			{
				//if(e.message == 'You have entered an Invalid Field Value - for the following field: invoice'){
				//	stMessage = 'Please enter a value for the field "Invoice"';
				//}
				if(e.message == 'An unexpected error occurred while processing the credit card through Merchant e-Solutions (reason code = 0N7). Please contact NetSuite support.'){
					//stMessage = 'Your CVV details did not match the credit card information provided. Please verify your payment details and try again.\nShould you continue to receive this error, you may contact the following:\n\nEmail: AR@Qualys.com\nPhone: 650-801-6256 (US Primary)';
                    stMessage = '<!DOCTYPE html><html><body><p>Your CVV details did not match the credit card information provided. Please verify your payment details and try again.<br>Should you continue to receive this error, you may contact the following:<br><br>Email: <a href="mailto:AR@Qualys.com">AR@Qualys.com</a><br>Phone: 650-801-6256 (US Primary)</p></body></html>';
				}
				else
					stMessage = e.message;	//custom message
				    //stMessage = '<!DOCTYPE html><html><body><p>Your card has been declined. Please verify your payment details and try again.<br>Should you continue to receive this error, you may contact the following:<br><br>Email: <a href="mailto:AR@Qualys.com">AR@Qualys.com</a><br>Phone: 650-801-6256 (US Primary)</p></body></html>'; 
			}
			else
			{
				stMessage = e.toString();
			}
		}
	    	
	    var form = serverWidget.createForm({
	            title: LOCAL_VARS.WIPTMPLRECORD.TITLE
	    });

	    var obJResult = form.addField
        ({
        	id : 'custpage_result',
        	label : 'Result',
        	type : 'inlinehtml'
       	});
	    obJResult.defaultValue = stMessage;
	    
	    if(bHasError)
	    {
		    form.addButton({
				id : "custpage_back",
				label : "Back",
				functionName : "window.history.back"
			});
	    }
	   
        context.response.writePage(form);
    }
	
	
	function getINVList(stUserId)
	{
		var stLogTitle = 'getINVList';
		
		var objINVList = {};

		//Search invoice - internal ID 19044
		var invSrch = search.load({
			id: 'customsearch_nsacs_sosearch_suitelet',  
		});
		
		var arrFilters = invSrch.filters;
		arrFilters.push(search.createFilter({
			name: 'internalid',
			join: 'customer',
			operator: 'is',
			values: stUserId
		}));

		invSrch.run().each(function(result){
			
			var stTranId = result.getValue({
				name: 'internalid'
			});
          
			log.debug(stLogTitle, 'stTranId = '+stTranId );
			
			var stTranName = result.getValue({
				name: 'transactionname'
			});
			
			if(!objINVList[stTranId])
			{
				objINVList[stTranId] = {};
				objINVList[stTranId].id = stTranId;
				objINVList[stTranId].name = stTranName;
			}
			
			return true;
		});
		
		log.debug(stLogTitle, 'objINVList = '+JSON.stringify(objINVList) );
  
		return objINVList;
	}

	function getPaymentMethodList(arrPaymentMethodList)
	{
		var stLogTitle = 'getPaymentMethodList';
	
		var objPMList = null;
		
		if(arrPaymentMethodList.length > 0)
		{
			objPMList = {};
			
			var paymentSrch = search.create({type: 'paymentmethod', columns: ['internalid', 'name']});
			var filters = new Array();
			filters.push(search.createFilter({name: 'internalid', operator: search.Operator.ANYOF, values: arrPaymentMethodList})) ;
			paymentSrch.filters = filters ;
			paymentSrch.run().each(function(result){
				
				var stPMId = result.getValue({
					name: 'internalid'
				});
				
				var stPMName = result.getValue({
					name: 'name'
				});
				
				if(!objPMList[stPMId])
				{
					objPMList[stPMId] = {};
					objPMList[stPMId].id = stPMId;
					objPMList[stPMId].name = stPMName;
				}
				
				return true;
			});
			
			log.debug(stLogTitle, 'objPMList = '+JSON.stringify(objPMList) );
		}
  
		return objPMList;
	}
    
	
	function getCurrencyList(custRec)
	{
		var stLogTitle = 'getCurrencyList';
	
		var objCurrencies = {};
		
		var currCount = custRec.getLineCount('currency');
    	log.debug(stLogTitle, 'currCount = '+currCount );
    	
    	if(currCount > 0)
    	{	
    		for(var ccLine=0; ccLine <= currCount; ccLine++)
    		{
    			var id = custRec.getSublistValue({sublistId : 'currency',fieldId : 'currency',line : ccLine});
				
				if(id && !objCurrencies[id])
    			{
    				objCurrencies[id] = {};
    				objCurrencies[id].id = id;
					
					var recCurr = record.load({                
						type: 'currency',                
						id: id           
					});
    				objCurrencies[id].name = recCurr.getValue('name');
    				if(id == custRec.getValue('currency'))
					{
						objCurrencies[id].primary = true;
					}
				}
    		}
		
    	}
    	log.debug(stLogTitle, 'objCurrencies = '+JSON.stringify(objCurrencies) );
		
		return objCurrencies;
	}
	
    function getCCList(custRec)
    {
    	var stLogTitle = 'getCCList';

    	var objCCList = {};
    	
    	//Get credit card's info
    	var creditCardsCount = custRec.getLineCount('creditcards');
    	log.debug(stLogTitle, 'creditCardsCount = '+creditCardsCount );
    	
    	if(creditCardsCount > 0)
    	{	
    		for(var ccLine=0; ccLine <= creditCardsCount; ccLine++)
    		{
    			var id = custRec.getSublistValue({sublistId : 'creditcards',fieldId : 'internalid',line : ccLine});
    		
    			if(id && !objCCList[id])
    			{
    				objCCList[id] = {};
    				objCCList[id].id = custRec.getSublistValue({sublistId :'creditcards',fieldId :'internalid',line : ccLine});
    				objCCList[id].ccType = custRec.getSublistValue({sublistId :'creditcards',fieldId : 'paymentmethod',line : ccLine});
    				objCCList[id].ccNumber = custRec.getSublistValue({sublistId :'creditcards',fieldId : 'ccnumber',line : ccLine});
    				objCCList[id].expDate = custRec.getSublistValue({sublistId :'creditcards',fieldId : 'ccexpiredate',line : ccLine});
    				objCCList[id].ccDefault = custRec.getSublistValue({sublistId :'creditcards',fieldId :'ccDefault',line : ccLine});
    				objCCList[id].ccHolderName = custRec.getSublistValue({sublistId :'creditcards',fieldId : 'ccname',line : ccLine});
    			}
    		}
  
    	}
    	log.debug(stLogTitle, 'objCCList = '+JSON.stringify(objCCList) );
        	
    	return objCCList;
    }

    return {
        onRequest: onRequest
    };
    
});