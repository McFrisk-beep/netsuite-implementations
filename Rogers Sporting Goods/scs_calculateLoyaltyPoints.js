function getEligibiltyRecords () {
    var filters = [];
    filters.push( new nlobjSearchFilter("isinactive", null, "is", "F"));

    var columns = [];
    columns.push( new nlobjSearchColumn("internalid"));
    columns.push( new nlobjSearchColumn("custrecord_rogers_points_multiplier"));

    var searchResults = nlapiSearchRecord("customrecord_rogers_points_elig", "", filters, columns);

    var records = {};

    for (var index =0; index < searchResults.length; index ++) {
        var recordId = searchResults[index].getValue(columns[0]);
        var mulitple = searchResults[index].getValue(columns[1]);

        records[recordId] = mulitple;
    }
    return records;
}

function calculateRoyaltyPoints (type){
    var newRecord = nlapiGetNewRecord();
    if (type != "delete") {
        var recordType = nlapiGetRecordType();
        var plusMinusSign = 1;
        var createdFrom = newRecord.getFieldValue("createdfrom");
        var status = newRecord.getFieldValue("status");
        var orderStatus = newRecord.getFieldValue("orderstatus");
        var redeemLoyaltyItem = nlapiGetContext().getSetting("SCRIPT", "custscript_scs_loyalty_redeem_item");
        if(recordType == "invoice" && createdFrom) return;
        if(recordType == "salesorder" && (type == "cancel" || (type == "create" && orderStatus == "A") || (type == "edit" && ["Pending Approval", "Cancelled"].indexOf(status) > -1))) return;
        if (recordType == "cashrefund" || recordType == "creditmemo") plusMinusSign = -1;
        var eligibityRecords = getEligibiltyRecords();

        var lineCount = newRecord.getLineItemCount("item");
        var totalReedemValue = 0;
        var totalLoyaltyPoints = 0;
        for (var index = 1; index <= lineCount ; index ++) {
            var itemId = newRecord.getLineItemValue("item", "item", index);
            var eligibiltyId = nlapiLookupField("item", itemId, "custitem_rog_points_eligibility");
            newRecord.setLineItemValue("item", "custcol_rog_points_eligibility", index, eligibiltyId);
            var amount = newRecord.getLineItemValue("item", "amount", index);
            var multipleNumber = eligibityRecords[eligibiltyId] || 0;

            totalLoyaltyPoints += Math.round(amount) * multipleNumber;

            if (itemId == redeemLoyaltyItem) {
                totalReedemValue += Math.round(amount) * 50;
            }
        }
        totalLoyaltyPoints = totalLoyaltyPoints * plusMinusSign;
        if(Math.abs(totalReedemValue)) newRecord.setFieldValue("custbody_rogers_points_redeemed", Math.abs(totalReedemValue));
        newRecord.setFieldValue("custbody_rogers_loyalty_points_earned", totalLoyaltyPoints);
    }
}

function afterSubmit(type) {
    /**
     * inactive
     */
    /*if (type != "delete") {

        var recordId = nlapiGetRecordId();
        var recordType = nlapiGetRecordType();
        var newRecord = nlapiLoadRecord(recordType, recordId);
        var context = nlapiGetContext().getExecutionContext();

        var createdFrom = newRecord.getFieldValue("createdfrom");
        var status = newRecord.getFieldValue("status");

        if(recordType == "invoice" && createdFrom) return;
        if(recordType == "salesorder" && ["Pending Approval", "Cancelled"].indexOf(status) > -1) return;

        var customerId = newRecord.getFieldValue("entity");
        var customerRecord = nlapiLoadRecord("customer", customerId);

        var excludeCustomerIds = JSON.parse(nlapiGetContext().getSetting("SCRIPT", "custscript_scs_exclude_customers"));
        if(excludeCustomerIds.indexOf(customerId) > -1) return;
        var param = {
            customerid: customerRecord.id,
            type: recordType,
            recordid: recordId
        };

        //nlapiSetRedirectURL("SUITELET", "customscript_scs_loyalty_balance", "customdeploy_scs_loyalty_balance", null, param );
        var calculateBalanceSuiteletURL = "https://system.netsuite.com" + nlapiResolveURL("SUITELET", "customscript_scs_loyalty_balance", "customdeploy_scs_loyalty_balance");

        nlapiRequestURL(calculateBalanceSuiteletURL, param);
    }
    */
}

function beforeLoad(type){
	//Trigger scenarios include "Approve"/"Create"/"Edit"
	if(type == "approve" || type == "create" || type == "edit"){
		triggerLoyaltyBalanceCalculation(type);
	}
}

function getLoyaltyFromCashSales (customerId) {
	try{
	    var columns = [];
	    columns.push( new nlobjSearchColumn("custbody_rogers_loyalty_points_earned", "", "SUM"));
	    columns.push( new nlobjSearchColumn("custbody_rogers_points_redeemed", "", "SUM"));

	    var filters = [];
	    filters.push( new nlobjSearchFilter("mainline", "", "is", "T"));
	    filters.push( new nlobjSearchFilter("type", "", "anyof", ["CashSale"]));
	    filters.push( new nlobjSearchFilter("name", "", "anyof", customerId));
	    filters.push( new nlobjSearchFilter("status", "", "noneof", "CashSale:A"));
	    filters.push( new nlobjSearchFilter("createdfrom", "", "anyof", "@NONE@"));

	    var searchResult = nlapiSearchRecord("transaction", null, filters, columns);

	    var balance = 0;
	    if (searchResult && searchResult.length > 0 ) {
	        balance = searchResult[0].getValue(columns[0]) - searchResult[0].getValue(columns[1]);
	    }
	}
	catch(e){
		nlapiLogExecution("ERROR", "getLoyaltyFromCashSales Error", e);
	}

    return parseFloat(balance);
}

