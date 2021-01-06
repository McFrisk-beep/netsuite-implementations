/**
 * 11/06/2013 Kalyani Chintala, DSG Case 36351 04/10/2015 Amod Deshpande, DSG
 * Case 44729 08/30/2017 Kalyani Chintala, DSG Case 2799967 09/16/2017 MJ
 * Pascual, DSG Case 2795442 ACS Case 3124626 8/16/2018 Raphael Baligod,
 */

var calLink = '/app/crm/calendar/calendar.nl?_viewFilter=month&ccal=';
var custLink = '/app/common/entity/custjob.nl?id=';

function service(request, response) {
	// var scriptId = nlapiGetContext().getScriptId();
	// var deployId = nlapiGetContext().getDeploymentId();

	var fromDate = request.getParameter('custpage_fromdate');
	var toDate = request.getParameter('custpage_todate');
	var calType = request.getParameter('custpage_caltype');
	if (calType == null || calType == '')
		calType = 'month';
	var arielPrg = request.getParameterValues('custpage_ariel_prg');
	var acctMgr = request.getParameterValues('custpage_acct_mgr');
	var region = request.getParameterValues('custpage_region');
	var location = request.getParameterValues('custpage_location');

	// nlapiLogExecution('Debug', 'Checking', 'Ariel Prg - ' + arielPrg + ',
	// Acct Mgr - ' + acctMgr + ', Region - ' + region + ', Location - ' +
	// location);

	if (fromDate == null || fromDate == '' || toDate == null || toDate == '') {
		fromDate = new Date();
		toDate = new Date();
		var currentMonth = fromDate.getMonth();
		fromDate.setDate(1);
		var intMonths = 27;
		while (toDate.getMonth() == currentMonth) {
			intMonths++;
			toDate.setDate(intMonths);
		}
		toDate.setDate(0);
		fromDate = nlapiDateToString(fromDate);
		toDate = nlapiDateToString(toDate);
	}
	// nlapiLogExecution('Debug','Checking','Cal Type : ' + calType + ',from
	// date : ' + fromDate + ',to date :' + toDate);

	var fromDt = nlapiStringToDate(fromDate);
	var toDt = nlapiStringToDate(toDate);

	var form = nlapiCreateForm('Company Calendar');
	form.setScript('71');

	form.addField('custpage_fromdate', 'date', 'Start Date'); // .setDisplayType('hidden');
	form.addField('custpage_todate', 'date', 'End Date'); // .setDisplayType('hidden');
	form.addField('custpage_caltype', 'text').setDisplayType('hidden');

	var arielPrgFld = (form.addField('custpage_ariel_prg', 'multiselect',
			'Ariel Program', 'item')).setDisplaySize(350, 5);
	arielPrgFld.setLayoutType('outsidebelow', 'startrow');
	// (form.addField('custpage_acct_mgr', 'multiselect', 'Account Manager',
	// 'employee')).setLayoutType('outsidebelow');
	// Start MJ
	var arielMSFld = form.addField('custpage_acct_mgr', 'multiselect',
			'Account Manager');
	arielMSFld.setLayoutType('outsidebelow');
	var arrEmpList = searchEmployee();
	if (arrEmpList) {
		// nlapiLogExecution('Debug', 'Checking', 'arrEmpList - ' +
		// JSON.stringify(arrEmpList));

		for (var idx = 0; idx < arrEmpList.length; idx++) {
			arielMSFld.addSelectOption(arrEmpList[idx].getValue('internalid'),
					arrEmpList[idx].getValue('entityid'));
		}
	}
	// End MJ
	(form.addField('custpage_region', 'multiselect', 'Region',
			'customlist_region')).setLayoutType('outsidebelow');
	(form.addField('custpage_location', 'multiselect', 'Location', 'location'))
			.setLayoutType('outsidebelow');

	form.setFieldValues({
		custpage_fromdate : fromDate,
		custpage_todate : toDate,
		custpage_caltype : calType,
		custpage_ariel_prg : arielPrg,
		custpage_acct_mgr : acctMgr,
		custpage_region : region,
		custpage_location : location
	});

	form.addButton('custpage_prev_btn', 'Previous', 'prevbtn_click();');
	form.addButton('custpage_month_btn', 'Monthly', 'monthbtn_click();');
	form.addButton('custpage_week_btn', 'Weekly', 'weekbtn_click();');
	form.addButton('custpage_next_btn', 'Next', 'nextbtn_click();');

	// var submitBtn = form.addSubmitButton('Search'); //MJ
	// submitBtn.setVisible(false); //MJ

	form.addField('custpage_note', 'label',
			'# Hold Accepted. * Hold Request. @ Hold Declined.').setLayoutType(
			'startrow');

	var subList = form.addSubList('custpage_sublist', 'staticlist', 'Calendar');

	subList.addField('custpage_col1', 'textarea', 'Sunday');
	subList.addField('custpage_col2', 'textarea', 'Monday');
	subList.addField('custpage_col3', 'textarea', 'Tuesday');
	subList.addField('custpage_col4', 'textarea', 'Wednesday');
	subList.addField('custpage_col5', 'textarea', 'Thursday');
	subList.addField('custpage_col6', 'textarea', 'Friday');
	subList.addField('custpage_col7', 'textarea', 'Saturday');

	var filters = new Array();
	var columns = new Array();

	filters.push(new nlobjSearchFilter('custrecord_comp_cal_date', '',
			'within', fromDt, toDt));
	if (arielPrg != null && arielPrg != '')
		filters.push(new nlobjSearchFilter('custentity43',
				'custrecord_comp_cal_project', 'anyof', arielPrg));
	if (acctMgr != null && acctMgr != '')
		filters.push(new nlobjSearchFilter('custentity_account_manager',
				'custrecord_comp_cal_project', 'anyof', acctMgr));
	if (region != null && region != '')
		filters.push(new nlobjSearchFilter('custentity_projectregion',
				'custrecord_comp_cal_project', 'anyof', region));
	if (location != null && location != '')
		filters.push(new nlobjSearchFilter('custentity_ag_entitylocation',
				'custrecord_comp_cal_project', 'anyof', location));

	var dateCol = new nlobjSearchColumn('custrecord_comp_cal_date');
	dateCol.setSort();

	var projCol = new nlobjSearchColumn('custrecord_comp_cal_project');
	projCol.setSort();

	columns.push(dateCol);
	columns.push(projCol);
	columns.push(new nlobjSearchColumn('custentity_prog_short_code',
			'custrecord_comp_cal_project'));
	columns.push(new nlobjSearchColumn('entityid',
			'custrecord_comp_cal_project'));
	columns.push(new nlobjSearchColumn('companyname',
			'custrecord_comp_cal_project'));
	columns.push(new nlobjSearchColumn('custentity_calendar_data',
			'custrecord_comp_cal_project'));

	columns.push(new nlobjSearchColumn('custentity43',
			'custrecord_comp_cal_project'));
	columns.push(new nlobjSearchColumn('custentity_projstartdate',
			'custrecord_comp_cal_project'));
	columns.push(new nlobjSearchColumn('custentity_ag_vpresdate2',
			'custrecord_comp_cal_project'));
	columns.push(new nlobjSearchColumn('custentity_ag_vpresdate3',
			'custrecord_comp_cal_project'));

	var list = nlapiSearchRecord('customrecord_company_cal', '', filters,
			columns);

	var currDt = fromDt;
	var linePos = 1, dataTracker = 1;
	while (currDt <= toDt) {
		var currDay = currDt.getDay(), idx = 0;
		// nlapiLogExecution('Error', 'Checking', 'CurrDay: ' + currDay + ',
		// Curr Dt: ' + nlapiDateToString(currDt));

		var returnArray = getDataForDate(currDt, list);

		// Modified per Case 2672961 & 2799967
		if (currDay == 0) {
			for (idx = 0; idx < returnArray.length; idx++) {
				// nlapiLogExecution('Error', 'Checking', 'Adding data for:
				// custpage_col1 on line: ' + (linePos + idx));
				subList.setLineItemValue('custpage_col1', linePos + idx,
						returnArray[idx]);
			}
			var tmpDataTracker = linePos + (idx - 1);
			if (dataTracker < tmpDataTracker)
				dataTracker = tmpDataTracker;
		} else if (currDay == 1) {
			for (idx = 0; idx < returnArray.length; idx++) {
				// nlapiLogExecution('Error', 'Checking', 'Adding data for:
				// custpage_col2 on line: ' + (linePos + idx));
				subList.setLineItemValue('custpage_col2', linePos + idx,
						returnArray[idx]);
			}
			var tmpDataTracker = linePos + (idx - 1);
			if (dataTracker < tmpDataTracker)
				dataTracker = tmpDataTracker;
		} else if (currDay == 2) {
			for (idx = 0; idx < returnArray.length; idx++) {
				// nlapiLogExecution('Error', 'Checking', 'Adding data for:
				// custpage_col3 on line: ' + (linePos + idx));
				subList.setLineItemValue('custpage_col3', linePos + idx,
						returnArray[idx]);
			}
			var tmpDataTracker = linePos + (idx - 1);
			if (dataTracker < tmpDataTracker)
				dataTracker = tmpDataTracker;
		} else if (currDay == 3) {
			for (idx = 0; idx < returnArray.length; idx++) {
				// nlapiLogExecution('Error', 'Checking', 'Adding data for:
				// custpage_col4 on line: ' + (linePos + idx));
				subList.setLineItemValue('custpage_col4', linePos + idx,
						returnArray[idx]);
			}
			var tmpDataTracker = linePos + (idx - 1);
			if (dataTracker < tmpDataTracker)
				dataTracker = tmpDataTracker;
		} else if (currDay == 4) {
			for (idx = 0; idx < returnArray.length; idx++) {
				// nlapiLogExecution('Error', 'Checking', 'Adding data for:
				// custpage_col5 on line: ' + (linePos + idx));
				subList.setLineItemValue('custpage_col5', linePos + idx,
						returnArray[idx]);
			}
			var tmpDataTracker = linePos + (idx - 1);
			if (dataTracker < tmpDataTracker)
				dataTracker = tmpDataTracker;
		} else if (currDay == 5) {
			for (idx = 0; idx < returnArray.length; idx++) {
				// nlapiLogExecution('Error', 'Checking', 'Adding data for:
				// custpage_col6 on line: ' + (linePos + idx));
				subList.setLineItemValue('custpage_col6', linePos + idx,
						returnArray[idx]);
			}
			var tmpDataTracker = linePos + (idx - 1);
			if (dataTracker < tmpDataTracker)
				dataTracker = tmpDataTracker;
		} else if (currDay == 6) {
			for (idx = 0; idx < returnArray.length; idx++) {
				// nlapiLogExecution('Error', 'Checking', 'Adding data for:
				// custpage_col7 on line: ' + (linePos + idx));
				subList.setLineItemValue('custpage_col7', linePos + idx,
						returnArray[idx]);
			}
			var tmpDataTracker = linePos + (idx - 1);
			if (dataTracker < tmpDataTracker)
				dataTracker = tmpDataTracker;
			dataTracker++;
			linePos = dataTracker;
		}
		// nlapiLogExecution('Error', 'Checking', 'Data Tracker: ' + dataTracker
		// + ', Line: ' + linePos);
		currDt = nlapiAddDays(currDt, 1);
	}

	var suiteletUrl = nlapiResolveURL('SUITELET', nlapiGetContext()
			.getScriptId(), nlapiGetContext().getDeploymentId());

	// Start MJ
	// form.addButton('custpage_refresh', 'Refresh', "setWindowChanged(window,
	// false); window.location = '" + suiteletUrl + "';");
	form.addButton('custpage_refresh', 'Reset',
			"setWindowChanged(window, false); window.location = '"
					+ suiteletUrl + "';");
	// form.addResetButton('Refresh');
	form.addSubmitButton('Submit'); // Replace Refresh with Submit
	// End MJ

	response.writePage(form);
}

