/**
 * @NModuleScope Public
 * @NApiVersion 2.x
 */

/**
 * Copyright (c) 1998-2015 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of NetSuite, Inc. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement
 * you entered into with NetSuite.
 */

/**
 * Module Description
 * Library for SuiteScript conversion from 1.0 to 2.0
 *
 * Version      Date            Author              Remarks
 * 0.1          05 Aug 2017     Marlon Villarama    Initial draft
 *
 **/

        /* './escodegen.browser',
        './esprima', */
        /* escodegen,
        esprima, */
define(
    [
        
        'N/file',
        'N/log',
        'N/record',
        /* 'N/search', */
        
        './NS_ESM_SSConverter_API',
        './NS_ESM_SSConverter_Const',
        './NS_ESM_Common'
    ],
    function (
        
        file,
        log,
        record,
        /* search, */
        
        API,
        CONST,
        ESM
    ) {
        var PREFIX = 'Converter.Lib.';
        
        /* Main Entry Function */
        function _convert(params) {
            if (params.id && params.type) {
                _convertScript(params);
            }
            else if (params.textadhoc == true){
            	return _convertTextAdhoc(params);
            }
            else if (params.adhoc == true) {
                return _convertAdhoc(params);
            }
        }
        
        //*************************************************//
        function _convertTextAdhoc(params){
            var LOG_TITLE = PREFIX + '_convertAdhoc';
            return _convertAdhocCodeToFile({
                textadhoc   : true,
                entries : params.entryFunctions,
                source  : params.src,
                type    : params.type
            });
        }
        
        function _convertAdhocCodeToFile(params) {
            
            if (params.textadhoc === true) {
                astObj  = _parseAST(params.source);
                var LOG_TITLE       = PREFIX + '_convertCodeToFile',
                arrLib,
                astConv,
                astObj,
                convSource,
                fileObj;
                
                //console.log(astObj);
                ESM.log({
                    title       : LOG_TITLE,
                    audit       : 'Converting adhoc source code'
                });
                
                astConv = _traverseTree({
                    ast             : astObj,
                    entryFunctions  : params.entries,
                    objects         : {},
                    source          : params.source,
                    type            : params.type
                });
                
                astConv = _writeAMDWrapper({
                    ast             : astConv.ast,
                    entryFunctions  : params.entries,
                    instances       : astConv.instances,
                    modules         : astConv.modules,
                    type            : params.type
                });
                
                convSource = _writeAMDHeader({ type: params.type }) + _parseAST(astConv, true);
                
                
                /*fileObj = file.create({
                    contents    : convSource,
                    fileType    : CONST.SS2_FILE_TYPE,
                    folder      : params.file.folder,
                    name        : [
                                    params.file.name,
                                    ESM.timeStamp(),
                                    CONST.SS2_FILE_EXT
                                  ].join('')
                });
                
                fileId = fileObj.save();
                
                ESM.log({
                    title       : LOG_TITLE,
                    audit       : 'Created new JS file ' + fileObj.name + ', id=' + fileId
                });*/
                
                //return fileId;
                return convSource;
            }
        }
        //*************************************************//
        
        /* _convertCodeToFile
        Description : 
        Arguments   :   params (Object); properties as follows...
            Name                Type            Description
            entries             Array           List of entry functions for the script being evaluated
            file                Number          Object containing details of the script record
            type                String          Script ID
        Return Type :   Void
        */
        function _convertAdhoc(params) {
            var LOG_TITLE = PREFIX + '_convertAdhoc';
            
            console.log(LOG_TITLE);
            
            return _convertCodeToFile({
                adhoc   : true,
                entries : params.entryFunctions,
                source  : params.src,
                type    : params.type
            });
        }
        
        /* _convertScript
        Description : 
        Arguments   :   params (Object); properties as follows...
            Name                Type            Description
            entries             Array           List of entry functions for the script being evaluated
            file                Number          Object containing details of the script record
            type                String          Script ID
        Return Type :   Void
        */
        function _convertScript(params) {
            var LOG_TITLE       = PREFIX + '_convertScript',
                sources,
                i,
                el;
                /* arrLib          = [], */
            
            ESM.log({
                title   : LOG_TITLE + ' START',
                debug   : 'params=' + JSON.stringify(params),
                audit   : 'Script ID=' + params.id + ', Type=' + CONST.SCRIPT_TYPES[params.type].name
            });
            
            sources = _getScriptSource({ id: params.id, type: params.type });
            
            /* Convert each library file - NOT YET IMPLEMENTED */
            /* for (i = 0, el; el = sources.lib[i] i++) {
                _convertCodeToFile({
                    library : el,
                    folder  : sources.main.folder,
                    src     : el,
                    type    : params.type
                });
            } */
            
            /* Convert main script file */
            _convertCodeToFile({
                entries : sources.entryFunctions,
                file    : sources.file,
                type    : params.type
            });
            
            ESM.log({ title   : LOG_TITLE + ' END' });
        }
        
        /* _convertCodeToFile
        Description : 
        Arguments   :   params (Object); properties as follows...
            Name                Type            Description
            entries             Array           List of entry functions for the script being evaluated
            file                Number          Object containing details of the script record
            type                String          Script ID
        Return Type :   Void
        */
        function _convertCodeToFile(params) {
            var LOG_TITLE       = PREFIX + '_convertCodeToFile',
                arrLib,
                astConv,
                astObj,
                convSource,
                fileId,
                fileObj;
                /* wrapper; */
            
            if (params.adhoc === true) {
                console.log(LOG_TITLE);
                console.log(params.source);
                
                astObj  = _parseAST(params.source);
                
                console.log(astObj);
                ESM.log({
                    title       : LOG_TITLE,
                    audit       : 'Converting adhoc source code'
                });
            }
            else if (params.file && params.file.id) {
                arrLib  = params.arrLib;
                astObj  = _parseAST(params.file.content);
                
                ESM.log({
                    title       : LOG_TITLE,
                    audit       : 'Converting file ID ' + params.file.id + ' - ' + params.file.name
                });
            }
            
            /* Conversion of library files is not yet supported */
            /* if (arrLib) {
                arrLib.push({
                    name        : params.src.name + ESM.timeStamp() + CONST.SS2_FILE_EXT,
                    content     : astObj
                });
            } */
            
            /* Step 1: Convert content to 2.0 - START */
            
            astConv = _traverseTree({
                ast             : astObj,
                entryFunctions  : params.entries,
                objects         : {},
                source          : (params.adhoc === true ? params.source : params.file.content),
                type            : params.type
            });
            
            if (params.adhoc === true) {
                console.log('astConv...');
                console.log(astConv);
            }
            
            astConv = _writeAMDWrapper({
                ast             : astConv.ast,
                entryFunctions  : params.entries,
                instances       : astConv.instances,
                modules         : astConv.modules,
                type            : params.type
            });
            
            convSource = _writeAMDHeader({ type: params.type }) + _parseAST(astConv, true);
            /* Step 1: Convert content to 2.0 - END */
            
            if (params.adhoc === true) {
                console.log('convSource...');
                console.log(convSource);
                return convSource;
            }
            
            /* Step 2: Create file and dump 2.0 code - START */
            fileObj = file.create({
                contents    : convSource,
                fileType    : CONST.SS2_FILE_TYPE,
                folder      : params.file.folder,
                name        : [
                                params.file.name,
                                ESM.timeStamp(),
                                CONST.SS2_FILE_EXT
                              ].join('')
            });
            
            fileId = fileObj.save();
            /* Step 2: Create file and dump 2.0 code - END */
            
            ESM.log({
                title       : LOG_TITLE,
                audit       : 'Created new JS file ' + fileObj.name + ', id=' + fileId
            });
            
            return fileId;
        }
        
        /* _convertCodeToSS2x
        Description : 
        Arguments   :   params (Object); properties as follows...
            Name                Type            Description
            entries             Array           List of entry functions for the script being evaluated
            file                Number          Object containing details of the script record
            type                String          Script ID
        Return Type :   Void
        */
        function _convertCodeToSS2x(params) {
            var LOG_TITLE           = PREFIX + '_convertCodeToSS2x',
                arrArgs             = [],
                astConverter,
                expression,
                identifier,
                moduleInst          = null,
                nodeName,
                reference,
                ss2fn               = '',
                ss2map,
                type,
                o,
                prop,
                s;
            
            ESM.log({ title : LOG_TITLE + ' START' });
            
            type = params.type;
            node = params.node;
            nodeName = params.isAPI === true ? params.node.callee.name : params.node.callee.property.name;
            reference = params.isAPI === true ? API.SS2_API_MAP : API.SS2_OBJ_MAP;
            
            LOG_TITLE += ': ' + nodeName;
            
            params.node.arguments.map(function(x) {
                arrArgs.push(escodegen.generate(x));
            });
            
            ESM.log({
                title       : LOG_TITLE,
                audit       : 'Converting ' + (params.isAPI ? 'API ' : 'function ') +
                                nodeName + ', Args=' + JSON.stringify(arrArgs)
            });
            
            ss2map = reference[nodeName];
            
            moduleInst = ss2map ? API.SS2_MODULES[ss2map.module] : null;
            
            ESM.log({
                title       : LOG_TITLE,
                audit       : 'Module=' + ss2map.module + ', Instance=' + moduleInst
            });
            
            if (moduleInst) {
                ss2fn += moduleInst + '.';
            }
            
            o = {
                args        : arrArgs,
                nlobjs      : params.objects,
                parent      : params.parent,
                type        : type
            };
            ESM.log({
                title       : LOG_TITLE,
                debug       : 'o=' + JSON.stringify(o)
            });
            /* if (params.isAPI == false) {
                o.skip = true;
            } */
            
            s = ss2map.converter(o);
            ESM.log({
                title       : LOG_TITLE,
                audit       : 'Converted string = ' + s
            });
            
            ss2fn += (moduleInst && params.isAPI === false) ? s.substring(2) : s;
            astConverter = esprima.parse(ss2fn);
            
            log.debug(LOG_TITLE, JSON.stringify(params.node));
            
            for (prop in params.node) {
                if (params.node.hasOwnProperty(prop)) {
                    /* log.debug(LOG_TITLE, 'deleting prop ' + prop + ' = ' + params.node[prop]); */
                    delete params.node[prop];
                }
            }
            
            for (prop in astConverter.body[0].expression) {
                /* log.debug(LOG_TITLE, prop + '=' + JSON.stringify(astConverter.body[0].expression[prop])); */
                if (astConverter.body[0].expression.hasOwnProperty(prop)) {
                    params.node[prop] = astConverter.body[0].expression[prop];
                }
            }
            
            /* if (params.isAPI === false) {
                expression = astConverter.body[0].expression;
                
                if (expression.type == CONST.JSEXP.CallExpression) {
                    identifier = params.node.callee.object.name;
                    log.debug(LOG_TITLE, 'identifier=' + identifier);
                    params.node.callee.object.name = identifier;
                }
                else if (expression.type == CONST.JSEXP.AssignmentExpression &&
                    expression.left.type == CONST.JSEXP.MemberExpression) {
                    
                    identifier = params.node.left.object.name;
                    log.debug(LOG_TITLE, 'identifier=' + identifier);
                    if (params.node.left.object.object) {
                        params.node.left.object.object.name = identifier;
                    }
                    else {
                        params.node.left.object.name = identifier;
                    }
                }
                
            } */
            
            ESM.log({
                title       : LOG_TITLE + 'END',
                debug       : 'converted=' + JSON.stringify(params.node),
                audit       : 'Done converting ' + (params.isAPI ? 'API ' : 'function ') +
                                nodeName + ', Args=' + JSON.stringify(arrArgs)
            });
            
            return {
                fn      : ss2fn,
                instance: moduleInst,
                module  : ss2map.module,
                object  : o.object,
                skip    : o.skip
            };
        }
        
        /* _getEntryFunctions
        */
        function _getEntryFunctions(script) {
            var LOG_TITLE   = PREFIX + 'getEntryFunctions',
                arr         = {},
                entryRef,
                fn;
            
            entryRef = CONST.SCRIPT_TYPES[script.type].entry;
            
            for(var p in entryRef) {
                if (entryRef.hasOwnProperty(p) == true) {
                    fn = script.getValue({ fieldId: p });
                    
                    if (fn) {
                        arr[p] = fn;
                    }
                }
            }
            
            return arr;
        }
        
        /* _getScriptSource
        */
        function _getScriptSource(params) {
            var LOG_TITLE           = PREFIX + '_getScriptSource',
                entryFunctions      = [],
                fileId,
                fileObj,
                libFiles            = [],
                lines,
                scriptRec,
                scriptSource,
                i;
            
            ESM.log({
                title       : LOG_TITLE + ' START',
                debug       : 'params = ' + JSON.stringify(params),
                audit       : 'Script ID=' + params.id + ', Type=' + params.type
            });
            
            scriptRec = record.load({
                id      : params.id,
                type    : params.type
            });
            
            entryFunctions = _getEntryFunctions(scriptRec);
            lines = scriptRec.getLineCount({ sublistId: 'libraries' });
            
            ESM.log({
                title       : LOG_TITLE,
                audit       : 'Found ' + lines + ' library files'
            });
            
            for (i = 0; i < lines; i++) {
                fileId = scriptRec.getSublistValue({
                            sublistId   :   'libraries',
                            fieldId     :   'scriptfile',
                            line        :   i
                        });
                
                fileObj = file.load({ id: fileId });
                libFiles.push({
                    id      :   fileId,
                    name    :   scriptRec.getSublistValue({
                                    sublistId   : 'libraries',
                                    fieldId     : fileObj.name,
                                    line        : i
                                }),
                    content :   fileObj.getContents()
                });
            }
            
            libFiles.map(function (lf) {
                ESM.log({
                    title       : LOG_TITLE,
                    audit       : 'Library file ID=' + lf.id + ', file name=' + lf.name
                });
            });
            
            fileObj =   file.load({ id  : scriptRec.getValue({ fieldId : 'scriptfile' }) });
            
            scriptSource = {
                entryFunctions :   entryFunctions,
                file    :   {
                                id      :   fileObj.id,
                                name    :   fileObj.name.slice(0, -3),
                                content :   fileObj.getContents(),
                                folder  :   fileObj.folder
                            },
                lib     :   libFiles
            };
            
            ESM.log({
                title       : LOG_TITLE + ' END',
                audit       : 'Retrieved data for script ' + params.id
            });
            
            return scriptSource;
        }
        
        /* OK */
        function _insertContextArg(params) {
            var LOG_TITLE       = PREFIX + '.insertContextArg',
                isEntry         = false,
                node,
                p;
            
            ESM.log({
                title       : LOG_TITLE + ' START',
                debug       : 'params=' + JSON.stringify(params)
            });
            
            if (ESM.isEmpty(params.name) === true) {
                ESM.log({
                    title   : LOG_TITLE,
                    audit   : 'Function name is empty.'
                });
                
                return;
            }
            
            if (params.functions.indexOf(params.name) < 0) {
                ESM.log({
                    title       : LOG_TITLE,
                    debug       : params.name + ' not found in ' + JSON.stringify(params.functions),
                    audit       : 'Function ' + params.name + ' is not found in the file'
                });
                
                return;
            }
            
            node = params.node;
            
            for (p in params.entries) {
                if (params.entries[p] == params.name) {
                    if (params.type == CONST.JSEXP.FunctionDeclaration) {
                        params.node.id.name = CONST.SS2_FN_PREFIX + params.name;
                    }
                    
                    isEntry = true;
                    
                    _insertFunctionContext({
                        entry   : true,
                        node    : params.node,
                        type    : params.type
                    });
                }
            }
            
            if (isEntry === false) {
                _insertFunctionContext({
                    entry   : false,
                    node    : params.node,
                    type    : params.type
                });
            }
            
            ESM.log({
                title       : LOG_TITLE + ' END'
            });
        }
        
        /* OK */
        function _insertFunctionContext(params) {
            var LOG_TITLE = PREFIX + '.insertFunctionArgs';
            
            ESM.log({
                title       : LOG_TITLE,
                debug       : 'entry=' + params.entry + ', type=' + params.type
            });
            
            if (params.entry === true) {
                switch (params.node.type) {
                    case CONST.JSEXP.FunctionDeclaration:
                    case CONST.JSEXP.FunctionExpression: {
                        params.node.params = [{
                            type    : CONST.JSEXP.Identifier,
                            name    : CONST.SCRIPT_CONTEXT
                        }];
                        
                        break;
                    }
                    default: {
                        params.node.arguments = [{
                            type    : CONST.JSEXP.Identifier,
                            name    : CONST.SCRIPT_CONTEXT
                        }];
                        break;
                    }
                }
            }
            else {
                switch (params.node.type) {
                    case CONST.JSEXP.FunctionDeclaration:
                    case CONST.JSEXP.FunctionExpression: {
                        params.node.params.unshift({
                            type    : CONST.JSEXP.Identifier,
                            name    : CONST.SCRIPT_CONTEXT
                        });
                        break;
                    }
                    default: {
                        params.node.arguments.unshift({
                            type    : CONST.JSEXP.Identifier,
                            name    : CONST.SCRIPT_CONTEXT
                        });
                        break;
                    }
                }
            }
        }
        
        /* OK */
        function _parseAST(obj, toJS) {
            var LOG_TITLE = PREFIX + '_parseAST';
            
            if (toJS) {
                return escodegen.generate(obj, {
                    format: {
                        indent: {
                            style: '    '
                        },
                        quotes: 'double'
                    }
                });
            }
            else {
                return esprima.parse(obj, {
                    comment     : true,
                    loc         : true,
                    range       : true,
                    tolerant    : true
                });
            }
        }
        
        /* OK */
        function _traverseTree(params) {
            var LOG_TITLE           = PREFIX + '_traverseTree',
                arrFunctions        = [],
                arrInstances        = [],
                arrModules          = [],
                ast                 = params.ast,
                astParams,
                convObj,
                isEntry,
                name,
                nlObjs              = {},
                parent,
                skip                = false,
                type                = params.type;
            
            ESM.log({
                title       : LOG_TITLE,
                debug       : 'entryFunctions=' + JSON.stringify(params.entryFunctions)
            });
            
            /* Traverse through all function declarations */
            _traverseTreeObj(ast, function(node, path) {
                switch(node.type) {
                    case CONST.JSEXP.FunctionDeclaration: {
                        ESM.log({
                            tilte       : LOG_TITLE,
                            debug       : 'FunctionDeclaration: ' + node.id.name,
                            audit       : 'Function ' + node.id.name
                        });
                        arrFunctions.push(node.id.name);
                        
                        _insertContextArg({
                            entries     : params.entryFunctions,
                            functions   : arrFunctions,
                            name        : node.id.name,
                            node        : node,
                            type        : params.type
                        });
                        
                        break;
                    }
                    case CONST.JSEXP.FunctionExpression: {
                        name = '';
                        isEntry = false;
                        parent = path[0];
                        
                        switch (parent.type) {
                            case CONST.JSEXP.AssignmentExpression: {
                                if(parent.left.range) {
                                    name = params.source.slice(parent.left.range[0], parent.left.range[1]);
                                    arrFunctions.push(name);
                                    
                                    ESM.log({
                                        tilte       : LOG_TITLE,
                                        debug       : 'FunctionExpression AssignmentExpression: ' + name,
                                        audit       : 'Function Assignment: ' + name
                                    });
                                }
                                break;
                            }
                            case CONST.JSEXP.VariableDeclarator: {
                                name = parent.id.name;
                                arrFunctions.push(name);
                                
                                ESM.log({
                                    title       : LOG_TITLE,
                                    debug       : 'FunctionExpression VariableDeclarator: ' + name,
                                    audit       : 'Function Variable: ' + name
                                });
                                break;
                            }
                            default: break;
                        }
                        
                        _insertContextArg({
                            entries     : params.entryFunctions,
                            functions   : arrFunctions,
                            name        : name,
                            node        : node,
                            type        : params.type
                        });
                        
                        break;
                    }
                    
                    default: break;
                }
            }, undefined);
            
            ESM.log({
                title       : LOG_TITLE,
                debug       : 'arrFunctions=' + JSON.stringify(arrFunctions)
            });
            
            /* Traverse through all function calls */
            _traverseTreeObj(ast, function(node, path) {
                switch(node.type) {
                    case CONST.JSEXP.CallExpression: {
                        ESM.log({
                            title       : LOG_TITLE,
                            debug       : 'callee=' + JSON.stringify(node.callee),
                            audit       : 'Callee Type=' + node.callee.type
                        });
                        
                        if(node.callee.type == CONST.JSEXP.Identifier) {
                            ESM.log({
                                title       : LOG_TITLE,
                                debug       : 'Identifer = ' + JSON.stringify(node),
                                audit       : 'Identifier = ' + node.callee.name
                            });
                            
                            if (skip === true) {
                                skip = false;
                            }
                            else {
                                if (API.SS2_API_MAP.hasOwnProperty(node.callee.name)) {
                                    /* If this is a SS 1.0 API call, convert */
                                    convObj = _convertCodeToSS2x({
                                        isAPI   : true,
                                        node    : node,
                                        objects : nlObjs,
                                        parent  : path[0],
                                        type    : params.type
                                    });
                                    
                                    skip = convObj.skip;
                                    
                                    ESM.addToArray({
                                        array   : arrModules,
                                        val     : convObj.module
                                    });
                                    
                                    ESM.addToArray({
                                        array   : arrInstances,
                                        val     : convObj.instance
                                    });
                                }
                                else {
                                    /* If this is a call to any other function, insert the context argument */
                                    isEntry = false;
                                    
                                    _insertContextArg({
                                        entries     : params.entryFunctions,
                                        functions   : arrFunctions,
                                        name        : node.callee.name,
                                        node        : node,
                                        type        : params.type
                                    });
                                }
                            }
                        }
                        else if (node.callee.type == CONST.JSEXP.MemberExpression) {
                            // log.debug(LOG_TITLE, 'ME identifier=' + JSON.stringify(node));
                            ESM.log({
                                title       : LOG_TITLE,
                                debug       : 'MemberExpression = ' + JSON.stringify(node),
                                audit       : 'MemberExpression = ' + node.callee.property.name
                            });
                            
                            
                            if (skip === true) {
                                skip = false;
                            }
                            else {
                                if (API.SS2_OBJ_MAP.hasOwnProperty(node.callee.property.name)) {
                                    /* If this is an SS 1.0 object function call, convert */
                                    convObj = _convertCodeToSS2x({
                                        isAPI   : false,
                                        node    : node,
                                        objects : nlObjs,
                                        parent  : path[0],
                                        type    : params.type
                                    });
                                    skip = convObj.skip;
                                    
                                    ESM.addToArray({
                                        array   : arrModules,
                                        val     : convObj.module
                                    });
                                    
                                    ESM.addToArray({
                                        array   : arrInstances,
                                        val     : convObj.instance
                                    });
                                }
                                else {
                                    /* If this is a call to any other function, insert the context argument */
                                    _insertContextArg({
                                        entries     : params.entryFunctions,
                                        functions   : arrFunctions,
                                        name        : node.callee.property.name,
                                        node        : node,
                                        type        : params.type
                                    });
                                }
                            }
                        }
                        break;
                    }
                    case CONST.JSEXP.NewExpression: {
                        ESM.log({
                            title       : LOG_TITLE,
                            debug       : 'callee=' + JSON.stringify(node.callee),
                            audit       : 'New Object=' + node.callee.name
                        });
                        
                        
                        break;
                    }
                    default: break;
                }
            }, undefined);
            
            ESM.log({
                title       : LOG_TITLE + ' END',
                debug       : ('arrModules=' + JSON.stringify(arrModules)),
                audit       : ('SS 2.0 modules used=' + JSON.stringify(arrModules))
            });
            
            return {
                ast         : ast,
                instances   : arrInstances,
                modules     : arrModules,
                params      : astParams
            };
        }
        
        /* OK */
        function _traverseTreeObj(o, v, m) {
            var k,
                c,
                par,
                p;

            par = (typeof m === 'undefined') ? [] : m;
            
            if (v.call(null, o, par) === false) {
                return;
            }
            
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    c = o[k];
                    p = [ o ];
                    p.push(par);
                    
                    if (typeof c === 'object' && c !== null)
                        _traverseTreeObj(c, v, p);
                }
            }
        }
        
        /* OK */
        function _writeAMDHeader(params) {
            var LOG_TITLE,
                header = '',
                dt = new Date(),
                day, month, year,
                pad = '00';
            
            day = dt.getDate();
            month = dt.toLocaleString("en-us", { month: "short" });
            year = dt.getFullYear();
            
            LOG_TITLE = PREFIX + '_writeAMDHeader';
            header += '/**\n' +
                    ' * @NApiVersion 2.0\n' +
                    ' * @NScriptType ' + CONST.SCRIPT_TYPES[params.type].header + '\n' +
                    ' */\n\n';
            
            header += '/**\n' +
                    ' * Copyright (c) 1998-2015 NetSuite, Inc.\n' + 
                    ' * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511\n' +
                    ' * All Rights Reserved.\n' +
                    ' *\n' +
                    ' * This software is the confidential and proprietary information of NetSuite, Inc. ("Confidential Information").\n' +
                    ' * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement\n' +
                    ' * you entered into with NetSuite.\n' +
                    ' */\n\n' +
                    
                    '/**\n' +
                    ' * Module Description\n' +
                    ' *\n' +
                    ' * Version      Date            Author              Remarks\n' +
                    ' * 0.1          ' +
                    (pad.substring(0, pad.length - (day + "").length) + day) + ' ' +
                    month + ' ' +
                    year + '     Auto-generated\n' +
                    ' *\n' +
                    ' **/\n';

            return header;
        }
        
        /* OK */
        function _writeAMDWrapper(params) {
            var LOG_TITLE       = PREFIX + '_writeAMDWrapper',
                arrAST,
                wrapper         = 'define([',
                wrapperAST,
                i, n;
            
            for (i=0, n; n=params.modules[i]; i++) {
                wrapper += JSON.stringify(n);
                
                if (i < (params.modules.length - 1)) {
                    wrapper += ', ';
                }
            }
            
            wrapper += '], function(';
            
            for (i=0, n; n=params.instances[i]; i++) {
                wrapper += n;
                
                if (i < (params.instances.length - 1)) {
                    wrapper += ', ';
                }
            }
            
            wrapper += ') { return { ';
            
            n = 0;
            for (i in params.entryFunctions) {
                if (params.entryFunctions.hasOwnProperty(i) === true) {
                    wrapper += CONST.SCRIPT_TYPES[params.type].entry[i].name + ': ' +
                        params.entryFunctions[i];
                    
                    if (n < (Object.keys(params.entryFunctions).length - 1)) {
                        wrapper += ', ';
                    }
                    
                    n++;
                }
            }
            
            wrapper += ' }; });';
            wrapperAST = _parseAST(wrapper);
            
            for (i=params.ast.body.length-1, n=0; i>=n; --i) {
                wrapperAST.body[0].expression.arguments[1].body.body.unshift(params.ast.body[i]);
            }
            
            ESM.log({
                title   : LOG_TITLE + ' END',
                audit   : 'AMD wrapper = ' + wrapper
            });
            return wrapperAST;
        }
        
        
        return {
            convert         : _convert,
            
        };
    }
);
