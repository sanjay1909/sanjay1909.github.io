if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * A set of static functions intended for use as a JavaScript API.
 *
 * The user interface in Weave is initially generated from a saved session state.
 * User interactions affect the session state, and changes in the session state affect
 * the display at runtime.  The API provides a window into the session state so most
 * interactions that can be made through the GUI can also be made through JavaScript calls.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {
    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(ExternalSessionStateInterface, 'NS', {
        value: 'weavecore'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(ExternalSessionStateInterface, 'CLASS_NAME', {
        value: 'ExternalSessionStateInterface'
    });

    function ExternalSessionStateInterface() {
        this._rootObject = WeaveAPI.globalHashMap;
        this._getObjectFromPathOrVariableName_error = null;

        /**
         * This object maps an expression name to the saved expression function.
         */
        Object.defineProperty(this, '_variables', {
            value: {},
            writable: false
        });
    }

    var p = ExternalSessionStateInterface.prototype;

    /**
     * @inheritDoc
     */
    p.getSessionState = function (objectPath) {
        var object = WeaveAPI.SessionManager.getObject(p._rootObject, objectPath);
        if (object) {
            var state = WeaveAPI.SessionManager.getSessionState(object);
            this._convertSessionStateToPrimitives(state); // do not allow XML objects to be returned
            return state;
        }

        console.log("No ILinkableObject from which to get session state at path {0}", objectPath);
        return null;
    }

    /**
     * This function modifies a session state, converting any nested XML objects to Strings.
     * @param state A session state that may contain nested XML objects.
     */
    p._convertSessionStateToPrimitives = function (state) {
        for (var key in state) {
            var value = state[key];
            this._convertSessionStateToPrimitives(value);
        }
    }

    p.setSessionState = function (objectPath, newState, removeMissingObjects) {
        // default parameter values
        if (removeMissingObjects === undefined) removeMissingObjects = true;
        var object = WeaveAPI.SessionManager.getObject(this._rootObject, objectPath);
        if (object) {
            WeaveAPI.SessionManager.setSessionState(object, newState, removeMissingObjects);
            return true;
        }

        console.log("No ILinkableObject for which to set session state at path {0}", objectPath);
        return false;
    }

    p.getObjectType = function (objectPath) {
        var object = WeaveAPI.SessionManager.getObject(this._rootObject, objectPath);
        if (object)
            return object.constructor.NS + '.' + object.constructor.CLASS_NAME;

        // no warning since getObjectType() may be used to check whether or not an object exists.
        return null;
    }

    p.getChildNames = function (objectPath) {
        var object = WeaveAPI.SessionManager.getObject(this._rootObject, objectPath);
        if (object) {
            if (object instanceof weavecore.LinkableHashMap)
                return object.getNames();
            if (object instanceof weavecore.LinkableDynamicObject)
                return [null];
            return WeaveAPI.SessionManager.getLinkablePropertyNames(object, true);
        }

        console.log("No ILinkableObject for which to get child names at path {0}", objectPath);
        return null;
    }

    p.setChildNameOrder = function (hashMapPath, orderedChildNames) {
        var hashMap = WeaveAPI.SessionManager.getObject(this._rootObject, hashMapPath);
        if (hashMap) {
            // it's ok if there are no names specified, because that wouldn't accomplish anything anyway
            if (orderedChildNames)
                hashMap.setNameOrder(orderedChildNames);
            return true;
        }

        console.log("No ILinkableHashMap for which to reorder children at path {0}", hashMapPath);
        return false;
    }

    p.requestObject = function (objectPath, objectType) {
        // get class definition
        var classDef = eval(objectType);
        if (classDef === null || classDef === undefined) {
            console.log("No class definition for {0}", classQName);
            return false;
        }
        /* if (ClassUtils.isClassDeprecated(classQName))
             externalWarning("{0} is deprecated.", objectType);*/

        // stop if there is no path specified
        if (!objectPath || !objectPath.length) {
            if (this._rootObject.constructor === classDef)
                return true;

            console.log("Cannot request an object at the root path");
            return false;
        }

        // Get parent object first in case there is some backwards compatibility code that gets
        // executed when it is accessed (registering deprecated class definitions, for example).
        var parentPath = objectPath.concat();
        var childName = parentPath.pop();
        var parent = WeaveAPI.SessionManager.getObject(this._rootObject, parentPath);

        // request the child object
        var hashMap = parent;
        var dynamicObject = parent;
        var child = null;
        if (hashMap) {
            if (childName.constructor === Number)
                childName = hashMap.getNames()[childName];
            child = hashMap.requestObject(String(childName), classDef, false);
        } else if (dynamicObject)
            child = dynamicObject.requestGlobalObject(String(childName), classDef, false);
        else
            child = WeaveAPI.SessionManager.getObject(this._rootObject, objectPath);

        if (child && child.constructor === classDef)
            return true;

        console.log('Request for ', objectType, ' failed at path ', objectPath);
        return false;
    }

    p.removeObject = function (objectPath) {
        if (!objectPath || !objectPath.length) {
            console.log("Cannot remove root object");
            return false;
        }

        var parentPath = objectPath.concat();
        var childName = parentPath.pop();
        var parent = WeaveAPI.SessionManager.getObject(this._rootObject, parentPath);

        var hashMap = parent;
        if (hashMap) {
            if (childName.constructor === Number)
                childName = hashMap.getNames()[childName];

            if (hashMap.objectIsLocked(String(childName))) {
                console.log('Object is locked and cannot be removed (path: ', objectPath);
                return false;
            }

            hashMap.removeObject(String(childName));
            return true;
        }

        var dynamicObject = parent;
        if (dynamicObject) {
            if (dynamicObject.locked) {
                console.log('Object is locked and cannot be removed (path: ', objectPath, ')');
                return false;
            }

            dynamicObject.removeObject();
            return true;
        }

        if (parent)
            console.log('Parent object does not support dynamic children, so cannot remove child at path', objectPath);
        else
            console.log('No parent from which to remove a child at path', objectPath);
        return false;
    }




    /*function convertSessionStateObjectToXML(sessionState: Object, tagName: String = null): String {
        var result: XML = WeaveXMLEncoder.encode(sessionState, tagName || "sessionState");
        return result.toXMLString();
    }

    function convertSessionStateXMLToObject(sessionStateXML: String): Object {
        var xml: XML = XML(sessionStateXML);
        var state: Object = WeaveXMLDecoder.decode(xml);
        this._convertSessionStateToPrimitives(state); // do not allow XML objects to be returned
        return state;
    }*/



    /**
     * Gets an object from a path or a variable name and sets getObjectFromPathOrVariableName_error.
     * If the path was invalid or the variable uninitialized, getObjectFromPathOrVariableName_error will be set with an appropriate error message.
     * @param objectPathOrVariableName Either an Array for a path or a String for a variable name.
     * @return The object at the specified path, the value of the specified variable, or null if the parameter was null.
     */
    //private
    p._getObjectFromPathOrVariableName = function (objectPathOrVariableName) {
        this._getObjectFromPathOrVariableName_error = null;

        if (objectPathOrVariableName === null || objectPathOrVariableName === undefined)
            return null;

        if (objectPathOrVariableName.constructor === Array) {
            var object = WeaveAPI.SessionManager.getObject(this._rootObject, objectPathOrVariableName);
            if (object)
                return object;

            this._getObjectFromPathOrVariableName_error = "No ILinkableObject at path " + objectPathOrVariableName;
            return null;
        }

        var variableName = String(objectPathOrVariableName);
        if (variableName) {
            if (this._variables.hasOwnProperty(variableName))
                return this._variables[variableName];

            this._getObjectFromPathOrVariableName_error = "Undefined variable " + variableName;
            return null;
        }

        return null;
    }


    /*private
    const _compiler: Compiler = new Compiler();

    public

    function evaluateExpression(scopeObjectPathOrVariableName: Object, expression: String, variables: Object = null, staticLibraries: Array = null, assignVariableName: String = null): * {
        try {
            if (staticLibraries)
                _compiler.includeLibraries.apply(null, staticLibraries);

            var isAssignment: Boolean = (assignVariableName != null); // allows '' to be used to ignore resulting value
            if (assignVariableName && !_compiler.isValidSymbolName(assignVariableName))
                throw new Error("Invalid variable name: " + Compiler.encodeString(assignVariableName));

            // To avoid "variable is undefined" errors, treat variables[''] as an Array of keys and set any missing properties to undefined
            if (variables)
                for each(var key: String in variables[''])
            if (!variables.hasOwnProperty(key))
                variables[key] = undefined;

            var thisObject: Object = getObjectFromPathOrVariableName(scopeObjectPathOrVariableName);
            if (getObjectFromPathOrVariableName_error)
                throw new Error(getObjectFromPathOrVariableName_error);
            var compiledObject: ICompiledObject = _compiler.compileToObject(expression);
            var isFuncDef: Boolean = _compiler.compiledObjectIsFunctionDefinition(compiledObject);
            // passed-in variables take precedence over stored ActionScript _variables
            var compiledMethod: Function = _compiler.compileObjectToFunction(
                compiledObject, [variables, _variables],
                WeaveAPI.ErrorManager.reportError,
                thisObject != null,
                null,
                null,
                true,
                thisObject
            );
            var result: * = isFuncDef ? compiledMethod : compiledMethod.apply(thisObject);
            if (isAssignment)
                _variables[assignVariableName] = result;
            else
                return result;
        } catch (e: * ) {
            externalError(e);
        }
        return undefined;
    }*/

    /**
     * Stores information for removeCallback() and removeAllCallbacks()
     */
    ExternalSessionStateInterface._d2d_callback_target = new Dictionary2D();

    p.addCallback = function (scopeObjectPathOrVariableName, callback, triggerCallbackNow, immediateMode) {
        // set default values
        if (triggerCallbackNow === undefined) triggerCallbackNow = false;
        if (immediateMode === undefined) immediateMode = false;

        try {
            if (scopeObjectPathOrVariableName === null || scopeObjectPathOrVariableName === undefined) {
                console.log("addCallback(): No path or variable name given");
                return false;
            }

            var object = this._getObjectFromPathOrVariableName(scopeObjectPathOrVariableName);
            if (this._getObjectFromPathOrVariableName_error) {
                console.log(this._getObjectFromPathOrVariableName_error);
                return false;
            }
            if (object === null || object === undefined) {
                console.log('No ILinkableObject to which to add a callback at path or variable ', scopeObjectPathOrVariableName);
                return false;
            }

            ExternalSessionStateInterface._d2d_callback_target.set(callback, object, true);
            if (immediateMode)
                WeaveAPI.SessionManager.getCallbackCollection(object).addImmediateCallback(null, callback, triggerCallbackNow);
            else
                WeaveAPI.SessionManager.getCallbackCollection(object).addGroupedCallback(null, callback, triggerCallbackNow);
            return true;
        } catch (e) {
            // unexpected error reported in Weave interface
            console.log(e);
        }
        return false;
    }

    /**
     * @inheritDoc
     */
    p.removeCallback = function (objectPathOrVariableName, callback, everywhere) {
        //set parameter's default values
        if (everywhere === undefined) everywhere = false;
        if (everywhere) {
            for (var target of ExternalSessionStateInterface._d2d_callback_target.dictionary.get(callback))
                WeaveAPI.SessionManager.getCallbackCollection(target).removeCallback(callback);
            ExternalSessionStateInterface._d2d_callback_target.dictionary.delete(callback);
            return true;
        }

        try {
            if (objectPathOrVariableName === null || objectPathOrVariableName === undefined) {
                console.log("removeCallback(): No path or variable name given");
                return false;
            }

            var object = this._getObjectFromPathOrVariableName(objectPathOrVariableName);
            if (this._getObjectFromPathOrVariableName_error) {
                console.log(this._getObjectFromPathOrVariableName_error);
                return false;
            }
            if (object === null || object === undefined) {
                console.log('No ILinkableObject from which to remove a callback at path or variable ', objectPathOrVariableName);
                return false;
            }

            ExternalSessionStateInterface._d2d_callback_target.remove(callback, object);
            WeaveAPI.SessionManager.getCallbackCollection(object).removeCallback(callback);
            return true;
        } catch (e) {
            // unexpected error reported in Weave interface
            console.log(e);
        }
        return false;
    }

    /**
     * @inheritDoc
     */
    p.removeAllCallbacks = function () {
        for (var callback of ExternalSessionStateInterface._d2d_callback_target.dictionary.keys())
            for (var target of ExternalSessionStateInterface._d2d_callback_target.dictionary.get(callback))
                WeaveAPI.SessionManager.getCallbackCollection(target).removeCallback(callback);
        ExternalSessionStateInterface._d2d_callback_target = new Dictionary2D();
    }

    weavecore.ExternalSessionStateInterface = ExternalSessionStateInterface;

}());
