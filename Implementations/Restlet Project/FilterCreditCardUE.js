/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/runtime', 'N/search', 'N/ui/dialog', 'N/log' ],
		/**
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 * @param {dialog}
		 *            dialog
		 */
		function(record, runtime, search, dialog, log) {

			/**
			 * Function definition to be triggered before record is loaded.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.newRecord - New record
			 * @param {string}
			 *            scriptContext.type - Trigger type
			 * @param {Form}
			 *            scriptContext.form - Current form
			 * @Since 2015.2
			 */
			function beforeLoad(scriptContext) {
	        	if(scriptContext.type == scriptContext.UserEventType.EDIT){
	                	scriptContext.form.getField('ccname').updateDisplayType({
	                		displayType: 'disabled'
	                	});
	        	}
	        	else if(scriptContext.type == scriptContext.UserEventType.CREATE){
	                	scriptContext.form.getField('ccname').updateDisplayType({
	                		displayType: 'disabled'
	                	});
	        	}
	        	else if(scriptContext.type == scriptContext.UserEventType.COPY){
	                	scriptContext.form.getField('ccname').updateDisplayType({
	                		displayType: 'disabled'
	                	});
	        	}
	        	
				log.error('Note', 'beforeload went here.');
			}

			/**
			 * Function definition to be triggered before record is loaded.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.newRecord - New record
			 * @param {Record}
			 *            scriptContext.oldRecord - Old record
			 * @param {string}
			 *            scriptContext.type - Trigger type
			 * @Since 2015.2
			 */
			function beforeSubmit(scriptContext) {
					var firstnameLookup = search.lookupFields({
						type : 'customer',
						id : runtime.getCurrentUser(),
						columns : 'firstname'
					});
					var lastnameLookup = search.lookupFields({
						type : 'customer',
						id : runtime.getCurrentUser(),
						columns : 'lastname'
					});

					var rcrd = scriptContext.newRecord;

					// ---------LOGIC BEGIN
					if (rcrd.getValue({
						fieldId : 'ccname'
					}) == (firstnameLookup + ' ' + lastnameLookup)) {
						/*dialog.alert({
									title : 'Credit Card Selection',
									message : 'Please select a Credit Card assigned to your account.'
								});*/
						log.error('Note', (firstnameLookup + ' ' + lastnameLookup));
					} else {
						/*dialog.alert({
							title : 'Credit Card Selection',
							message : runtime.getCurrentUser().id
						});*/
						
						log.error('Note', (firstnameLookup + ' ' + lastnameLookup));
					}
			}

			/**
			 * Function definition to be triggered before record is loaded.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.newRecord - New record
			 * @param {Record}
			 *            scriptContext.oldRecord - Old record
			 * @param {string}
			 *            scriptContext.type - Trigger type
			 * @Since 2015.2
			 */
			function afterSubmit(scriptContext) {

			}

			return {
				 beforeLoad: beforeLoad,
				beforeSubmit : beforeSubmit
			// afterSubmit: afterSubmit
			};

		});