function pageInit() {
	// document.getElementById('tbl_submitter').style.display='none';
	// document.getElementById('tbl_secondarysubmitter').style.display='none';
	var tblEle = document.getElementById('custpage_sublist_splits');
	if (tblEle != null && tblEle != '') {
		var trEles = tblEle.rows;
		if (trEles != null && trEles != '') {
			var reqTrId = 'custpage_sublistheader';
			for (var idx = 0; idx < trEles.length; idx++) {
				if (trEles[idx].id == reqTrId) {
					var tdNodes = trEles[idx].childNodes;
					if (tdNodes != null && tdNodes != '') {
						for (var idxC = 0; idxC < tdNodes.length; idxC++) {
							tdNodes[idxC].onclick = function() {
							};
						}
					}
					break;
				}
			}
		}
	}
}
function prevbtn_click() {

	var newFromDate = nlapiStringToDate(nlapiGetFieldValue('custpage_fromdate'));
	var toDate;
	if (nlapiGetFieldValue('custpage_caltype') == 'month') {
		newFromDate.setDate(1);

		newFromDate = nlapiAddMonths(newFromDate, -1);
		newToDate = nlapiAddMonths(newFromDate, 1);

		newToDate.setDate(0);
	} else {
		newFromDate = nlapiAddDays(newFromDate, -7);
		if (newFromDate.getDay() != 0) {
			var diffToSunDay = 7 - newFromDate.getDay();
			newFromDate = nlapiAddDays(newFromDate, diffToSunDay);
		}
		newToDate = nlapiAddDays(newFromDate, 6);
	}
	nlapiSetFieldValue('custpage_fromdate', nlapiDateToString(newFromDate));
	nlapiSetFieldValue('custpage_todate', nlapiDateToString(newToDate));

	document.getElementById('submitter').click();
}

