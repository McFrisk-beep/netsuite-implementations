/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/log' ],
		/**
		 * @param {record}
		 *            record
		 */
		function(record, log) {

			/**
			 * Function called upon sending a GET request to the RESTlet.
			 * 
			 * @param {Object}
			 *            requestParams - Parameters from HTTP request URL;
			 *            parameters will be passed into function as an Object
			 *            (for all supported content types)
			 * @returns {string | Object} HTTP response body; return string when
			 *          request Content-Type is 'text/plain'; return Object when
			 *          request Content-Type is 'application/json'
			 * @since 2015.1
			 */
			function doGet(requestParams) {

			}

			/**
			 * Function called upon sending a PUT request to the RESTlet.
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
			function doPut(requestBody) {

			}

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
				var payload = requestBody;
				var rec = record.create({
					type : record.Type.SALES_ORDER,
					isDynamic : true
				});
				try {
					for ( var property1 in payload.fields) {
						if (property1 == "billingaddress"
								|| property1 == "shippingaddress") {
							var subrec = rec.getSubrecord({
								fieldId : property1
							});
							for ( var addrr in payload.fields[property1]) {
								subrec.setValue({
									fieldId : addrr,
									value : payload.fields[property1][addrr]
								});
							}
						} else {
							rec.setValue({
								fieldId : property1,
								value : payload.fields[property1]
							});
						}
					}

					var count = payload.item.length;
					var invtSublistCount = 0;
					for (var x = 0; x < count; x++) {
						rec.selectNewLine({
							sublistId : 'item'
						});
						for ( var itemfields in payload.item[x]) {
							if (itemfields == 'inventorydetail') {
								invtSublistCount = payload.item[x][itemfields].length;
								for (var i = 0; i < invtSublistCount; i++) {
									var inventoryLine = rec
											.getCurrentSublistSubrecord({
												sublistId : 'item',
												fieldId : 'inventorydetail'
											});
									for ( var invtory in payload.item[x][itemfields][i]) {
										inventoryLine
												.setCurrentSublistValue({
													sublistId : 'inventoryassignment',
													fieldId : invtory,
													value : payload.item[x][itemfields][i][invtory]
												});
									}
									inventoryLine.commitLine({
										sublistId : 'inventoryassignment'
									});
								}
							} else {
								rec.setCurrentSublistValue({
									sublistId : 'item',
									fieldId : itemfields,
									value : payload.item[x][itemfields]
								});
							}

						}
						rec.commitLine({
							sublistId : 'item'
						});
					}
					rec.save();

					return 'Worked well';
				} catch (e) {
					log.debug(e);
					return e;

				}

			}

			/**
			 * Function called upon sending a DELETE request to the RESTlet.
			 * 
			 * @param {Object}
			 *            requestParams - Parameters from HTTP request URL;
			 *            parameters will be passed into function as an Object
			 *            (for all supported content types)
			 * @returns {string | Object} HTTP response body; return string when
			 *          request Content-Type is 'text/plain'; return Object when
			 *          request Content-Type is 'application/json'
			 * @since 2015.2
			 */
			function doDelete(requestParams) {

			}

			return {
				post : doPostit,
			};

		});