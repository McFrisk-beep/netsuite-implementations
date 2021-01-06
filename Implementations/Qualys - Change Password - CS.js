/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/dialog'],
/**
 * @param {record} record
 */
function(record, dialog) {
    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	var currRec = scriptContext.currentRecord;
    	//log.debug('fieldChangeFunc', 'In fieldChangeFunction');
    	
    	var isManual = currRec.getValue('fillpassword');
    	
    	if(scriptContext.sublistId == 'contactroles' && scriptContext.fieldId == 'giveaccess'){
        	var currLine = currRec.getCurrentSublistIndex({ sublistId: 'contactroles'});
        	var giveAccess = currRec.getCurrentSublistValue({ sublistId: 'contactroles', fieldId: 'giveaccess'});
        	log.debug('Give access?', giveAccess);
        	
    		var contactId = currRec.getSublistValue({ sublistId: 'contactroles', fieldId: 'contact', line: currLine});
    		log.debug('contact', contactId);
    		var contactRoleNewPassword = currRec.getValue({ fieldId: 'custentity_contact_role_new_passwd'});
    		log.debug('contactRoleNewPassword', contactRoleNewPassword);
    		
    		if(giveAccess){
    			log.debug('if', 'in if');
    			var contactRoleNewPassword = currRec.getValue({ fieldId: 'custentity_contact_role_new_passwd'});
    			log.debug('contactRoleNewPassword', contactRoleNewPassword);
    			if(contactRoleNewPassword.indexOf(contactId) < 0){
    				if(contactRoleNewPassword == '')
    					contactRoleNewPassword = contactId;
    				else
    					contactRoleNewPassword = contactRoleNewPassword + '|' + contactId;
    				
    				currRec.setValue({ fieldId: 'custentity_contact_role_new_passwd', value: contactRoleNewPassword});
    			}
    			log.debug('mkpass', 'calling mkpass');
    			
    			var passwd = mkpass();
    			currRec.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'password', value: passwd});
    			currRec.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'passwordconfirm', value: passwd});
    			//log.debug('record type', currRec.type);
    			if(currRec.type == 'customer')
    				currRec.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'role', value: '1093'});
    			
    			log.debug('Password | Confirm password', currRec.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'password'}) + ' | ' + currRec.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'passwordconfirm'}));
    		}
    		else{
    			log.debug('if', 'in else');
    			if(contactRoleNewPassword.indexOf(contactId) >= 0){
    				contactRoleNewPassword = contactRoleNewPassword.replace(contactRoleNewPassword + '|', '');
    				contactRoleNewPassword = contactRoleNewPassword.replace(contactRoleNewPassword, '');
    				currRec.setValue({ fieldId: 'custentity_contact_role_new_passwd', value: contactRoleNewPassword});
        			currRec.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'password', value: ''});
        			currRec.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'passwordconfirm', value: ''});
        			currRec.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'sendemail', value: false, ignoreFieldChange: true});
    			}
    		}
    		
    		var tempStore = '';
    		for(var x = 0; x < currRec.getLineCount({ sublistId: 'contactroles'}); x++){
    			tempStore += currRec.getSublistValue({ sublistId: 'contactroles', fieldId: 'password', line: x}) + ',';
    		}
    		currRec.setValue({ fieldId: 'custentity_nsacs_contactrepo', value: tempStore});
    	}
    	else if(scriptContext.fieldId == 'giveaccess'){
    		
    		log.debug('Customer Access', 'inside');
    		var provAccess = currRec.getValue({ fieldId: 'giveaccess'});
    		currRec.setValue({ fieldId: 'custentity_new_passwd', value: currRec.getValue({ fieldId: 'giveaccess'})});
    		if(provAccess){
    			var hasPassword = currRec.getValue({ fieldId: 'password'});
    			if(hasPassword == '' || hasPassword == null){
        			var passwd = mkpass();
        			currRec.setValue({ fieldId: 'password', value: passwd});
        			currRec.setValue({ fieldId: 'password2', value: passwd});
        			if(currRec.type == 'customer')
        				currRec.setText({ fieldId: 'accessrole', text: 'Qualys Customer Center - AR'});
        			currRec.setValue({ fieldId: 'custentity_previous_password', value: passwd});
    			}
    			else{
    				currRec.setValue({ fieldId: 'custentity_previous_password', value: currRec.getValue({ fieldId: 'password'})});
    			}
    		}
    		else{
    			currRec.setValue({ fieldId: 'password', value: ''});
    			currRec.setValue({ fieldId: 'password2', value: ''});
    			currRec.setValue({ fieldId: 'sendemail', value: false});
    		}
    	}
    	else if(isManual && scriptContext.fieldId == 'password'){
    		currRec.setValue({ fieldId: 'custentity_previous_password', value: currRec.getValue({ fieldId: 'password'})});
    	}
    	else if(scriptContext.sublistId == 'contactroles' && scriptContext.fieldId == 'sendemail'){
    		log.debug('Inside send email condition.');
    		var giveAccess = currRec.getCurrentSublistValue({ sublistId: 'contactroles', fieldId: 'giveaccess'});
    		var sendEmail = currRec.getCurrentSublistValue({ sublistId: 'contactroles', fieldId: 'sendemail'});
    		var pass1 = currRec.getCurrentSublistValue({ sublistId: 'contactroles', fieldId: 'password'});
    		if(sendEmail == true){
    			if(giveAccess == false){
    				currRec.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'sendemail', value: false, ignoreFieldChange: true});
    				dialog.alert({
    		            title: 'Alert',
    		            message: 'Password field is blank! Please check the "Access" checkbox to generate the password.' 
    		        });
    			}
    			else if(pass1 == '' || pass1 == null){
    				currRec.setCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: 'sendemail', value: false, ignoreFieldChange: true});
    				dialog.alert({
    		            title: 'Alert',
    		            message: 'Password field is blank! Please un-check the "Access" checkbox, then re-check again to generate the password.' 
    		        });
    			}
    		}
    	}
    	else if(scriptContext.fieldId == 'sendemail'){
    		var giveAccess = currRec.getValue({ fieldId: 'giveaccess'});
    		var pass = currRec.getValue({ fieldId: 'password'});
    		var sendEmail = currRec.getValue({ fieldId: 'sendemail'});
    		if(sendEmail == true){
    			if(giveAccess == false){
    				currRec.setValue({ fieldId: 'sendemail', value: false});
    				dialog.alert({
    		            title: 'Alert',
    		            message: 'Password field is blank! Please check the "Access" checkbox to generate the password.' 
    		        });
    			}
    			else if(pass == '' || pass == null){
    				currRec.setValue({ fieldId: 'sendemail', value: false});
    				dialog.alert({
    		            title: 'Alert',
    		            message: 'Password field is blank! Please un-check the "Access" checkbox, then re-check again to generate the password.' 
    		        });
    			}
    		}
    	}
    	//log.debug('fieldChangeFunc', 'Out fieldChangeFunction');
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

    function initialize()
    //use actual time to initialize random function as javascript doesn't provide aninitialization function itself
    //to get more random, use getMilliseconds() function
    //don't use getTime() as it produces numbers larger than 1000 billions, eheh
    {
            var count=new Date().getSeconds();
            for (c=0; c<count; c++)
                    Math.random();
    }

    function mkpass()
    {
            //use of initialize() can decrease speed of script. On really slow systems,disable it.
            initialize();

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
        fieldChanged: fieldChanged
    };
    
});