function nextbtn_click() {

	var newFromDate = nlapiStringToDate(nlapiGetFieldValue('custpage_fromdate'));
	var toDate;
	if (nlapiGetFieldValue('custpage_caltype') == 'month') {
		newFromDate.setDate(1);

		newFromDate = nlapiAddMonths(newFromDate, 1);
		newToDate = nlapiAddMonths(newFromDate, 1);

		newToDate.setDate(0);
	} else {
		newFromDate = nlapiAddDays(newFromDate, 7);
		if (newFromDate.getDay() != 0) {
			var diffToSunDay = 7 - newFromDate.getDay();
			newFromDate = nlapiAddDays(newFromDate, diffToSunDay);
		}
		newToDate = nlapiAddDays(newFromDate, 6);
	}
	nlapiSetFieldValue('custpage_fromdate', nlapiDateToString(newFromDate));
	nlapiSetFieldValue('custpage_todate', nlapiDateToString(newToDate));

	document.getElementById('submitter').click();
}

function monthbtn_click() {

	var newFromDate = nlapiStringToDate(nlapiGetFieldValue('custpage_fromdate'));
	newFromDate.setDate(1);
	var currentMonth = newFromDate.getMonth();
	var newToDate = nlapiAddMonths(newFromDate, 1);

	newToDate.setDate(0);
	nlapiSetFieldValue('custpage_caltype', 'month');
	nlapiSetFieldValue('custpage_fromdate', nlapiDateToString(newFromDate));
	nlapiSetFieldValue('custpage_todate', nlapiDateToString(newToDate));

	document.getElementById('submitter').click();
}

