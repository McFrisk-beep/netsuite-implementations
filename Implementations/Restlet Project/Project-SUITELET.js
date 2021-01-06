/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/error', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/task', 'N/email'],

function(error, record, search, serverWidget, task, email) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
	
    function onRequest(context) {
    	
    	createSearch();
    	
    	if(context.request.method == 'GET'){
    		var form = serverWidget.createForm({
    			title: 'Sales Orders Pending Action',
    			hideNavBar: false
    		});
    		
    		var sublist = form.addSublist({
    			id: 'custpage_table',
    			type: serverWidget.SublistType.LIST,
    			label: 'Sales Orders'
    		});
    		/*sublist.addField({
    			id: 'salesordnum',
    			label: 'SO #',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'customer',
    			label: 'Customer',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'status',
    			label: 'Status',
    			type: serverWidget.FieldType.TEXT
    		});*/
    		sublist.addField({
    			id: 'filename',
    			label: 'File Name',
    			type: serverWidget.FieldType.TEXT
    		});
    		sublist.addField({
    			id: 'fileurl',
    			label: 'URL',
    			type: serverWidget.FieldType.TEXT
    		});
    		
    		//customsearch_pending_so_search
    		var mySearch = search.load({
    			id: 'customsearch677'
    		});
    		var x = 0;
    		mySearch.run().each(function(result){
    			/*sublist.setSublistValue({
    				id: 'salesordnum',
    				line: x,
    				value: result.getValue({
        				name: 'tranid'
        			})
    			});
    			sublist.setSublistValue({
    				id: 'customer',
    				line: x,
    				value: result.getValue({
        				name: 'entity'
        			})
    			});
    			sublist.setSublistValue({
    				id: 'status',
    				line: x,
    				value: result.getValue({
        				name: 'statusref'
        			})
    			});*/
    			sublist.setSublistValue({
    				id: 'filename',
    				line: x,
    				value: result.getValue({
    					name: 'name'
    				})
    			});
    			sublist.setSublistValue({
    				id: 'fileurl',
    				line: x,
    				value: result.getValue({
    					name: 'url'
    				})
    			});
    			
    			x++;
    			return true;
    		});
        	context.response.writePage(form);
    	}
    	else if(context.request.method == 'POST'){
    		
    		//Saved Search
        	/*try{
        	var hasInventoryDetail = search.create({
        		type: search.Type.INVENTORY_ITEM,
        		title: 'Has Inventory Detail',
        		id: 'customsearch_inventory_detail_search',
        		columns: ['internalid'],
        		filters: [['isserialitem', 'is', 'true'],
        			'or',['islotitem', 'is', 'true']]
        	});
        	hasInventoryDetail.save();
    	}
    	catch(e){
    		
    	}*/
    		
    		//HARD-CODED SOLUTION.....................................
        	/*var invoice = record.transform({
        		fromType: 'salesorder',
        		fromId: '9732',
        		toType: 'invoice',
        		isDynamic: true
        	});
        	
        	invoice.setValue({
        		fieldId: 'custbody_ns_pos_total_tendered',
        		value: invoice.getValue({
        			fieldId: 'total'
        		})
        	});
        	
        	invoice.save();*/
    		//END...................................................
        	
        	
    		var mapreduceID = 'customscript838';
    		log.audit('mapreduce id: ', mapreduceID);
    		
    		var mrTask = task.create({
    			taskType: task.TaskType.MAP_REDUCE,
    			scriptId: mapreduceID,
    			deploymentId: 'customdeploy1'
    		});
    		
    		var mrTaskId = mrTask.submit();
    		
    		var taskStatus = task.checkStatus(mrTaskId);
    		if(taskStatus.status == 'FAILED'){
    			var authorId = '3';
    			var recipientEmail = 'rbaligod@netsuite.com';
    			email.send({
    				author: authorId,
    				recipients: recipientEmail,
    				subject: 'Map/Reduce Job failed.',
    				body: 'Map reduce task: ' + mapreduceId + ' has failed.'
    			});
    		}
    	}
    	
    }

    return {
        onRequest: onRequest
    };
    
    
    /*****************YEET*****************************/
    function createSearch(){
    	
    	var salesOrderSearch = search.create({
    		type: search.Type.SALES_ORDER,
    		title: 'Pending Sales Orders',
    		id: 'customsearch_pending_so_search',
    		columns: ['tranid', 'entity', 'statusref'],
    		filters: [
    			['mainline', 'is', 'T'],
    			'and',
    			['status', 'is', 'SalesOrd:B']
    		]
    	});
    	try{
        	salesOrderSearch.save();
    	}
    	catch(e){

    	}
    }
    
});
