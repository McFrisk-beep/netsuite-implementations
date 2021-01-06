/**
 * Script Description - The script is for Unbilled Receivable Adjustment
 * 
 * Version          Date                     Author           
 * 1.0            16 May 2017        		Surendra Kumar           
 *
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
//- Surendra

define(['N/error', 'N/format', 'N/record', 'N/runtime', 'N/search', 'N/currency', 'N/file', 'N/cache', 'N/email'],
		/**
		 * @param {error} error
		 * @param {format} format
		 * @param {record} record
		 * @param {runtime} runtime
		 * @param {search} search
		 */
function(error, format, record, runtime, search, currency, file, cache, email) 
{

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 *
	 * @typedef {Object} ObjectRef
	 * @property {number} id - Internal ID of the record instance
	 * @property {string} type - Record type id
	 *
	 * @return {Array|Object|Search|RecordRef} inputSummary
	 * @since 2015.1
	 */

	var ERRSTRING 							= '';
	var ERRORFLAG 							= false;
	var PROCESSEDDATA						= [];
	var FURTHERPROCESS						= true;
	var ExCONST_customErrorType				= '1';
	var ExCONST_errScriptName				= '596';
	var ExCONST_JE_DEBIT_ACCT				= '133';
	var ExCONST_Statu_Revalued				= '2';
	var ExCONST_JE_Custom_Form				= '108';//HPE Journal Entry
	var ExCONST_DR_Account					= '133';

//	getInputData ============================================================================================== getInputData     
	function getInputData() {

		log.debug('getInputData','*** Start ***');
		
		var scriptObj = runtime.getCurrentScript();
		var param_JE_Custom_Form = scriptObj.getParameter({name:'custscript_hpe_ura_je_custom_form_id'});
		if (param_JE_Custom_Form)
			ExCONST_JE_Custom_Form = param_JE_Custom_Form;
		
		var myCache = cache.getCache({
			name: 'unbilledCache',
			scope: cache.Scope.PRIVATE
			});
		myCache.remove({
			key: '989888'
			});
		myCache.remove({
			key: 'tr989888'
			});
		
		var trackRecord = record.create({
    		type: 'customrecord_hpe_unbill_receiv_adj_track',
    		isDynamic: true,
    	});

    	trackerRecId = trackRecord.save({
			enableSourcing : true,
			ignoreMandatoryFields : true
		});	
    	
    	log.debug('getInputData','trackerRecId: ' + trackerRecId);
    	
    	myCache.put({
			key: 'tr989888',
			value: trackerRecId
			});

		return search.load({
			id: 'customsearch_hpe_creditrebill_salesorder'
		});
	}

	/**
	 * Executes when the map entry point is triggered and applies to each key/value pair.
	 *
	 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
	 * @since 2015.1
	 */
//	map ========================================================================================================== map    
	function map(context) 
	{
//		log.debug('map','*** Start ***');
		var searchResult = JSON.parse(context.value);	
		
		var myCache = cache.getCache({
			name: 'skMyCache',
			scope: cache.Scope.PRIVATE
			});

		var myValue = myCache.get({
			key: '989888'
			});
		if(myValue == null)
		{
			myCache.put({
			key: '989888',
			value: searchResult.id
			});
		}
		else
		{
			myValue += ',' + searchResult.id;
			myCache.put({
				key: '989888',
				value: myValue
				});
		}	

//		log.debug('map','element Id: ' + searchResult.id);
//		log.debug('map','item: ' + searchResult.getValue('item'));
//		log.debug('map','source internal Id: ' + searchResult.getValue({name: "internalid", join: "sourceTransaction"}));
		
		context.write({
			key   : searchResult.id,
			value : searchResult.values
		});
		
	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each group.
	 *
	 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
	 * @since 2015.1
	 */
//	reduce ============================================================================================================== reduce    
	function reduce(context) 
	{
		
		var soToProcess = context.key;	
		
		for (var i in context.values) 
		{
			var data = JSON.parse(context.values[i]);
		
			var itemToProcess = data.item.value;
			var subsidiary = data.subsidiary.value;
			var exchangeRate = data.exchangerate;
			var tranCurrency = data.currency.value;
			var localCurrency = data['currency.subsidiary'].value;
	
			
			log.debug('reduce','SO to be processed: ' + soToProcess);
			log.debug('reduce','item to be processed: ' + itemToProcess);
			log.debug('reduce','subsidiary: ' + subsidiary);
			log.debug('reduce','exchangeRate: ' + exchangeRate);
			log.debug('reduce','tranCurrency: ' + tranCurrency);
			log.debug('reduce','localCurrency: ' + localCurrency);
			
			var invoiceAmount = getInvoiceAmount(soToProcess, itemToProcess);// handle error for it
			if(invoiceAmount)
				invoiceAmount = parseFloat(invoiceAmount);
			var creditAmount = getCreditAmount(soToProcess, itemToProcess);// handle error for it
			if(creditAmount)
				creditAmount = parseFloat(creditAmount);
			var rebillAmount = getRebillAmount(soToProcess, itemToProcess);// handle error for it
			if(rebillAmount)
				rebillAmount = parseFloat(rebillAmount);
			var revenueAmountObj = getRevenueAmount(soToProcess, itemToProcess);// handle error for it
			
			var revenueElement = revenueAmountObj.revenueElement;
			var revenueAmount = revenueAmountObj.sumRevenueAmount;
			var deferralaccount = revenueAmountObj.deferralaccount;
			
			if(revenueAmount)
				revenueAmount = parseFloat(revenueAmount);
			
			log.debug('reduce','invoiceAmount: ' + invoiceAmount + ', creditAmount: ' + creditAmount + ', rebillAmount: ' + rebillAmount 
					+ ', revenueAmount: ' + revenueAmount);
			
			
			var armReclassAmount = 0;
			if(revenueAmount-invoiceAmount > 0)
				armReclassAmount = (revenueAmount-invoiceAmount * exchangeRate);
			
			log.debug('reduce','armReclassAmount: ' + armReclassAmount);
			
			var netBillingAmount = (invoiceAmount + rebillAmount - creditAmount);
			
			log.debug('reduce','netBillingAmount: ' + netBillingAmount);
			
			var soUpdateResponse = updateSoWithAmount(soToProcess, itemToProcess, netBillingAmount);
			
			log.debug('reduce','soUpdateResponse: ' + soUpdateResponse);
			
			var newReclassAmount = 0;
			if(revenueAmount-netBillingAmount > 0)
				newReclassAmount = revenueAmount-netBillingAmount * exchangeRate;
			
			
			var currentExchangeRate = currency.exchangeRate({
				source: tranCurrency,
				target: localCurrency,
				date: new Date()
				});
				log.debug('currency exchange','currency exchangeRate: ' + currentExchangeRate);
			
			
			log.debug('reduce','newReclassAmount: ' + newReclassAmount);
			
			var	reclassAdjustment = ((newReclassAmount - armReclassAmount) / currentExchangeRate).toFixed(2);
			
			log.debug('reduce','reclassAdjustment: ' + reclassAdjustment);
			
//			log.debug('reduce','********* to create JE Start ********');
//			log.debug('reduce','subsidiary: ' + subsidiary);
//			log.debug('reduce','ExCONST_DR_Account: ' + ExCONST_DR_Account);
//			log.debug('reduce','revenueElement: ' + revenueElement);
//			log.debug('reduce','deferralaccount: ' + deferralaccount);
//			log.debug('reduce','********* to create JE End ********');
			
			if(reclassAdjustment > 0)
			{	
				var jeId = createJE(subsidiary, soToProcess, revenueElement, ExCONST_DR_Account, deferralaccount, reclassAdjustment,exchangeRate,tranCurrency);
					
				log.debug('reduce','created jeId: ' + jeId);
			}
			
			
			
		
		}// end of line level for loop
		
		log.debug('reduce','*** End ***');
	}// end of reduce function
	
	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */

//	summarize ============================================================================================== summarize    
	function summarize(summary) {

//		log.debug('inside summary funciton');
		
//		var scriptObj 		= runtime.getCurrentScript();
//		var senderEmail  	= scriptObj.getParameter({name:'custscript_employee_internal_id_to_send'});
		
		var myCache = cache.getCache({
			name: 'unbilledCache',
			scope: cache.Scope.PRIVATE
			});

		var trackerRecId = myCache.get({
			key: 'tr989888'
			});
//		var invArray = myValue.split(',');
//		
//		log.debug('summarize','splitted invArray: ' + invArray);
		
//		var invoiceSearchObj = search.create({
//			   type: "invoice",
//			   filters: [
//			      ["type","anyof","CustInvc"], 
//			      "AND", 
//			      ["internalid","anyof",invArray], 
//			      "AND", 
//			      ["custbody_hpe_creditrebill_status","anyof","2"], 
//			      "AND", 
//			      ["mainline","is","T"]
//			   ],
//			   columns: [
//			      "tranid"
//			   ]
//			});
//
//			var invSearchResult = invoiceSearchObj.run().getRange({
//											start: 0,
//											end: 999
//										});
//		var processedInvIDs = '';
//		var successFlag = false;
//		if(invSearchResult != null)
//		for (var int = 0; int < invSearchResult.length; int++)
//		{
//			if(int == 0)
//				processedInvIDs = invSearchResult[int].getValue('tranid') + ' ';
//			else
//				processedInvIDs += '\n' + invSearchResult[int].getValue('tranid') + ' ';
//			successFlag = true;
//		}

		var temp = '';

		var inputSummary = summary.inputSummary;
		var mapSummary = summary.mapSummary; 

		//Getting Errors from getInputData
		if(inputSummary != null && inputSummary != '')
		{
			temp = inputSummary.error;           
		}

		//Getting Errors from Map
		if(mapSummary != null && mapSummary != '')
		{
			summary.mapSummary.errors.iterator().each(function(key, value) { 
				temp = '';
				temp += key;
				return true;
			}); 
		}

		//Getting Errors from Reduce
		summary.output.iterator().each(function(key, value) { 
			temp = '';
			temp += key;            
			return true;
		}); 

//		if(temp != '' && temp != null)
//		{
//			createErrorRecord(temp);
//		}
		
//		var bodyText = '';
//		var customSubject = 'Process status about cancellation of invoices';
//
//		if(successFlag)
//		{
//			bodyText = 'Below invoice processed successfully: \n' + processedInvIDs;
//		}
//		if(temp != '' && temp != null)
//		{
//			bodyText = '\n\n Error/s as below: \n' + temp;
//		}
		
		
		record.delete({
			type: 'customrecord_hpe_unbill_receiv_adj_track',
			id: trackerRecId
			});
		
//		log.debug('inside summary funciton End');
		
//		log.debug('summarize','sending email');
//		sendEmail([senderEmail], customSubject, bodyText);
	}
	
	function createJE(subsidiary, soId, revElement, drAccount, crAccount, amount,exchangeRate,tranCurrency)
	{
		try{
//		log.debug('createJE','**** JE start ****');
		//Create the Journal Entry
		var jeRecord = record.create({
			type: record.Type.JOURNAL_ENTRY,
			isDynamic: true,
		});
		
		jeRecord.setValue({
			fieldId : 'customform',
			value   : ExCONST_JE_Custom_Form
		});


		//Set the Subsidiary
		jeRecord.setValue({
			fieldId : 'subsidiary',
			value   : subsidiary
		});


		//Set the Currency
		jeRecord.setValue({
			fieldId : 'currency',
		value   : tranCurrency
		});
		
		//Set the Exchange Rate
		jeRecord.setValue({
			fieldId : 'exchangerate',
		value   : exchangeRate
		});
		
		//Set the Related Sales Order
		jeRecord.setValue({
			fieldId : 'custbody_hpe_relatedsalesorder',
			value   : soId
		});
		
		//Set the Related Revenue Element
		jeRecord.setValue({
			fieldId : 'custbody_hpe_related_revenue_element',
			value   : revElement
		});
		
		//Set CREDIT REBILL UNBILLED A/R ADJUSTMENT ENTRY - 
		jeRecord.setValue({
			fieldId : 'custbody_hpe_creditrebill_adj_entry',
			value   : true
		});
//		log.debug('createJE','before setting date');
		var date = new Date();
		var month = date.getMonth();		
		var year = date.getFullYear();
		var nextDate = new Date(year, month +2, 0);
		
		//Set REVERSAL DATE 
		jeRecord.setValue({
			fieldId : 'reversaldate',
			value   : nextDate
		});
		
		//Set DEFER ENTRY
		jeRecord.setValue({
			fieldId : 'reversaldefer',
			value   : true
		});
		
		
//		log.debug('createJE','after setting date nextDate: ' + nextDate);
			//Select The New Line
			jeRecord.selectNewLine({ 
				sublistId: 'line', 
			});

			//set the Dr Account Number  
			jeRecord.setCurrentSublistValue({
				sublistId  : 'line', 
				fieldId    : 'account',
				value      : drAccount
			});

			//Set the JE Credit Amount
			jeRecord.setCurrentSublistValue({
				sublistId  : 'line', 
				fieldId    : 'debit',
				value      : amount
			});

			jeRecord.commitLine({ 
				sublistId: 'line' 
			});
			
			//Select The New Line
			jeRecord.selectNewLine({ 
				sublistId: 'line', 
			});

			//set the Dr Account Number  
			jeRecord.setCurrentSublistValue({
				sublistId  : 'line', 
				fieldId    : 'account',
				value      : crAccount
			});

			//Set the JE Credit Amount
			jeRecord.setCurrentSublistValue({
				sublistId  : 'line', 
				fieldId    : 'credit',
				value      : amount
			});

			jeRecord.commitLine({ 
				sublistId: 'line' 
			});

//			log.debug('createJE','before submit record');
			
		var JE_ID = jeRecord.save({
			enableSourcing : true,
			ignoreMandatoryFields : true
		});

//		log.debug('createJE','after submit record JE_ID: ' + JE_ID);
		
		return JE_ID;
		}
		catch(ex)
		{
			log.debug('createJE','error: ' + ex.toString());
			return null;
		}
	}
	
	function updateSoWithAmount(soId, item, amount)
	{
		var saveFlag 				= false;
		var soRec 					= record.load({
			type: 'salesorder',
			id: soId
			});
		var itemCount 				= soRec.getLineCount({sublistId: 'item'});
//		log.debug('item count for so','itemCount: ' + itemCount);
		for (var itemIndex = 0; itemIndex < itemCount; itemIndex++)
		{
			 var lineItem 							= soRec.getSublistValue({
											        	sublistId: 'item',
											        	fieldId: 'item',
											        	line: itemIndex
											        	});	
			 if(item == lineItem)
			 {
				 soRec.setSublistValue({
			        	sublistId: 'item',
			        	fieldId: 'custcol_hpe_creditrebill_net_bill_amt',
			        	line: itemIndex,
			        	value: amount
			        	});
				 saveFlag = true;
			 }				 
			 
			
		}
		
		if(saveFlag)
		{	
			 var SO_ID = soRec.save({
					enableSourcing : true,
					ignoreMandatoryFields : true
				});
			 return 'Sales Order: ' + SO_ID + ', with item: ' + item + ' has been updated';
		}
		else
			return 'Nothing to updated';
	}// end of updateSoWithAmount function
	
	function getInvoiceAmount(soToProcess, itemToProcess)
	{
		var sumItemAmount = 0;
		var invoiceSearchObj = search.load({
			id: 'customsearch_hpe_cred_rebill_billed_so'
		});
			
		var filter1 = 	search.createFilter({
			name: 'createdfrom',
			operator: search.Operator.ANYOF,
			values: soToProcess
			});
		var filter2 = 	search.createFilter({
			name: 'item',
			operator: search.Operator.ANYOF,
			values: itemToProcess
			});
			
		invoiceSearchObj.filters.push(filter1);
		invoiceSearchObj.filters.push(filter2);
				
		var invSearchResult = invoiceSearchObj.run().getRange({
			start: 0,
			end: 999
		});
		
		if(invSearchResult)
		{
			for (var jeIndex = 0; jeIndex < invSearchResult.length; jeIndex++)
			{						
				sumItemAmount += parseFloat(invSearchResult[jeIndex].getValue({name: 'fxamount',summary: 'SUM'}));
			}
		}
		
//		log.debug('getInvoiceAmount','sumItemAmount: ' + sumItemAmount);
		
		
//		var invSearchResultElement = invSearchResult[0];
//
//		var itemName = invSearchResultElement.getValue({name: 'item',summary: 'GROUP'});
//		var itemAmount = invSearchResultElement.getValue({name: 'amount',summary: 'SUM'});
//		
//		log.debug('getInvoiceAmount','itemName: ' + itemName + ', itemAmount: ' + itemAmount);
		
		return sumItemAmount;
	}
	
	function getCreditAmount(soToProcess, itemToProcess)
	{
		var sumCreditAmount = 0;
		var jeSearchObj = search.load({
					id: 'customsearch_hpe_cb_invoice_reversal'
				});
					
				var filter1 = 	search.createFilter({
					name: 'custbody_hpe_relatedsalesorder',
					operator: search.Operator.ANYOF,
					values: soToProcess
					});
				var filter2 = 	search.createFilter({
					name: 'custcol_hpe_cred_rebill_item',
					operator: search.Operator.ANYOF,
					values: itemToProcess
					});
					
				jeSearchObj.filters.push(filter1);
				jeSearchObj.filters.push(filter2);
						
				var jeSearchResult = jeSearchObj.run().getRange({
					start: 0,
					end: 999
				});
				
				if(jeSearchResult)
				{
					for (var jeIndex = 0; jeIndex < jeSearchResult.length; jeIndex++)
					{				
						var signedamount = parseFloat(jeSearchResult[jeIndex].getValue('signedamount'));
						var normalAmount = parseFloat(jeSearchResult[jeIndex].getValue('amount'));
						var sign = signedamount/normalAmount;

						sumCreditAmount += (parseFloat(jeSearchResult[jeIndex].getValue('fxamount') * sign));
					}
				}
				
//				log.debug('getCreditAmount','sumCreditAmount: ' + sumCreditAmount);
				
				return sumCreditAmount;
	}// end of getCreditAmount function
	
	function getRebillAmount(soToProcess, itemToProcess)
	{
		var sumRebillAmount = 0;
		var rebillInvoiceSearchObj = search.create({
		   type: "invoice",
		   filters: [
		      ["type","anyof","CustInvc"], 
		      "AND", 
		      ["custbody_hpe_rebilled_invoice","is","T"], 
		      "AND", 
		      ["mainline","is","F"], 
		      "AND", 
		      ["taxline","is","F"], 
		      "AND", 
		      [["createdfrom","anyof",soToProcess],"OR",["custbody_hpe_original_so_number","anyof",soToProcess]], 
		      "AND", 
		      ["item","anyof",itemToProcess]
		   ],
		   columns: [
		      "fxamount"
		   ]
		});
						
				var rebillInvoiceSearchResult = rebillInvoiceSearchObj.run().getRange({
					start: 0,
					end: 999
				});
				
				if(rebillInvoiceSearchResult)
				{
					for (var rbiIndex = 0; rbiIndex < rebillInvoiceSearchResult.length; rbiIndex++)
					{
						sumRebillAmount += parseFloat(rebillInvoiceSearchResult[rbiIndex].getValue('fxamount'));
					}
				}
				
//				log.debug('getCreditAmount','sumRebillAmount: ' + sumRebillAmount);
				
				return sumRebillAmount;
	}// end of getRebillAmount function
	
	function getRevenueAmount(soToProcess, itemToProcess)
	{
		var revenueAmountObj = {};
		var sumRevenueAmount = 0;
		var revenueElement = '';
		var deferralaccount = '';

		var revenueelementSearchObj = search.create({
		   type: "revenueelement",
		   filters: [
		      ["revenueplan.accountingbook","anyof","1"], 
		      "AND", 
		      ["revenueplan.revenueplantype","anyof","ACTUAL"], 
		      "AND", 
		      ["revenueplan.status","noneof","ONHOLD"], 
		      "AND", 
		      ["sourcetransaction.internalid","anyof",soToProcess], 
		      "AND", 
		      ["revenueplan.item","anyof",itemToProcess]
		   ],
		   columns: [

		      search.createColumn({
		         name: "totalrecognized",
		         join: "revenuePlan"
		      }),
		      "deferralaccount"
		   ]
		});

		var revSearchResult = revenueelementSearchObj.run().getRange({
					start: 0,
					end: 999
				});
				
				if(revSearchResult)
				{
					revenueElement = revSearchResult[0].id;
					deferralaccount = revSearchResult[0].getValue('deferralaccount');
					for (var rbiIndex = 0; rbiIndex < revSearchResult.length; rbiIndex++)
					{
						sumRevenueAmount += parseFloat(revSearchResult[rbiIndex].getValue({name: 'totalrecognized',join: 'revenuePlan'}));
					}
				}
				
//				log.debug('getCreditAmount','sumRevenueAmount: ' + sumRevenueAmount);
				
				revenueAmountObj.revenueElement = revenueElement;
				revenueAmountObj.sumRevenueAmount = sumRevenueAmount;
				revenueAmountObj.deferralaccount = deferralaccount;
				
				return revenueAmountObj;
	}// end of getRevenueAmount function
	
	function getDeferralaccount(soId, itemId)
	{
		var revenueelementSearchObj = search.create({
			   type: "revenueelement",
			   filters: [
			      ["sourcetransaction.internalid","anyof",soId], 
			      "AND", 
			      ["revenueplan.revenueplantype","anyof","ACTUAL"], 
			      "AND", 
			      ["item","anyof",itemId]
			   ],
			   columns: [
			      "deferralaccount"
			   ]
			});
			var revSearchResult = revenueelementSearchObj.run().getRange({
									start: 0,
									end: 1
								});

			var revSearchResultElement = revSearchResult[0];

			var deferralaccount = revSearchResultElement.getValue('deferralaccount');
			
			return deferralaccount;
	}// end of getDeferralaccount funciton

	function createErrorRecord(errorMessage)
	{
		var errorRecord = record.create({
			type: 'customrecord_hpe_ns_error_log'
		});

		errorRecord.setValue({
			fieldId : 'custrecord_hpe_error_type',
			value : ExCONST_customErrorType
		});   
		errorRecord.setValue({
			fieldId : 'custrecord_hpe_script_name',
			value : ExCONST_errScriptName
		});
		errorRecord.setValue({
			fieldId : 'custrecord_hpe_error_details',
			value : errorMessage
		});
		errorRecord.setValue({
			fieldId : 'custrecord_hpe_send_email',
			value : true
		});

		var errorRecordId = errorRecord.save({
			enableSourcing: true
		});
		log.debug('errorRecordId', 'errorRecordId: '+errorRecordId); 
	}
	
	function sendEmail(recipients, customSubject, bodyText) 
	{
		
//		log.debug('sendEmail', 'recipients: ' + JSON.stringify(recipients));
//		log.debug('sendEmail', 'customSubject: ' + customSubject);
//		log.debug('sendEmail', 'bodyText: ' + bodyText);
		var senderId = recipients[0];
		email.send({
			author: senderId,
			recipients: recipients,
			subject: customSubject,
			body: bodyText
		});
		
		log.debug('sendEmail', 'email sent');
		
	}// end of sendEmail function

	return {
		getInputData: getInputData,
		map: map,
		reduce: reduce,
		summarize: summarize
	};
});