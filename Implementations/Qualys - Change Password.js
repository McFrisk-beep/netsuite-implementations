/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/record', 'N/runtime', 'N/email', 'N/search', 'N/url'],
/**
 * @param {email} email
 * @param {record} record
 */
function(email, record, runtime, email, search, url) {
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
    	var currRec = scriptContext.newRecord;
    	if(scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.CREATE){
    		for(var x = 0; x < currRec.getLineCount({ sublistId: 'contactroles'}); x++){
    			log.debug('Send e-mail?', currRec.getSublistValue({ sublistId: 'contactroles', fieldId: 'sendemail', line: x}));
    			var sendemail = currRec.getSublistValue({ sublistId: 'contactroles', fieldId: 'sendemail', line: x});
    			
    			var pass = '';
    			var str = currRec.getValue({ fieldId: 'custentity_nsacs_contactrepo'});
    			var strPass = new Array();
    			var temp = '';
    			for(var y = 0; y < str.length; y++){
    				if(str[y] == ','){
    					strPass.push(temp);
    					temp = '';
    				}
    				else{
    					temp += str[y];
    				}
    			}
    			
    			if(sendemail){
    				//sendPasswordEmail('contact', currRec.getSublistValue({ sublistId: 'contactroles', fieldId: 'contact', line: x}), currRec.getSublistValue({ sublistId: 'contactroles', fieldId: 'password', line: x}));
    				sendPasswordEmail('contact', currRec.getSublistValue({ sublistId: 'contactroles', fieldId: 'contact', line: x}), strPass[x]);
    			}
    		}
    		currRec.setValue({ fieldId: 'custentity_nsacs_contactrepo', value: ''});	//clear generated password
            var sendCustomerMail = currRec.getValue({ fieldId: 'giveaccess'});
            var mainlineNotify = currRec.getValue({ fieldId: 'sendemail'});
            if(sendCustomerMail == true && mainlineNotify == true){
            	var a = currRec.getValue('custentity_previous_password');
            	log.debug('Password: ', a);
            	
              //var passwd = mkpass();
              //currRec.setValue({ fieldId: 'password', value: passwd});
              //currRec.setValue({ fieldId: 'password2', value: passwd});
            	currRec.setValue({ fieldId: 'custentity_previous_password', value: ''});
            	sendPasswordEmail('customer', currRec.getValue({ fieldId: 'id'}), a);
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
    function afterSubmit(scriptContext) {
    	var currRec = scriptContext.newRecord;
    	if(scriptContext.type == scriptContext.UserEventType.EDIT || scriptContext.type == scriptContext.UserEventType.CREATE){
    		var newPassword = convNull(currRec.getValue({ fieldId: 'custentity_new_passwd'}));
    		var contactRoleNewPassword = convNull(currRec.getValue({ fieldId: 'custentity_contact_role_new_passwd'}));
    		log.debug('Checking', 'New Password Flag: ' + newPassword + ', contactRoleNewPassword: ' + contactRoleNewPassword);
    		if(newPassword == 'T' || contactRoleNewPassword != ''){
    			var updRec = record.load({ type: currRec.type, id: currRec.id });
    			if(newPassword == 'T'){
    				var passwd = mkpass();
    				log.debug('New password', 'Get record ID' + currRec.id);
    				updRec.setValue({ fieldId: 'password', value: passwd});
    				updRec.setValue({ fieldId: 'password2', value: passwd});
    				updRec.setValue({ fieldId: 'custentity_new_passwd', value: 'F'});
    				updRec.setValue({ fieldId: 'role', value: '1093'});
    			}
    			
    			if(contactRoleNewPassword != ''){
    				var contactIds = contactRoleNewPassword.split('|');
    				for(var intPos = 0; intPos < contactIds.length; intPos++){
    					var contactId = contactIds[intPos];
    					for(var linePos = 0; linePos < updRec.getLineCount({ sublistId: 'contactroles'}); linePos++){
    						if(updRec.getSublistValue({ sublistId: 'contactroles', fieldId: 'contact', line: linePos}) == contactId){
    							log.debug('Checking', 'contactId: ' + contactId);
    							//var passwd = mkpass();
    							//updRec.setSublistValue({ sublistId: 'contactroles', fieldId: 'password', line: linePos, value: passwd});
    							//updRec.setSublistValue({ sublistId: 'contactroles', fieldId: 'passwordconfirm', line: linePos, value: passwd});
    							//updRec.setSublistValue({ sublistId: 'contactroles', fieldId: 'role', line: linePos, value: '1093'});
    							log.debug('Old Password', 'Get record ID' + currRec.id);
    							log.debug('Checking', 'Contact ID' + contactId);
    						}
    					}
    				}
    				updRec.setValue({ fieldId: 'custentity_contact_role_new_passwd', value: ''});
    			}
    			var retVal = updRec.save({
    				enableSourcing: true,
    				ignoreMandatoryFields: true
    			});
    			log.debug('Checking', 'Ret val: ' + retVal);
    		}
    	}
    }
    
    function sendPasswordEmail(entityType, entityId, password){
    	log.debug('Email', 'entityType - ' + entityType + ' | entityId - ' + entityId + ' | password - ' + password);
    	
    	//Internal ID of the Email template to be used on sending passwords to customers.
    	var tplId = 1915;		//Change Accordingly.
    	
    	var tempLoad = record.load({
    		type: record.Type.EMAIL_TEMPLATE,
    		id: tplId
    	});
    	
    	var tempBody = tempLoad.getValue('content');
    	tempBody = tempBody.replace('[NEW_ACCES_PASSWORD]',password);
    	var scheme = 'https://';	//header URL
    	var originURL = url.resolveDomain({ hostType: url.HostType.APPLICATION });
        var acctId = runtime.accountId;
    	var urlLogin = scheme + originURL + '/app/login/secure/privatelogin.nl?c=' + runtime.accountId;
    	log.debug('urlLogin', urlLogin);
    	log.debug('account id', runtime.accountId);
    	tempBody = tempBody.replace('[CUST_CENTER_LOGIN_URL]', '<a href="' + urlLogin + '">Customer Center Login</a>');
    	tempBody = tempBody.replace('[CUST_CENTER_LOGIN_URL2]', '<a href="' + urlLogin + '">Customer Center Login</a>');
    	
    	log.debug('Content', tempBody);
    	
    	email.send({
    		author: -5,
    		recipients: entityId,
    		subject: tempLoad.getValue('subject'),
    		body: tempBody
    	});
    }
    
    function convNull(value){
    	if(value == null)
    		return '';
    		
    	return value;
    }
    
    // Functions to generate password
    function choice(arg)
    //return random index number in valid range of arg array
    {
            return Math.floor(Math.random()*arg.length);
    }

    function randstr(arg)
    //return random argument of arg array
    {
    var str = '';
    var seed = choice(arg);
            str = arg[seed];
    return str;
    }
    
    function mkpass()
    {
            //password length
            var pass_len=10;

            var cons_lo = ['b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','y','z'];
            var cons_up = ['B','C','D','F','G','H','J','K','L','M','N','P','Q','R','S','T','V','W','X','Y','Z'];
            var hard_cons_lo = ['b','c','d','f','g','h','k','m','p','s','t','v','z'];
            var hard_cons_up = ['B','C','D','F','G','H','K','M','P','S','T','V','Z'];
    		var link_cons_lo = ['h','l','r'];
    		var link_cons_up = ['H','L','R'];
    		var vowels_lo = ['a','e','i','o','u'];
    		var vowels_up = ['A','E','I','U']; //O (letter o) and 0 (number zero) get confused
            var digits = ['1','2','3','4','5','6','7','8','9'];
            var splChar = ['!', '$', '%', '^', '&', '*', '(', ')', '_', '+', '|', '~', '-', '=', '{', '}', '[', ']', ':', ';' , '?'];
            //change at will how many times digits appears in names array. Order doesn't matter
            var names = [cons_lo, cons_up, digits, hard_cons_lo, hard_cons_up, splChar, digits,link_cons_lo,link_cons_up,digits, vowels_lo, splChar, vowels_up, digits];

    		var newpass= '';
            for(i=0; i<pass_len; i++)
            	newpass = newpass + randstr(names[choice(names)]);
    		return newpass;
    }

    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
