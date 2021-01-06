/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/error', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/format'],
/**
 * @param {error} error
 * @param {record} record
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(error, record, search, serverWidget, runtime, format) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	if(context.request.method == 'GET'){
    		//var cust = runtime.getCurrentUser();
    		var cust = record.load({
    			type: record.Type.CUSTOMER,
    			id: '311'
    		});
        	var user = runtime.getCurrentUser().name;	//name of customer
        	var salesSearch = search.load({
        		id: 'customsearch673'
        	});	//loads saved search containing all available sales orders
    		
    		var form = serverWidget.createForm({
    			title: 'Customer Deposit',
    			hideNavBar: false
    		});
    		
    		form.addSubmitButton({
    			label: 'Make Deposit'
    		});
    		
    		//add user name
    		var currUser = form.addField({
    			id: 'custpage_name',
    			type: serverWidget.FieldType.TEXT,
    			label: 'Name'
    		});
    		currUser.defaultValue = user;	//default value is the user (defaults to -system- if no user in NS)
    		
    		//add sales order selection
    		var salesOrder = form.addField({
    			id: 'custpage_salesorder',
    			type: serverWidget.FieldType.SELECT,
    			label: 'Sales Orders for Deposit'
    		});
    		
    		//populate sales order fields
    		salesSearch.run().each(function(result){
    			salesOrder.addSelectOption({
    				value: result.getValue({
    					name: 'internalid'
    				}),
    				text: 'SO-' + result.getValue({
    					name: 'transactionnumber'
    				})
    			});
    			return true;
    		});
    		
    		//CREDIT CARD INFORMATION
    		var paymentMethod = form.addField({
    			id: 'custpage_payment',
    			type: serverWidget.FieldType.SELECT,
    			label: 'Payment Method'
    		});
    		
    		var creditCard = form.addField({
    			id: 'custpage_creditcard',
    			type: serverWidget.FieldType.SELECT,
    			label: 'Credit Card Select'
    		});
    		//var ccList = getCCList(cust);
    		
        	var ccCount = cust.getLineCount('creditcards');
        	if(ccCount > 0){
        		for(var x=0; x<ccCount; x++){
        			creditCard.addSelectOption({
        				value: cust.getSublistValue({ sublistId: 'creditcards', fieldId: 'ccnumber', line: x}),
        				text: cust.getSublistText({ sublistId: 'creditcards', fieldId: 'paymentmethod', line: x}) + '- ' + cust.getSublistValue({ sublistId: 'creditcards', fieldId: 'ccnumber', line: x})
        			});
        		}
        	}
    		
    		var ccnum = form.addField({
    			id: 'custpage_ccnum',
    			type: serverWidget.FieldType.TEXT,
    			label: 'Credit Card #'
    		});
    		
    		var ccexpire = form.addField({
    			id: 'custpage_ccexp',
    			type: serverWidget.FieldType.TEXT,
    			label: 'Expires (MM/YYYY)'
    		});
    		
    		var ccname = form.addField({
    			id: 'custpage_ccname',
    			type: serverWidget.FieldType.TEXT,
    			label: 'Cardholder Name'
    		});
    		
    		var cccsc = form.addField({
    			id: 'custpage_cccsc',
    			type: serverWidget.FieldType.TEXT,
    			label: 'CSC/CVV'
    		});
    		//END CREDIT CARD INFORMATION
    		
    		var payamt = form.addField({
    			id: 'custpage_payamt',
    			type: serverWidget.FieldType.CURRENCY,
    			label: 'Payment Amount'
    		});
    		
        	context.response.writePage(form);
    	}
    	else if(context.request.method == 'POST'){
    		//add code here
    	}
    }
    
    function getCCList(cust){
    	var ccList = {};
    	var ccCount = cust.getLineCount('creditcards');
    	if(ccCount > 0){
    		for(var x=0; x<ccCount; x++){
    			var id = cust.getSublistValue({
    				sublistId: 'creditcards',
    				fieldId: 'internalid',
    				line: x
    			});
    			if(id && !ccList[x]){
    				ccList[x] = {};
    				ccList[x].id = cust.getSublistValue({ sublistId: 'creditcards', fieldId: 'internalid', line: x });
    				ccList[x].ccType = cust.getSublistValue({ sublistId: 'creditcards', fieldId: 'paymentmethod', line: x });
    				ccList[x].ccNumber = cust.getSublistValue({ sublistId: 'creditcards', fieldId: 'ccnumber', line: x });
    				ccList[x].expDate = cust.getSublistValue({ sublistId: 'creditcards', fieldId: 'ccexpiredate', line: x });
    				ccList[x].ccDefault = cust.getSublistValue({ sublistId: 'creditcards', fieldId: 'ccDefault', line: x });
    				ccList[x].ccHolderName = cust.getSublistValue({ sublistId: 'creditcards', fieldId: 'ccname', line: x });
    			}
    		}
    	}
    }
    
    function getPaymentMethodList(paymentMethods){
    	var objPayments = null;
    	if(paymentMethods.length > 0){
    		objPayments = {};
    		var paySearch = search.create({
    			type: 'paymentmethod',
    			columns: ['internalid', 'name']
    		});
    		var filters = new Array();
    		filters.push(search.createFilter({name: 'internalid', operator: search.Operator.ANYOF, values: paymentMethods}));
    		paySearch.filters = filters;
    		paySearch.run().each(function(result){
    			var paymentId = result.getValue({name: 'internalid'});
    			var paymentName = result.getValue({name: 'name'});
    			if(!objPayments[paymentId]){
    				objPayments[paymentId] = {};
    				objPayments[paymentId].id = paymentId;
    				objPayments[paymentId].name = paymentName;
    			}
    			return true;
    		});
    	}
    	return objPayments;
    }

    return {
        onRequest: onRequest
    };
});