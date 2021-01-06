/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, search) {
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */

    /**************GLOBAL VARIABLES***************/
    var changeAccounts = false;

    function beforeSubmit(scriptContext) {
        log.debug('Script Execute', '==START==');
        
        var bsjRecord = scriptContext.newRecord;
        var adjustedJE = bsjRecord.getValue({ fieldId: 'custbody_is_book_specific_je_updated'});
        log.debug('adjustedJE | parentExpeneAlloc', adjustedJE + ' | ' + bsjRecord.getValue({ fieldId: 'parentexpensealloc'}));
        //Check if the record was aleady adjusted, and if the parentexpensealloc field is not blank.
        if(adjustedJE == false && bsjRecord.getValue({ fieldId: 'parentexpensealloc'}) != ''){
            log.debug('Inside conditional statement', 'adjustedJE = false & parentexpensealloc is not blank');
            //Variable declarations
            var allocMapOut = '';
            var lineCount = bsjRecord.getLineCount({ sublistId: 'line'});
            
            //Record load needed as sublists are not supported via field-lookup
            var allocDataLoad = record.load({
                type: record.Type.ALLOCATION_SCHEDULE,
                id: bsjRecord.getValue({ fieldId: 'parentexpensealloc'})
            });
            //Get the Destination account from the Allocation Schedule
            var destinationAcct = allocDataLoad.getSublistValue({ sublistId: 'allocationdestination', fieldId: 'account', line: 0});
            log.debug('Destination Account ID', destinationAcct);
            
            //Make it so that once the record has been adjusted, it doesn't execute this process twice.
            bsjRecord.setValue({ fieldId: 'custbody_is_book_specific_je_updated', value: true});
            
            //Create Saved Allocation Mapping Search for comparison
            var allocMapping = search.create({
                type: 'customrecord_ns_acs_allocation_mapping',
                columns: ['internalid', 'name', 'custrecord_ns_acs_alloc_in', 'custrecord_ns_acs_alloc_out'],
                filters: [{name: 'custrecord_ns_acs_alloc_in', operator: 'anyof', values: destinationAcct}]
            });
            
            //Runs the search only expecting one result to be the same exact match.
            //If no results are returned, then no changes should occur on the transaction
            allocMapping.run().each(function(result){
                try{
                    allocMapOut = result.getValue({ name: 'custrecord_ns_acs_alloc_out'});
                    changeAccounts = true;
                    log.debug('Alloc Out ID', allocMapOut);
                }
                catch(e){
                    //No results returned from saved search
                    changeAccounts = false;
                    log.debug('Error occurred on allocMapping', e);
                }
            });

            //Go through the JE lines. Check if the changeAccounts is true before going through the loop. Otherwise, skip and end the script.
            if(changeAccounts == true){
                for(var x = 0; x < lineCount; x++){
                    if(bsjRecord.getSublistValue({ sublistId: 'line', fieldId: 'memo', line: x}) == 'Allocation Source'){
                        //log.debug('Account changed on line ' + (x+1), 'from ' + bsjRecord.getSublistValue({ sublistId: 'line', fieldId: 'account', line: x}) + ' to ' + allocMapOut);
                        bsjRecord.setSublistValue({ sublistId: 'line', fieldId: 'account', line: x, value: allocMapOut});
                        if(bsjRecord.getSublistValue({ sublistId: 'line', fieldId: 'entity', line: x}) != ''){
                            bsjRecord.setSublistValue({ sublistId: 'line', fieldId: 'entity', line: x, value: ''});
                            //log.debug('Entity changed on line ' + (x+1) + ' to blank.', bsjRecord.getSublistValue({ sublistId: 'line', fieldId: 'entity', line: x}));
                        }
                    }
                }
            }
            log.debug('Script End', '==END==');
        }
    }

        /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
        log.debug('afterSubmit', '=== START ===');
        try{
            //Load the journal entry submitted.
            var oldform = scriptContext.newRecord;
            //Make sure that the Journal Entry was created from the Allocation Schedule.
            if(oldform.getValue({ fieldId: 'custbody_is_book_specific_je_updated'}) == true && oldform.getValue({ fieldId: 'parentexpensealloc'}) != ''){
                //Load the record.
                var rcrd = record.load({
                    type: record.Type.JOURNAL_ENTRY,
                    id: oldform.getValue({ fieldId: 'id'}),
                    isDynamic: true
                });
                var lines = rcrd.getLineCount({ sublistId: 'line'});
                //Variable handlers. Responsible for compressing the "Allocation - Out" - Credit to just one-line.
                var isFirst = true;
                var jeLineAmount = 0;
                var linesForDeletion = new Array();

                //Variable Handlers. Responsible for compressing the "Allocation - Out" - Debit to just one-line.
                var isFirst2 = true;
                var jeLineAmount2 = 0;
                var linesForDeletionDebit = new Array();

                //Assess each line to identify which lines are for deletion. Also handles the calculation of the Credit amount to be added.
                for(var x = 0; x < lines; x++){
                    if(isFirst && rcrd.getSublistValue({ sublistId: 'line', fieldId: 'memo', line: x}) == 'Allocation Source'
                        && rcrd.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: x}) != 0){
                        linesForDeletion.push(x);
                        isFirst = false;
                    }
                    else if(isFirst == false && rcrd.getSublistValue({ sublistId: 'line', fieldId: 'memo', line: x}) == 'Allocation Source'
                        && rcrd.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: x}) != 0){
                        jeLineAmount += rcrd.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: x});
                        linesForDeletion.push(x);   //Lines inserted afterwards are the lines for deletion.
                        //log.debug('Credit on line ' + (x+1), rcrd.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: x}));
                    }

                    /*if(isFirst2 && rcrd.getSublistValue({ sublistId: 'line', fieldId: 'memo', line: x}) == 'Allocation Source'
                        && rcrd.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: x}) != 0){
                        linesForDeletionDebit.push(x);
                        isFirst2 = false;
                    }
                    else if(isFirst2 == false && rcrd.getSublistValue({ sublistId: 'line', fieldId: 'memo', line: x}) == 'Allocation Source'
                        && rcrd.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: x}) != 0){
                        jeLineAmount2 += rcrd.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: x});
                        linesForDeletionDebit.push(x);
                    }*/
                }

                log.debug('jeLineAmount - CREDIT', jeLineAmount);
                log.debug('linesForDeletion - CREDIT', linesForDeletion.length + ' | ' + linesForDeletion);
                //log.debug('jeLineAmount - DEBIT', jeLineAmount2);
                //log.debug('linesForDeletion - DEBIT', linesForDeletionDebit.length + ' | ' + linesForDeletionDebit);

                //Make sure that the value will be positive.
                jeLineAmount = Math.abs(jeLineAmount);
                //jeLineAmount2 = Math.abs(jeLineAmount2);

                //If the jeLineAmount is not zero, proceed with the field adjustments.
                //Handles the actual adding of the amount, as well as removal of the other fields.
                if(jeLineAmount != 0){
                    for(var x = (linesForDeletion.length - 1); x >= 0; x--){
                        if(x == 0){
                            rcrd.selectLine({ sublistId: 'line', line: linesForDeletion[x]});
                            rcrd.setCurrentSublistValue({
                                sublistId: 'line',
                                fieldId: 'credit',
                                line: linesForDeletion[x],
                                value: (rcrd.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: linesForDeletion[x]}) + jeLineAmount)
                            });
                            rcrd.commitLine({ sublistId: 'line'});
                            log.debug('Last line on line ' + linesForDeletion[x], 'adjusted to ' + rcrd.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: linesForDeletion[x]}));
                        }
                        else{
                            rcrd.removeLine({ sublistId: 'line', line: linesForDeletion[x], ignoreRecalc: false});
                            //log.debug('Removed line on line ' + linesForDeletion[x], 'deleted.');
                        }
                    }
                }

                rcrd.setValue({ fieldId: 'custbody_is_book_specific_je_updated', value: false});
                rcrd.save();
                log.debug('Record has been saved.', rcrd);
            }
        }
        catch(e){
            log.error('Error', e);
        }
        log.debug('End afterSumbit', '=== END === ');
    }

    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