function getLoyaltyFromInvoice(customerId) {
	try{
	    var columns = [];
	    columns.push( new nlobjSearchColumn("custbody_rogers_loyalty_points_earned", "", "SUM"));
	    columns.push( new nlobjSearchColumn("custbody_rogers_points_redeemed", "", "SUM"));

	    var filters = [];
	    filters.push( new nlobjSearchFilter("mainline", "", "is", "T"));
	    filters.push( new nlobjSearchFilter("type", "", "anyof", ["CustInvc"]));
	    filters.push( new nlobjSearchFilter("name", "", "anyof", customerId));
	    filters.push( new nlobjSearchFilter("createdfrom", "", "anyof", "@NONE@"));
	    var searchResult = nlapiSearchRecord("transaction", null, filters, columns);


	    var balance = 0;
	    if (searchResult && searchResult.length > 0 ) {
	        balance = searchResult[0].getValue(columns[0]) - searchResult[0].getValue(columns[1]);
	    }
	}
	catch(e){
		nlapiLogExecution("ERROR", "getLoyaltyFromInvoice Error", e);
	}

    return parseFloat(balance);
}

function getLoyaltyBalanceFromSalesOrder (customerId) {
	try{
	    var columns = [];
	    columns.push( new nlobjSearchColumn("custbody_rogers_loyalty_points_earned", "", "SUM"));
	    columns.push( new nlobjSearchColumn("custbody_rogers_points_redeemed", "", "SUM"));

	    var filters = [];
	    filters.push( ["mainline",  "is", "T"]);
		filters.push('AND');
	    filters.push( ["type",  "anyof", ["SalesOrd"]]);
		filters.push('AND');
	    filters.push( ["name",  "anyof", customerId]);
		filters.push('AND');
	    filters.push( [
	      				["status",  "noneof", ["SalesOrd:H", "SalesOrd:C", "SalesOrd:A"]]
	                   , 'OR'
	                   , ["custbody_roger_include_in_points_calc",  "is", "T"]
	                  ]);

	    var searchResult = nlapiSearchRecord("transaction", null, filters, columns);

	    var balance = 0;
	    if (searchResult && searchResult.length > 0 ) {
	        balance = searchResult[0].getValue(columns[0]) - searchResult[0].getValue(columns[1]);
	    }
	}
	catch(e){
		nlapiLogExecution("ERROR", "getLoyaltyBalanceFromSalesOrder Error", e);
	}

    return parseFloat(balance);
}

function getLoyaltyFromNegative(customerId) {
	try{
	    var columns = [];
	    columns.push( new nlobjSearchColumn("custbody_rogers_loyalty_points_earned", "", "SUM"));
	    var filters = [];
	    filters.push( new nlobjSearchFilter("mainline", "", "is", "T"));
	    filters.push( new nlobjSearchFilter("type", "", "anyof", ["CashRfnd", "CustCred"]));
	    filters.push( new nlobjSearchFilter("name", "", "anyof", customerId));

	    var searchResult = nlapiSearchRecord("transaction", null, filters, columns);

	    var balance = 0;
	    if (searchResult && searchResult.length > 0 ) {
	        balance = searchResult[0].getValue(columns[0])||0;
	    }
	}
	catch(e){
		nlapiLogExecution("ERROR", "getLoyaltyFromNegative Error", e);
	}

    return parseFloat(balance);
}

function searchLoyaltyBalance(customerId) {
	try{
	    var salesOrderBalance = getLoyaltyBalanceFromSalesOrder(customerId);
	    var cashSalesBalnce = getLoyaltyFromCashSales(customerId);
	    var invoiceBalance = getLoyaltyFromInvoice(customerId);
	    var negativeBalance = getLoyaltyFromNegative(customerId)||0;
	}
	catch(e){
		nlapiLogExecution("ERROR", "searchLoyaltyBalance Error", e);
	}

    return salesOrderBalance + cashSalesBalnce + invoiceBalance + negativeBalance;
}




function triggerLoyaltyBalanceCalculation(type) {

    var newRecord = nlapiGetNewRecord();
    var type = nlapiGetRecordType();
    var recordId = nlapiGetRecordId();
    var excludeCustomerIds = JSON.parse(nlapiGetContext().getSetting("SCRIPT", "custscript_scs_exclude_customers"));
    var customerId = newRecord.getFieldValue("entity");
    var createdFrom = newRecord.getFieldValue("createdfrom");
    var status = newRecord.getFieldValue("status");
  
  nlapiLogExecution("DEBUG", "info", type + "   " + status + "   " + createdFrom);
  try{
	  if(customerId == '' || customerId == null){
		  //Do nothing if these fields are blank.
	  }
	  else{
		    if(excludeCustomerIds.indexOf(customerId) > -1) return;
		    if(newRecord.type == "invoice" && createdFrom) return;
		    if(newRecord.type == "salesorder" && ["Pending Approval", "Cancelled"].indexOf(status) > -1) return;
		    
		    var customerRecord = nlapiLoadRecord("customer", customerId);
		    customerRecord.setFieldValue("custentity_rogers_loyalty_points_balance", searchLoyaltyBalance(customerId));
		    nlapiSubmitRecord(customerRecord);
	  }
  }
  catch(e){
	  nlapiLogExecution("ERROR", "triggerLoyaltyBalanceCalculation Error", e);
  }
}