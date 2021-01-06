/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * 1.00			07/29/2017			mjpascual				initial: 2754148
 * 1.10			20 Jul 2018			Chinmay Shepal			NS-1049 Customer Portal - Make deposit is creating deposit record when Payment Method or payment information is empty
 * 2.00			23 Oct 2018			NS PS Raphael			NS-1062 On Credit Card portal, when customer makes payment using Credit Card, CVV to be authenticated
 * 2.01			16 Nov 2018			NS PS Raphael			Removed the Sales Order being a requirememnt for the creation of Customer Deposit
 *
 */
define(['N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/error', 'N/redirect', 'N/format', 'N/record', 'N/ui/dialog'],
/**
 * @param {runtime} runtime
 */
function(runtime, search, serverWidget, url, error, redirect, format, record, dialog) {
   
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

    	form.clientScriptFileId = '14266957';//set client script.
         
    	for( fieldgroup in LOCAL_VARS.FIELDGROUP)
        {
    		form.addFieldGroup({
	        	id : LOCAL_VARS.FIELDGROUP[fieldgroup].id,
	            label : LOCAL_VARS.FIELDGROUP[fieldgroup].label
	        });
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
		
		//Set mandatory fields
		//var test1 = form.getField('custpage_payment_mtd');
		//var test2 = form.getField('custpage_ccno');
		var test3 = form.getField('custpage_payment_amt');
		//var test4 = form.getField('custpage_expires');
		//var test5 = form.getField('custpage_nameoncard');
		//var test6 = form.getField('custpage_creditzip');
		var test7 = form.getField('custpage_cc_cvv');
		
		//test1.isMandatory = true;
		//test2.isMandatory = true;
		test3.isMandatory = true;
		//test4.isMandatory = true;
		//test5.isMandatory = true;
		//test6.isMandatory = true;
		test7.isMandatory = true;
		
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
		
		//Get SO List
    	var soList = getSOList(stUserId);
    	populateList(form, soList, 'custpage_salesorder');
		
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
		
		
    	form.addSubmitButton({label :'Submit'});
        context.response.writePage(form);//write.
    }
    
    function populateList(form, objlist, field)
    {
		var objFld = form.getField(field);
		objFld.addSelectOption({value : '-', text : '-None-',  isSelected : true});
    	for(var so in objlist)
    	{
			var obj =  objlist[so];
			objFld.addSelectOption({ value : obj.id,  text : obj.name});
		}
    }
    
    
    function LocalVariables()
    {
    	this.LISTRECORDTYPE =
    	{
        	SALES_ORDER : 'salesorder',
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
				
				salesorder : 
				{
					id : 'custpage_salesorder',
					label : 'Sales Order',
					type : serverWidget.FieldType.SELECT,
					container: this.FIELDGROUP.PRIMARY.id
				},
				salesorderamount :
				{
					id : 'custpage_salesamt',
					label : 'Sales Amount to Pay',
					type: serverWidget.FieldType.TEXT,
					container : this.FIELDGROUP.PRIMARY.id
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

	    	var recDeposit = record.create({
	    		type: record.Type.CUSTOMER_DEPOSIT,                  
	    		isDynamic:true            
	    	}); 
	
	    	recDeposit.setValue('customer', stUserId);
	    	
	    	for(field in fields.RECIPE)
	    	{
	    		var stFormValue = context.request.parameters[fields.RECIPE[field].id];
	    		log.debug(stLogTitle, ' field ='+field );
	    		log.debug(stLogTitle, ' stFormValue ='+stFormValue );
	    		if(stFormValue && stFormValue != '-'){
	    			recDeposit.setValue(field, stFormValue);
	    		}
	    	}

	    	var x = context.request.parameters['custpage_payment_amt'];
	    	
	    	if(context.request.parameters['custpage_salesorder'] == '' || context.request.parameters['custpage_salesorder'] == null || context.request.parameters['custpage_salesorder'] == '-'){
	    		//do nothing. no sales order selected.
	    	}
	    	else{
	    		recDeposit.setValue('salesorder', context.request.parameters['custpage_salesorder']);
	    	}
	    	
	    	recDeposit.setValue('payment', x);			//loads the actual amount of the sales order for some reason. Copied the payment to make sure it only applies what the customer entered
	    	if(!recDeposit.getValue('creditcard'))
	    	{
	    		recDeposit.setValue('ccapproved', false);
	    	} else 
	    	{
	    		recDeposit.setValue('ccapproved', true);
	    		recDeposit.setValue('chargeit', true);
	    	}
	    	
	    	var stDepositId = recDeposit.save({
	    			enableSourcing: true,                
	    			ignoreMandatoryFields: true           
	    	});
	    	
    		var deptranid = search.lookupFields({
    			type: search.Type.CUSTOMER_DEPOSIT,
    			id: stDepositId,
    			columns: ['tranid']
    		});
	    	log.audit(stLogTitle, 'stDepositId = '+stDepositId );
	    	stMessage = 'Customer Deposit #'+deptranid.tranid+' was successfully created.';
    	}
		catch (e)
		{
			/*
			 * Error messages:
			 * 
			 * - You have entered an Invalid Field Value - for the following field: salesorder
			 * - An unexpected error occurred while processing the credit card through Merchant e-Solutions (reason code = 0N7). Please contact NetSuite support.
			 */
			
			bHasError = true;
			if (e.message != undefined)
			{
				//if(e.message == 'You have entered an Invalid Field Value - for the following field: salesorder'){
				//	stMessage = 'Please enter a value for the field "Sales Order"';
				//}
				if(e.message == 'An unexpected error occurred while processing the credit card through Merchant e-Solutions (reason code = 0N7). Please contact NetSuite support.'){
					//stMessage = 'Your CVV details did not match the credit card information provided. Please verify your payment details and try again.\nShould you continue to receive this error, you may contact the following:\n\nEmail: AR@Qualys.com\nPhone: 650-801-6256 (US Primary)';
                  stMessage = '<!DOCTYPE html><html><body><p>Your CVV details did not match the credit card information provided. Please verify your payment details and try again.<br>Should you continue to receive this error, you may contact the following:<br><br>Email: <a href="mailto:AR@Qualys.com">AR@Qualys.com</a><br>Phone: 650-801-6256 (US Primary)</p></body></html>';
				}
				else
					//stMessage = e.message;	//custom message
				    stMessage = '<!DOCTYPE html><html><body><p>Your card has been declined. Please verify your payment details and try again.<br>Should you continue to receive this error, you may contact the following:<br><br>Email: <a href="mailto:AR@Qualys.com">AR@Qualys.com</a><br>Phone: 650-801-6256 (US Primary)</p></body></html>'; 
			}
			else
			{
				//stMessage = e.toString();
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
	   
        context.response.writePage(form);//write.
    }
	
	
	function getSOList(stUserId)
	{
		var stLogTitle = 'getSOList';
		
		var objSOList = {};

		//Search salesorder
		var soSrch = search.load({
			id: 'customsearch_customer_sales_order',  
		});
		
		var arrFilters = soSrch.filters;
    	var arrColumns = soSrch.columns;     
		arrFilters.push(search.createFilter({
			name: 'internalid',
			join: 'customer',
			operator: 'is',
			values: stUserId
		}));

		soSrch.run().each(function(result){
			
			var stTranId = result.getValue({
				name: 'internalid'
			});
          
			log.debug(stLogTitle, 'stTranId = '+stTranId );
			
			var stTranName = result.getValue({
				name: 'transactionname'
			});
			
			if(!objSOList[stTranId])
			{
				objSOList[stTranId] = {};
				objSOList[stTranId].id = stTranId;
				objSOList[stTranId].name = stTranName;
			}
			
			return true;
		});
		
		log.debug(stLogTitle, 'objSOList = '+JSON.stringify(objSOList) );
  
		return objSOList;
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