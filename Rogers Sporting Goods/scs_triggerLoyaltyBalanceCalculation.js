function getLoyaltyFromCashSales (customerId) {
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

    return parseFloat(balance);
}

function getLoyaltyFromInvoice(customerId) {
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

    return parseFloat(balance);
}

function getLoyaltyBalanceFromSalesOrder (customerId) {
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

    return parseFloat(balance);
}

function getLoyaltyFromNegative(customerId) {
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

    return parseFloat(balance);
}

function searchLoyaltyBalance(customerId) {
    var salesOrderBalance = getLoyaltyBalanceFromSalesOrder(customerId);
    var cashSalesBalnce = getLoyaltyFromCashSales(customerId);
    var invoiceBalance = getLoyaltyFromInvoice(customerId);
    var negativeBalance = getLoyaltyFromNegative(customerId)||0;

    return salesOrderBalance + cashSalesBalnce + invoiceBalance + negativeBalance;
}




function triggerLoyaltyBalanceCalculation(id, from, type) {
    if (type == "view" || type == "delete") return;

    var newRecord = nlapiGetNewRecord();
    var type = nlapiGetRecordType();
    var recordId = nlapiGetRecordId();
    var excludeCustomerIds = JSON.parse(nlapiGetContext().getSetting("SCRIPT", "custscript_scs_exclude_customers"));
    var customerId = newRecord.getFieldValue("entity");
    var createdFrom = newRecord.getFieldValue("createdfrom");
    var status = newRecord.getFieldValue("status");
  
  nlapiLogExecution("DEBUG", "info", type + "   " + status + "   " + createdFrom);
    if(excludeCustomerIds.indexOf(customerId) > -1) return;
    if(newRecord.type == "invoice" && createdFrom) return;
    if(newRecord.type == "salesorder" && ["Pending Approval", "Cancelled"].indexOf(status) > -1) return;
    
    var customerRecord = nlapiLoadRecord("customer", customerId);
    customerRecord.setFieldValue("custentity_rogers_loyalty_points_balance", searchLoyaltyBalance(customerId));
    nlapiSubmitRecord(customerRecord);
}