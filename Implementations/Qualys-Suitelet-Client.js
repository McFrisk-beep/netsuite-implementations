/**
 * Copyright (c) 1998-2017 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 * 
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 **/
/**
 * Project: Aldevron
 * Cases: 2757986
 * 
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07/29/2017     mjpascual	   	   initial: 2754148
 *
 */
/**
 * al_CS_WIPItemRecordListSSV2.js
 * @NApiVersion 2.0
 * @NScriptType clientscript
 */

var uooValuesList = new Array();
var prodScaleValsList = new Array();
	
define(['N/ui','N/ui/dialog','N/url','N/format','N/currentRecord', 'N/runtime', 'N/search'],

function(ui,dialog,url,format,currentRecord,runtime,search) {
	
	
	function pageInit(scriptContext) {
    	var objCurrentRecord = scriptContext.currentRecord;
		var disablefld = objCurrentRecord.getField({
			fieldId: 'custpage_salesamt'
		});
		disablefld.isDisabled = true;
    }
	
    /**
     * Function to be executed when field is changed.
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) 
    {
    	
    	//check for dropdown changes.
    	var oCurrentRecord = scriptContext.currentRecord;
    	var fieldId = scriptContext.fieldId;
    	
    	if(fieldId=='custpage_salesorder' && oCurrentRecord.getValue(fieldId) != '-'){
    		var x = search.lookupFields({
				type: search.Type.SALES_ORDER,
				id: oCurrentRecord.getValue(fieldId),
				columns: 'total'
			});
    		
    		oCurrentRecord.setValue({
    			fieldId: 'custpage_salesamt',
    			value: x.total
    		});
    	}
      
    	if(fieldId=='custpage_creditcardselect')
    	{
    		
        	var stSelectId = oCurrentRecord.getValue(fieldId);
        	if(stSelectId == '-') resetField(oCurrentRecord);
        
        	var stObjCCs = oCurrentRecord.getValue('custpage_cclisthidden');
        	var objCCs = JSON.parse(stObjCCs);
       
        	if(objCCs[stSelectId])
        	{
        		var objCC = objCCs[stSelectId];
        		var arrDate = objCC.expDate.split('-');
        		
        		oCurrentRecord.setValue('custpage_ccno', objCC.ccNumber);
        		if(arrDate.length > 0){
        			oCurrentRecord.setValue('custpage_expires', arrDate[1]+'/'+arrDate[0]);
        		}
        		oCurrentRecord.setValue('custpage_nameoncard', objCC.ccHolderName);
        		
        		oCurrentRecord.setValue({fieldId : 'custpage_payment_mtd', value : objCC.ccType, ignoreFieldChange : true});
        		
        	}
       
    	}
    	
    	if(fieldId=='custpage_payment_mtd')
    	{
    		resetField(oCurrentRecord);
    	}

    	
    	
    	return true;

    }
    
    function resetField(oCurrentRecord)
    {
    	oCurrentRecord.setValue('custpage_expires','');
		oCurrentRecord.setValue('custpage_nameoncard','');
		oCurrentRecord.setValue({fieldId : 'custpage_creditcardselect', value :'-', ignoreFieldChange : true});
		oCurrentRecord.setValue('custpage_ccno','');
    }
    
    function inArray(val, arr)
	{   
		var bIsValueFound = false;  
		
		for(var i = 0; i < arr.length; i++)
		{
			if(val == arr[i])
			{
				bIsValueFound = true;        
				break;    
			}
		}
		
		return bIsValueFound;
	}
   
    function saveRecord(scriptContext)
    {
    	var oCurrentRecord = scriptContext.currentRecord;
    
    	//get required values list.
    	//check for required values.

		return true;
    	
    }
    

    return {
    	pageInit : pageInit,
        fieldChanged: fieldChanged,
        saveRecord : saveRecord,
    };
    

});




