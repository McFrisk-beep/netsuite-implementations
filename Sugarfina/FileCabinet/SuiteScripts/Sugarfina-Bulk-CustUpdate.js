/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/email', 'N/runtime', 'N/format'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, email, runtime, format) {
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
    function getInputData() {
    	//search: NS ACS | Customer Update Flag
    	var savedSearchID = '171106';
    	return search.load({
    		id: savedSearchID
    	});
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	var searchResult = JSON.parse(context.value);
    	var customerID = searchResult.values["internalid"];
    	
    	log.debug('Processing Customer ID', customerID.value);
    	try{
        	editSaveCustomer(customerID.value);
    	}
    	catch(e){
    		log.error('Error occurred', e);
    	}
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	//Summarize the data from the MAP/Reduce. For logging purposes.
    	log.audit('Summary Data', summary);
        log.audit({
            title: 'Usage units consumed', 
            details: summary.usage
        });
        log.audit({
            title: 'Concurrency',
            details: summary.concurrency
        });
        log.audit({
            title: 'Number of yields', 
            details: summary.yields
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
    
    function editSaveCustomer(internalID){
    	var cuRecord = record.load({
    		type: record.Type.CUSTOMER,
    		id: internalID
    	});
        cuRecord.setValue({ fieldId: 'custentity_nsacs_updateflag', value: true});
		cuRecord.save({
			enableSourcing: true,
			ignoreMandatoryFields: true
		});
		log.debug('Successful processing.', '-');
    }
});
