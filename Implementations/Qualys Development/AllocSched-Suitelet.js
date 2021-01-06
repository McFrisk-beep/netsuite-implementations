/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/serverWidget'],
/**
 * @param {record} record
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(record, search, serverWidget) {
   
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
    		var form = serverWidget.createForm({
    			title: 'Journal History',
    			hideNavBar: true
    		});
    		var sublist = form.addSublist({
    			id: 'custpage_jelist',
    			type: serverWidget.SublistType.LIST,
    			label: 'Book Specific Journals'
    		});
    		sublist.addField({
    			id: 'custpage_id',
    			label: 'ID',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_postperiod',
    			label: 'Posting Period',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_entrydate',
    			label: 'Entry Date',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_acctbook',
    			label: 'Accounting Book',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_journalentry',
    			label: 'Journal Entry',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'custpage_detail',
    			label: 'Detail',
    			type: serverWidget.FieldType.TEXT
    		});
    		
    		var refAllocSched = context.request.parameters.allocid;
    		var jeSearch = search.create({
    			type: 'transaction',
    			columns: ['internalid','tranid', 'trandate', 'accountingbook']
    		});
    		var filters = new Array();
    		filters.push({ name: 'type', operator: search.Operator.ANYOF, values: 'Journal'});
    		filters.push({ name: 'custbody_nsacs_je_createdfrom', operator: search.Operator.IS, values: refAllocSched});
    		jeSearch.filters = filters;
    		var lineNum = 0;
    		var prevValue = '';
    		jeSearch.run().each(function(result){
    			if(prevValue != result.getValue({ name: 'tranid'})){
    				var postingPeriodLookup = search.lookupFields({
    					type: search.Type.JOURNAL_ENTRY,
    					id: result.getValue({ name: 'internalid'}),
    					columns: 'postingperiod'
    				});
    				var lookupPP = postingPeriodLookup['postingperiod'];
    				var lookupPpText = lookupPP[0]['text'];
    				try{
        				sublist.setSublistValue({
        					id: 'custpage_id',
        					line: lineNum,
        					value: result.getValue({ name: 'internalid'})
        				});
    				}
    				catch(e){
    					//blank value
    				}
    				try{
        				sublist.setSublistValue({
        					id: 'custpage_postperiod',
        					line: lineNum,
        					value: lookupPpText
        				});
    				}
    				catch(e){
    					//blank value
    				}
    				try{
        				sublist.setSublistValue({
        					id: 'custpage_entrydate',
        					line: lineNum,
        					value: result.getValue({ name: 'trandate'})
        				});
    				}
    				catch(e){
    					//blank value
    				}
    				try{
        				sublist.setSublistValue({
        					id: 'custpage_acctbook',
        					line: lineNum,
        					value: result.getValue({ name: 'accountingbook'})
        				});
    				}
    				catch(e){
    					//blank value
    				}
    				try{
        				sublist.setSublistValue({
        					id: 'custpage_journalentry',
        					line: lineNum,
        					value: result.getValue({ name: 'tranid'})
        				});
    				}
    				catch(e){
    					//blank value
    				}
    				try{
        				sublist.setSublistValue({
        					id: 'custpage_detail',
        					line: lineNum,
        					value: '<a href="https://system.netsuite.com/app/accounting/transactions/journal.nl?id='+result.getValue({ name: 'internalid'})+'&custbody_nsacs_adj_bsj=true">Detail</a>'
        				});
    				}
    				catch(e){
    					//blank value
    				}
    				prevValue = result.getValue({ name: 'tranid'});
    				lineNum++;
    			}
    			return true;
    		});
    		
    		//Render the page
    		context.response.writePage(form);
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
