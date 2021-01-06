function TestEmailCapture(request, response){
	var URL_PARAM = request.getParameter('custscript6');
	nlapiLogExecution('DEBUG', 'URL Param:', URL_PARAM);
}

function process(email){
	var saveOnce = false;
	var fromAddress = email.getFrom();
	var subject = email.getSubject();
}