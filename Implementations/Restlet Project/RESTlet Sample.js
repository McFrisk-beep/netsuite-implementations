/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/log' ],
		/**
		 * @param {record}
		 *            record
		 */
		function(record, log){
			/**
			 * Function called upon sending a POST request to the RESTlet.
			 * 
			 * @param {string |
			 *            Object} requestBody - The HTTP request body; request
			 *            body will be passed into function as a string when
			 *            request Content-Type is 'text/plain' or parsed into an
			 *            Object when request Content-Type is 'application/json'
			 *            (in which case the body must be a valid JSON)
			 * @returns {string | Object} HTTP response body; return string when
			 *          request Content-Type is 'text/plain'; return Object when
			 *          request Content-Type is 'application/json'
			 * @since 2015.2
			 */
			function doPostit(requestBody) {
				//Payload that comes from the Web Service (JSON Payload)
				var payload = requestBody;
				var rec = record.create({
					type : record.Type.SALES_ORDER,
					isDynamic : true
				});
				try{
					//Get the details from the JSON payload
					for(var property1 in payload.fields) {
						if (property1 == "billingaddress" || property1 == "shippingaddress"){
							var subrec = rec.getSubrecord({
								fieldId : property1
							});
							for (var addrr in payload.fields[property1]){
								subrec.setValue({
									fieldId : addrr,
									value : payload.fields[property1][addrr]
								});
							}
						}
						else{
							//Set value on NetSuite
							rec.setValue({
								fieldId : property1,
								value : payload.fields[property1]
							});
						}
					}
					//Save referenced record
					rec.save();
					return 'Worked well';
				}
				catch (e){
					log.debug(e);
					return e;
				}
			}

			return {
				post : doPostit
			};
		});