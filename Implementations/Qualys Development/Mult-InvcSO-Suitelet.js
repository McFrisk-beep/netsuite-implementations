/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/task', 'N/ui/serverWidget', 'N/format'],
/**
 * @param {record} record
 * @param {search} search
 * @param {task} task
 * @param {serverWidget} serverWidget
 */
function(record, search, task, serverWidget, format) {
   
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
    		
    		//FORM AND FIELDS INSTANTIATION
    		var form = serverWidget.createForm({
    			title: 'Invoice Multiple Sales Order',
    			hideNavBar: true
    		});
    		form.clientScriptFileId = '15486956';
    		form.addSubmitButton({
    			label: 'Generate Invoice'
    		});
    		var customerSelect = form.addField({id: 'custpage_customer', label: 'Customer', type: serverWidget.FieldType.SELECT });
    		var postPeriod = form.addField({id: 'custpage_postperiod', label: 'Posting Period', type: serverWidget.FieldType.SELECT });
    		var currDate = form.addField({id: 'custpage_currdate', label: 'Date', type: serverWidget.FieldType.DATE });
    		var nextBill = form.addField({id: 'custpage_nextbilldate', label: 'Next Bill On Or Before', type: serverWidget.FieldType.DATE });
    		var toPrint = form.addField({id: 'custpage_toprint', label: 'To Be Printed', type: serverWidget.FieldType.SELECT });
    		var toMail = form.addField({id: 'custpage_tomail', label: 'To be Emailed', type: serverWidget.FieldType.SELECT });
    		var arAccount = form.addField({id: 'custpage_aracct', label: 'A/R Account', type: serverWidget.FieldType.SELECT });
    		var ccApproved = form.addField({id: 'custpage_ccapproved', label: 'Credit Card Approved', type: serverWidget.FieldType.CHECKBOX });
    		var orderSublist = form.addSublist({id: 'custpage_orderlist', type: serverWidget.SublistType.LIST, label: 'Orders' });
    		//ORDER SUBLIST (FIELDS)
    		orderSublist.addField({id: 'custpage_invoice', type: serverWidget.FieldType.CHECKBOX, label: 'Invoice' });
    		orderSublist.addField({id: 'custpage_orderdate', type: serverWidget.FieldType.TEXT, label: 'Order Date' });
    		orderSublist.addField({id: 'custpage_ordnum', type: serverWidget.FieldType.TEXT, label: 'Order #' });
    		orderSublist.addField({id: 'custpage_billdate', type: serverWidget.FieldType.TEXT, label: 'Bill Date' });
    		orderSublist.addField({id: 'custpage_customername', type: serverWidget.FieldType.TEXT, label: 'Customer Name' });
    		orderSublist.addField({id: 'custpage_memo', type: serverWidget.FieldType.TEXT, label: 'Memo' });
    		orderSublist.addField({id: 'custpage_currency', type: serverWidget.FieldType.TEXT, label: 'Currency' });
    		orderSublist.addField({id: 'custpage_ordertype', type: serverWidget.FieldType.TEXT, label: 'Order Type' });
    		orderSublist.addMarkAllButtons();
    		//END
    		/*
    		var setFieldSublist = form.addSublist({
    			id: 'custpage_setfield',
    			type: serverWidget.SublistType.LIST,
    			label: 'Set Fields'
    		});
    		//SET FIELDS SUBLIST (FIELDS)
    		
    		//END*/
    		
    		//Set the default values on form-load.
    		var today = new Date();
    		var parsedDate = format.parse({ value: today, type: format.Type.DATE});
        	currDate.defaultValue = parsedDate;
        	
        	var lastDayMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
        	var parsedLastDayMonth = format.parse({ value: lastDayMonth, type: format.Type.DATE});
        	nextBill.defaultValue = parsedLastDayMonth;
        	
        	toPrint.addSelectOption({ value: '', text: 'Respect Customer Preference'});
        	toPrint.addSelectOption({ value: true, text: 'Yes'});
        	toPrint.addSelectOption({ value: false, text: 'No'});
        	
        	toMail.addSelectOption({ value: '', text: 'Respect Customer Preference'});
        	toMail.addSelectOption({ value: true, text: 'Yes'});
        	toMail.addSelectOption({ value: false, text: 'No'});
        	
        	var acctPeriodSearch = search.create({
        		type: search.Type.ACCOUNTING_PERIOD,
        		columns: ['periodname', 'internalid']
        	});
        	var acctFilters = new Array();
        	acctFilters.push(search.createFilter({ name: 'closed', operator: search.Operator.IS, values: false}));
        	acctPeriodSearch.filters = acctFilters;
        	acctPeriodSearch.run().each(function(result){
        		postPeriod.addSelectOption({ value: result.getValue({ name: 'internalid'}), text: result.getValue({ name: 'periodname'})});
        		return true;
        	});
        	
        	//Add Customer List from Saved Search
        	customerSelect.addSelectOption({ value: '', text: ' - Select - '});
    		var customerSearch = search.create({
    			type: 'salesorder',
    			columns: ['internalid', 'tranid', 'entity', 'statusref', 'datecreated', 'nextbilldate', 'memo', 'currency']
    		});
    		var filters = new Array();t
    		filters.push(search.createFilter({ name: 'status', operator: search.Operator.ANYOF, values: ['SalesOrd:E', 'SalesOrd:F']}));
    		filters.push(search.createFilter({ name: 'type', operator: search.Operator.ANYOF, values: 'SalesOrd'}));
    		filters.push(search.createFilter({ name: 'mainline', operator: search.Operator.IS, values: true}));
    		customerSearch.filters = filters;
    		var lineNum = 0;
    		customerSearch.run().each(function(result){
    			customerSelect.addSelectOption({ value: result.getValue({ name: 'entity'}), text: result.getText({ name: 'entity'})});
        		if(context.request.parameters.cid != '' && context.request.parameters.cid != null){
        			if(context.request.parameters.cid == result.getValue({ name: 'entity'})){
            			orderSublist.setSublistValue({
            				id: 'custpage_ordnum',
            				line: lineNum,
            				value: result.getValue({
                				name: 'tranid'
                			})
            			});
            			orderSublist.setSublistValue({
            				id: 'custpage_orderdate',
            				line: lineNum,
            				value: result.getValue({ name: 'datecreated'})
            			});
            			try{
                			orderSublist.setSublistValue({
                				id: 'custpage_billdate',
                				line: lineNum,
                				value: result.getValue({ name: 'nextbilldate'})
                			});
            			}
            			catch(e){
            				//do nothing. No value stored.
            			}
            			orderSublist.setSublistValue({
            				id: 'custpage_customername',
            				line: lineNum,
            				value: result.getText({ name: 'entity'})
            			});
            			try{
            				orderSublist.setSublistValue({
            					id: 'custpage_memo',
            					line: lineNum,
            					value: result.getValue({ name: 'memo'})
            				});
            			}
            			catch(e){
            				//do nothing. No value stored.
            			}
            			orderSublist.setSublistValue({
            				id: 'custpage_currency',
            				line: lineNum,
            				value: result.getText({ name: 'currency'})
            			});
            			lineNum++;
        			}
        		}
    			return true;
    		});
    		if(context.request.parameters.cid != '' && context.request.parameters.cid != null){
    			customerSelect.defaultValue = context.request.parameters.cid;
    		}
    		
    		context.response.writePage(form);
    	}
    	else if(context.request.method == 'POST'){
    		
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
