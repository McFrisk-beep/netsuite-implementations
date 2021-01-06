/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['./escodegen.browser', './esprima','N/record', 'N/search', './NS_ESM_SSConverter_Const', './NS_ESM_SSConverter_Lib', './NS_ESM_Common', 'N/log','N/currentRecord'],
/**
 * @param {runtime} runtime
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(esprima, escodegen, record, search, CONST, LIB, ESM, log, currentRecord) {
    
	var passedContext;
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	//pass the scriptContext to the passedContext processor
    	passedContext = scriptContext.currentRecord;
    }
    
    
    function convertScript(){
    	try{
        	var objCurrentRecord = passedContext;
    		var x = LIB.convert({
    			src		: objCurrentRecord.getValue({ fieldId: 'custpage_scriptin'}),
    			type	: objCurrentRecord.getValue({ fieldId: 'custpage_scripttype'}),
    			textadhoc : true
    		});
    		objCurrentRecord.setValue({ fieldId: 'custpage_scriptout', value: x});
    		//objCurrentRecord.setValue({ fieldId: 'custpage_scriptout', value: 'TEST'});
    	}
    	catch(e){
    		
    	}
    }

    return {
        pageInit: pageInit,
        convertScript: convertScript
    };
    
});