function weekbtn_click() {

	var newFromDate = nlapiStringToDate(nlapiGetFieldValue('custpage_fromdate'));

	if (newFromDate.getDay() != 0) {
		var diffToSunDay = 7 - newFromDate.getDay();
		newFromDate = nlapiAddDays(newFromDate, diffToSunDay);
	}
	var newToDate = nlapiAddDays(newFromDate, 6);
	nlapiSetFieldValue('custpage_caltype', 'week');
	nlapiSetFieldValue('custpage_fromdate', nlapiDateToString(newFromDate));
	nlapiSetFieldValue('custpage_todate', nlapiDateToString(newToDate));
	document.getElementById('submitter').click();
}

function getDataForDateOld(currDt, list) {
	var br = '<br>';

	var monthNames = [ "January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December" ];

	var dateStr = currDt.getDate();
	if (currDt.getDate() == 1) {
		dateStr = monthNames[currDt.getMonth()] + ' ' + dateStr;
	}
	var data = dateStr + br + br;
	if (list == null || list.length <= 0) {
		return data;
	}
	var intPos = 0;
	var currDate = nlapiDateToString(currDt);
	for (intPos = 0; intPos < list.length; intPos++) {
		if (currDate == list[intPos].getValue('custrecord_comp_cal_date'))
			break;
	}
	if (intPos >= list.length) {
		return data;
	}

	while (list[intPos].getValue('custrecord_comp_cal_date') == currDate) {
		var rec = list[intPos];
		var calData = rec.getValue('custentity_calendar_data',
				'custrecord_comp_cal_project');
		if (calData == null)
			calData = '';

		var tmpData = '<a href="' + custLink
				+ rec.getValue('custrecord_comp_cal_project') + '">'
				+ rec.getText('custrecord_comp_cal_project') + '</a>';
		// data += '<a href="' + custLink +
		// rec.getValue('custrecord_comp_cal_project') + '">' +
		// rec.getText('custrecord_comp_cal_project') + '</a>';
		if (rec.getValue('custentity_prog_short_code',
				'custrecord_comp_cal_project') != ''
				&& rec.getValue('custentity_prog_short_code',
						'custrecord_comp_cal_project') != null)
			calData = rec.getValue('custentity_prog_short_code',
					'custrecord_comp_cal_project')
					+ ' ' + calData;
		if (calData != null && calData != '') {
			tmpData += '<br>' + calData + '<br><br>';
			// data += '<br>' + calData + '<br><br>';
		} else {
			tmpData += '<br><br>';
			// data += '<br><br>' ;
		}

		if ((data + tmpData).length > 4000)
			break;
		else
			data += tmpData;

		intPos++;
		if (intPos >= list.length) {
			break;
		}
	}
	return data;
}

