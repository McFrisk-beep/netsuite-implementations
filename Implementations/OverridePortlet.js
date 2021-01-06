/**
 * @NApiVersion 2.x
 * @NScriptType Portlet
 * @NModuleScope SameAccount
 */
define([],

function() {
   
    /**
     * Definition of the Portlet script trigger point.
     * 
     * @param {Object} params
     * @param {Portlet} params.portlet - The portlet object used for rendering
     * @param {number} params.column - Specifies whether portlet is placed in left (1), center (2) or right (3) column of the dashboard
     * @param {string} params.entity - (For custom portlets only) references the customer ID for the selected customer
     * @Since 2015.2
     */
    function render(params) {
        params.portlet.title = 'My Portlet';
        var content = "<td><span><b>Hello!!!</b></span></td><script>if(document.readyState=='complete')document.getElementsByClassName('ns-portlet-wrapper ns-portlet-window-state-normal')[1].hidden=true;</script>";
        
        params.portlet.html = content;
    }

    return {
        render: render
    };
    
});
