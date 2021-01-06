/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/serverWidget', 'N/record'],
/**
 * @param {file} file
 * @param {search} search
 * @param {serverWidget} serverWidget
 * @param {url} url
 */
function(search, serverWidget, record) {
   
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
    			title: 'File Cabinet Folders',
    			hideNavBar: true
    		});
    		var sublist = form.addSublist({
    			id: 'custpage_collectionnotes',
    			type: serverWidget.SublistType.LIST,
    			label: 'Parent Folders'
    		});
    		sublist.addField({
    			id: 'custpage_folderurl',
    			label: 'Folder URL',
    			type: serverWidget.FieldType.TEXT
    		});
    		
    		var lineNum = 0;
    		var url = '';

    		var folderSearch = search.create({
    			type: 'folder',
    			columns: ['internalid']
    		});
    		var filters = new Array();
    		//filters.push(search.createFilter({ name: 'numfiles', operator: search.Operator.GREATERTHAN, values: 0}));
    		filters.push(search.createFilter({ name: 'predecessor', operator: search.Operator.ANYOF, values: '@NONE@'}));
    		folderSearch.filters = filters;
    		folderSearch.run().each(function(result){
    			url = result.getValue({
    				name: 'internalid'
    			});
    			sublist.setSublistValue({
    				id: 'custpage_folderurl',
    				line: lineNum,
    				value: '<html><a href="https://system.na3.netsuite.com/core/media/downloadfolder.nl?id='+url+'&_xt=&_xd=T&e=T">'+url+'</a></html>'
        		});
    			lineNum++;
    			return true;
    		});
    		
    		context.response.writePage(form);
    	}
    	else if(contex.request.method == 'POST'){
    		//do something.
    	}
    }

    return {
        onRequest: onRequest
    };
    
});
