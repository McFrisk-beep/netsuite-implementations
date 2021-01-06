/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * 04/13/2018 Kalyani Chintala, NS Case# 2858281
 */
define(['N/record', 'N/redirect', 'N/runtime', 'N/ui/serverWidget', 'N/search', 'SuiteScripts/DSG/ariel_Utility_Functions.js'],
/**
 * @param {record} record
 */
function(record, redirect, runtime, serverWidget, search) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) 
    {
    	log.error('Checking', 'Type: ' + scriptContext.type);
    	if(scriptContext.type == 'copy')
    	{
    		runtime.getCurrentSession().set({name: 'custsession_ue_type', value: 'copy'});
    		
    		//Limit Project field based on customer from project
    		var rec = scriptContext.newRecord;
    		var origProjId = rec.getValue({fieldId: 'custrecord_ns_jp_project'});
    		var clientId = rec.getValue({fieldId: 'custrecord_ns_jp_clientname'});
    		if(clientId != null && clientId != '')
    		{
    			//Add custom Project field
    			var form = scriptContext.form;
    			var projFld = form.addField({id: 'custpage_ns_jp_project', label: 'Project', type: serverWidget.FieldType.SELECT});
    			projFld.isMandatory = true;
    			form.insertField({field: projFld, nextfield: 'custrecord_ns_jp_project'});
    			projFld.addSelectOption({value: ' ', text: ' - Select -'});
    			
    			var origProjFld = form.getField({id: 'custrecord_ns_jp_project'});
    			origProjFld.updateDisplayType({displayType: 'hidden'});
    			
    			var filters = new Array();
    			filters.push(search.createFilter({name: 'parent', operator: search.Operator.ANYOF, values: [clientId]}));
    			filters.push(search.createFilter({name: 'isinactive', operator: search.Operator.IS, values: ['F']}));
    			//filters.push(search.createFilter({name: 'internalidnumber', join: 'custentity_ns_jobprofile', operator: search.Operator.ISEMPTY}));
    			
    			var cols = new Array();
    			cols.push(search.createColumn({name: 'internalid'}));
    			cols.push(search.createColumn({name: 'altname'}));
    			cols.push(search.createColumn({name: 'entityid'}));
    			
    			var projList = getAllRowsFromSearch(search, record.Type.JOB, null, filters, cols);
    			for(var idx=0; projList != null && idx < projList.length; idx++)
    			{
    				var id = projList[idx].getValue({name: 'internalid'});
    				var num = projList[idx].getValue({name: 'entityid'});
    				var name = projList[idx].getValue({name: 'altname'});
    				
    				projFld.addSelectOption({value: id, text: (num + ' ' + name), isSelected: origProjId == id ? true : false});
    			}
    		}
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
    function beforeSubmit(scriptContext) {

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
    function afterSubmit(scriptContext) 
    {
    	if(scriptContext.type == 'create')
    	{
    		var origProj = scriptContext.newRecord.getValue({fieldId: 'custrecord_ns_jp_project'});
        	if(origProj != null && origProj != '')
        	{
        		var projRec = record.load({type: record.Type.JOB, id: origProj});
        		projRec.setValue({fieldId: 'custentity_ns_jobprofile', value: scriptContext.newRecord.id});
        		projRec.save({enableSourcing: false, ignoreMandatoryFields: true});
        		
        		if(!(runtime.getCurrentSession().get({name: 'custsession_ue_type'}) == 'copy'))
        			redirect.toRecord({id: projRec.id, type: record.Type.JOB, isEditMode: false});
        	}
    	}
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
