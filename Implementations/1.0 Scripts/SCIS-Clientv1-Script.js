/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Dec 2018     rbaligod			- Test script for execution in SCIS
 *
 */

function clientPageInit(type){
	nlapiLogExecution('DEBUG', 'Page init', 'works fine.');
}

function clientSaveRecord(){
	nlapiLogExecution('DEBUG', 'Save record', 'works fine.');
    return true;
}

function clientValidateField(type, name, linenum){
	nlapiLogExecution('DEBUG', 'Validate Field', 'works fine.');
    return true;
}

function clientFieldChanged(type, name, linenum){
	nlapiLogExecution('DEBUG', 'Field Change', 'works fine.');
}

function clientPostSourcing(type, name) {
	nlapiLogExecution('DEBUG', 'Post Sourcing', 'works fine.');
}

function clientLineInit(type) {
	nlapiLogExecution('DEBUG', 'Client Line Initialize', 'works fine.');
}

function clientValidateLine(type){
	nlapiLogExecution('DEBUG', 'Validate Line', 'works fine.');
    return true;
}

function clientRecalc(type){
	nlapiLogExecution('DEBUG', 'Recalc', 'works fine.');
}

function clientValidateInsert(type){
	nlapiLogExecution('DEBUG', 'Validate Insert', 'works fine.');
    return true;
}

function clientValidateDelete(type){
	nlapiLogExecution('DEBUG', 'Validate Delete', 'works fine.');
    return true;
}