// Start MJ
function searchEmployee() {
	var filters = new Array();
	var columns = new Array();

	var employeeList = nlapiSearchRecord('employee', 'customsearch_emp_filter',
			filters, columns);

	return employeeList;
}
// End MJ

function getDataForDate(currDt, list) {
	var returnArray = new Array();

	var br = '<br>';

	var monthNames = [ "January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December" ];

	var dateStr = currDt.getDate();
	if (currDt.getDate() == 1) {
		dateStr = monthNames[currDt.getMonth()] + ' ' + dateStr;
	}
	var data = '<b>' + dateStr + '</b>' + br + br;
	if (list == null || list.length <= 0) {
		returnArray.push(data);
		return returnArray;
	}
	var intPos = 0;
	var currDate = nlapiDateToString(currDt);
	for (intPos = 0; intPos < list.length; intPos++) {
		if (currDate == list[intPos].getValue('custrecord_comp_cal_date'))
			break;
	}
	if (intPos >= list.length) {
		returnArray.push(data);
		return returnArray;
	}
	
	var copyData = '';
	while (list[intPos].getValue('custrecord_comp_cal_date') == currDate) {
		var rec = list[intPos];
		var calData = rec.getValue('custentity_calendar_data',
				'custrecord_comp_cal_project');
		if (calData == null)
			calData = '';

		var tmpData = '<a href="' + custLink
				+ rec.getValue('custrecord_comp_cal_project') + '">'
				+ rec.getText('custrecord_comp_cal_project') + '</a>';
		// data += '<a href="' + custLink +
		// rec.getValue('custrecord_comp_cal_project') + '">' +
		// rec.getText('custrecord_comp_cal_project') + '</a>';

		if (rec.getValue('custentity_prog_short_code',
				'custrecord_comp_cal_project') != ''
				&& rec.getValue('custentity_prog_short_code',
						'custrecord_comp_cal_project') != null) {
			calData = rec.getValue('custentity_prog_short_code',
					'custrecord_comp_cal_project')
					+ ' ' + calData;
		}

		if ((calData != null || calData != '')
				&& (rec.getValue('custentity_prog_short_code',
						'custrecord_comp_cal_project') == '' || rec.getValue(
						'custentity_prog_short_code',
						'custrecord_comp_cal_project') == null)) {

			if (rec.getValue('custentity43', 'custrecord_comp_cal_project') == '199') {
				if (rec.getValue('custentity_projstartdate',
						'custrecord_comp_cal_project') == currDate
						|| rec.getValue('custentity_ag_vpresdate2',
								'custrecord_comp_cal_project') == currDate
						|| rec.getValue('custentity_ag_vpresdate3',
								'custrecord_comp_cal_project') == currDate) {
					calData = rec.getValue('custentity_prog_short_code',
							'custrecord_comp_cal_project')
							+ ' ' + calData;
					tmpData += '<br><br>';
				} else {
					tmpData = '';
					nlapiLogExecution('DEBUG',
							'calData is null and shortcode is null', currDate
									+ ': '
									+ rec.getValue('custentity43',
											'custrecord_comp_cal_project'));
				}
			} else if (rec.getValue('custentity43',
					'custrecord_comp_cal_project') != '199'
					|| rec.getValue('custentity43',
							'custrecord_comp_cal_project') == ''
					|| rec.getValue('custentity43',
							'custrecord_comp_cal_project') == null) {
				calData = rec.getValue('custentity_prog_short_code',
						'custrecord_comp_cal_project')
						+ ' ' + calData;
				tmpData += '<br>' + calData + '<br><br>';

				nlapiLogExecution('DEBUG', 'custentity43', intPos
						+ ': '
						+ rec.getValue('custentity43',
								'custrecord_comp_cal_project'));
			}

		} else
			tmpData += '<br><br>';

		/*
		 * if (calData != null && calData != '') tmpData += '<br>' + calData + '<br><br>';
		 * else tmpData += '<br><br>';
		 */

		// JSON.stringify(list[intPos]) - search result
		
		if(copyData != tmpData){
			if ((data + tmpData).length > 4000) {
				returnArray.push(data);
				data = '<b>' + dateStr + '</b>' + br + br;
				data += tmpData;
			} else
				data += tmpData;
		}
		copyData = tmpData;

		intPos++;
		if (intPos >= list.length) {
			break;
		}
	}
	returnArray.push(data);
	return returnArray;
}