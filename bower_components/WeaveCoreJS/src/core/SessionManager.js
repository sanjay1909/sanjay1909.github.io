/**
 * @module weavecore
 */

// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}


(function () {
    "use strict";

    // constructor:
    /**
     * Session manager contains core functions related to session state.
     * @class SessionManager
     * @constructor
     */
    function SessionManager() {

        //const properties - writable default to false.
        /**
         * @private
         * @readOnly
         * @property _childToParentMap
         * @type Map
         * This maps a child ILinkableObject to a Dictionary, which maps each of its registered parent ILinkableObjects to a value of true if the child should appear in the session state automatically or false if not.
         */
        Object.defineProperty(this, "_childToParentMap", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _parentToChildMap
         * @type Map
         * This maps a parent ILinkableObject to a Dictionary, which maps each of its registered child ILinkableObjects to a value of true if the child should appear in the session state automatically or false if not.
         */
        Object.defineProperty(this, "_parentToChildMap", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _ownerToChildMap
         * @type Map
         * This maps a parent ILinkableObject to a Dictionary, which maps each child ILinkableObject it owns to a value of true.
         */
        Object.defineProperty(this, "_ownerToChildMap", {
            value: new Map()
        });

        /**
         * This maps a child ILinkableObject to its registered owner.
         * @private
         * @readOnly
         * @property _childToOwnerMap
         * @type Map
         */
        Object.defineProperty(this, "_childToOwnerMap", {
            value: new Map()
        });

        this.debug = false;

        this.linkableObjectToCallbackCollectionMap = new Map();
        this.debugBusyTasks = false;

        /**
         * @private
         * @readOnly
         * @property _disposedObjectsMap
         * @type Map
         */
        Object.defineProperty(this, "_disposedObjectsMap", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _treeCallbacks
         * @type CallbackCollection
         */
        Object.defineProperty(this, "_treeCallbacks", {
            value: new weavecore.CallbackCollection()
        });

        /**
         * @private
         * @readOnly
         * @property _classNameToSessionedPropertyNames
         * @type Object
         */
        Object.defineProperty(this, "_classNameToSessionedPropertyNames", {
            value: {}
        });

        /**
         * keeps track of which objects are currently being traversed
         * @private
         * @readOnly
         * @property _getSessionStateIgnoreList
         * @type Map
         */
        Object.defineProperty(this, "_getSessionStateIgnoreList", {
            value: new Map()
        });


        /**
         * @private
         * @readOnly
         * @property _dTaskStackTrace
         * @type Map
         */
        Object.defineProperty(this, "_dTaskStackTrace", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _d2dOwnerTask
         * @type weavecore.Dictionary2D
         */
        Object.defineProperty(this, "_d2dOwnerTask", {
            value: new weavecore.Dictionary2D()
        });

        /**
         * @private
         * @readOnly
         * @property _d2dTaskOwner
         * @type weavecore.Dictionary2D
         */
        Object.defineProperty(this, "_d2dTaskOwner", {
            value: new weavecore.Dictionary2D()
        });

        /**
         * ILinkableObject -> Boolean
         * @private
         * @readOnly
         * @property _dBusyTraversal
         * @type Map
         */
        Object.defineProperty(this, "_dBusyTraversal", {
            value: new Map()
        });

        /**
         * @private
         * @readOnly
         * @property _aBusyTraversal
         * @type Array
         */
        Object.defineProperty(this, "_aBusyTraversal", {
            value: []
        });

        /**
         * ILinkableObject -> int
         * @private
         * @readOnly
         * @property _dUnbusyTriggerCounts
         * @type Map
         */
        Object.defineProperty(this, "_dUnbusyTriggerCounts", {
            value: new Map()
        });

        /**
         * ILinkableObject -> String
         * @private
         * @readOnly
         * @property _dUnbusyStackTraces
         * @type Map
         */
        Object.defineProperty(this, "_dUnbusyStackTraces", {
            value: new Map()
        });

    }

    var p = SessionManager.prototype;



    /**
     * This function tells the SessionManager that the session state of the specified child should appear in the
     * session state of the specified parent, and the child should be disposed when the parent is disposed.
     *
     * There is one other requirement for the child session state to appear in the parent session state -- the child
     * must be accessible through a public variable of the parent or through an accessor function of the parent.
     *
     * This function will add callbacks to the sessioned children that cause the parent callbacks to run.
     *
     * If a callback function is given, the callback will be added to the child and cleaned up when the parent is disposed.
     *
     * @method registerLinkableChild
     * @param {Object} linkableParent A parent ILinkableObject that the child will be registered with.
     * @param {ILinkableObject} linkableChild The child ILinkableObject to register as a child.
     * @param {Function} callback A callback with no parameters that will be added to the child that will run before the parent callbacks are triggered, or during the next ENTER_FRAME event if a grouped callback is used.
     * @param {Boolean} useGroupedCallback If this is true, addGroupedCallback() will be used instead of addImmediateCallback().
     * @return {Object} The linkableChild object that was passed to the function.
     * @example usage:    const foo = registerLinkableChild(this, someLinkableNumber, handleFooChange);
     */
    p.registerLinkableChild = function (linkableParent, linkableChild, callback, useGroupedCallback) {
        //set default values for parameters
        if (useGroupedCallback === undefined)
            useGroupedCallback = false;
        if (!(linkableParent instanceof weavecore.ILinkableObject)) {
            if (!linkableParent.sessionable) {
                console.log("registerLinkableChild(): Parent does not inherit ILinkableObject. or sessionablepropery is not true");
                return;
            }
        }

        if (!(linkableChild instanceof weavecore.ILinkableObject)) {
            if (!linkableChild.sessionable) {
                console.log("registerLinkableChild(): child does not inherit ILinkableObject. or sessionablepropery is not true");
                return;
            }
        }

        if (callback !== null && callback !== undefined) {
            var cc = this.getCallbackCollection.call(this, linkableChild);
            if (useGroupedCallback)
                cc.addGroupedCallback(linkableParent, callback);
            else
                cc.addImmediateCallback(linkableParent, callback);
        }

        // if the child doesn't have an owner yet, this parent is the owner of the child
        // and the child should be disposed when the parent is disposed.
        // registerDisposableChild() also initializes the required Dictionaries.
        this.registerDisposableChild(linkableParent, linkableChild);

        if (this._childToParentMap.get(linkableChild).get(linkableParent) === undefined) {
            // remember this child-parent relationship
            this._childToParentMap.get(linkableChild).set(linkableParent, true);
            this._parentToChildMap.get(linkableParent).set(linkableChild, true);

            // make child changes trigger parent callbacks
            var parentCC = this.getCallbackCollection(linkableParent);
            // set alwaysCallLast=true for triggering parent callbacks, so parent will be triggered after all the other child callbacks
            this.getCallbackCollection(linkableChild).addImmediateCallback(linkableParent, parentCC.triggerCallbacks.bind(parentCC, "Parent's -triggerCallback"), false, true); // parent-child relationship
        }

        this._treeCallbacks.triggerCallbacks("Session Tree: Child Registered");

        return linkableChild;
    };

    /**
     * This will register a child of a parent and cause the child to be disposed when the parent is disposed.
     * Use this function when a child object can be disposed but you do not want to link the callbacks.
     * The child will be disposed when the parent is disposed.
     *
     * @method registerDisposableChild
     * @example usage:    const foo = registerDisposableChild(this, someLinkableNumber);
     *
     * @param {Object} disposableParent A parent disposable object that the child will be registered with.
     * @param {Object} disposableChild The disposable object to register as a child of the parent.
     * @return {Object} The linkableChild object that was passed to the function.
     */
    p.registerDisposableChild = function (disposableParent, disposableChild) {
        if (this._ownerToChildMap.get(disposableParent) === undefined) {
            this._ownerToChildMap.set(disposableParent, new Map());
            this._parentToChildMap.set(disposableParent, new Map());
        }
        // if this child has no owner yet...
        if (this._childToOwnerMap.get(disposableChild) === undefined) {
            // make this first parent the owner
            this._childToOwnerMap.set(disposableChild, disposableParent);
            this._ownerToChildMap.get(disposableParent).set(disposableChild, true);
            // initialize the parent dictionary for this child
            this._childToParentMap.set(disposableChild, new Map());
        }
        return disposableChild;
    };

    /**
     * Use this function with care.  This will remove child objects from the session state of a parent and
     * stop the child from triggering the parent callbacks.
     * @method unregisterLinkableChild
     * @param {ILinkableChild} parent A parent that the specified child objects were previously registered with.
     * @param {ILinkableChild} child The child object to unregister from the parent.
     */
    p.unregisterLinkableChild = function (parent, child) {
        if (this._childToParentMap.get(child))
            this._childToParentMap.get(child).delete(parent);
        if (this._parentToChildMap.get(parent))
            this._parentToChildMap.get(parent).delete(child);
        this.getCallbackCollection(child).removeCallback(this.getCallbackCollection(parent).triggerCallbacks.bind(parent));

        this._treeCallbacks.triggerCallbacks("Session Tree: Child un-Registered");
    };


    /**
     * This function will add or remove child objects from the session state of a parent.  Use this function
     * with care because the child will no longer be "sessioned."  The child objects will continue to trigger the
     * callbacks of the parent object, but they will no longer be considered a part of the parent's session state.
     * If you are not careful, this will break certain functionalities that depend on the session state of the parent.
     * @method excludeLinkableChildFromSessionState
     * @param {ILinkableChild} parent A parent that the specified child objects were previously registered with.
     * @param {ILinkableChild} child The child object to remove from the session state of the parent.
     */
    p.excludeLinkableChildFromSessionState = function (parent, child) {
        if (parent === null || child === null || parent === undefined || child === undefined) {
            console.log("SessionManager.excludeLinkableChildFromSessionState(): Parameters cannot be null.");
            return;
        }
        if (this._childToParentMap.get(child) !== undefined && this._childToParentMap.get(child).get(parent))
            this._childToParentMap.get(child).set(parent, false);
        if (this._parentToChildMap.get(parent) !== undefined && this._parentToChildMap.get(parent).get(child))
            this._parentToChildMap.get(parent).set(child, false);
    };

    /**
     * @method _getRegisteredChildren
     * @private
     * This function will return all the child objects that have been registered with a parent.
     * @param {ILinkableChild} parent A parent object to get the registered children of.
     * @return {Array} An Array containing a list of linkable objects that have been registered as children of the specified parent.
     *         This list includes all children that have been registered, even those that do not appear in the session state.
     */
    p._getRegisteredChildren = function (parent) {
        var result = [];
        if (this._parentToChildMap.get(parent) !== undefined)
            for (var child in this._parentToChildMap.get(parent))
                result.push(child);
        return result;
    };

    /**
     * This function gets the owner of a linkable object.  The owner of an object is defined as its first registered parent.
     * @method getLinkableOwner
     * @param {ILinkableObject} child An ILinkableObject that was registered as a child of another ILinkableObject.
     * @return {ILinkableObject} The owner of the child object (the first parent that was registered with the child), or null if the child has no owner.
     * See {{#crossLink "SessionManager/getLinkableDescendants:method"}}{{/crossLink}}
     */
    p.getLinkableOwner = function (child) {
        return this._childToOwnerMap.get(child);
    };

    /**
     * This function will return all the descendant objects that implement ILinkableObject.
     * If the filter parameter is specified, the results will contain only those objects that extend or implement the filter class.
     * @method getLinkableDescendants
     * @param {ILinkableObject} root A root object to get the descendants of.
     * @param {Class} filter An optional Class definition which will be used to filter the results.
     * @return {Array} An Array containing a list of descendant objects.
     * See {{#crossLink "SessionManager/getLinkableOwner:method"}}{{/crossLink}}
     */
    p.getLinkableDescendants = function (root, filter) { //TODO: Port getLinkableDescendants
        //return this._childToOwnerMap.get(child);
    };
    //TODO: Port Busy task from As3

    /**
     * @method getSessionStateTree
     * @param {ILinkableObject} root The linkable object to be placed at the root node of the tree.
     * @param {String} objectName
     * @param {Object} objectTypeFilter
     * @return {WeaveTreeItem} A tree of nodes with the properties "label", "object", and "children"
     */
    p.getSessionStateTree = function (root, objectName, objectTypeFilter) {
        var treeItem = new weavecore.WeaveTreeItem();
        treeItem.label = objectName;
        treeItem.source = root;
        treeItem.children = SessionManager.prototype._getTreeItemChildren.bind(this);
        treeItem.data = objectTypeFilter;
        return treeItem;
    };

    /**
     * @method _getTreeItemChildren
     * @param {WeaveTreeItem} treeItem
     * @return {Array}
     */
    p._getTreeItemChildren = function (treeItem) {
        var object = treeItem.source;
        var objectTypeFilter = treeItem.data;
        var children = [];
        var names = [];
        var childObject;
        var subtree;
        var ignoreList = new Map();
        if (object instanceof weavecore.LinkableHashMap) {
            names = object.getNames();
            var childObjects = object.getObjects();
            for (var i = 0; i < names.length; i++) {
                childObject = childObjects[i];
                if (this._childToParentMap.get(childObject) && this._childToParentMap.get(childObject).get(object)) {
                    if (ignoreList.get(childObject) !== undefined)
                        continue;
                    ignoreList.set(childObject, true);

                    subtree = this.getSessionStateTree(childObject, names[i], objectTypeFilter);
                    if (subtree !== null && subtree !== undefined)
                        children.push(subtree);
                }
            }
        } else {
            var deprecatedLookup = null;
            if (object instanceof weavecore.LinkableDynamicObject) {
                //TODO: support for Linkable dynamic object
                console.log("Linkable dynamic object not yet supported - only Linkablehashmap");
            } else if (Object) {
                names = this.getLinkablePropertyNames(object);
            }
            names.map(function (name) {
                if (object instanceof weavecore.LinkableDynamicObject) {
                    childObject = object.internalObject;
                }
                if (!childObject) {
                    return;
                }
                if (this._childToParentMap.get(childObject) && this._childToParentMap.get(childObject).get(object)) {
                    if (ignoreList.get(childObject) !== undefined) {
                        return;
                    }
                    ignoreList.set(childObject, true);
                    children.push(this.getSessionStateTree(childObject, name));
                }
            }.bind(this))

        }
        if (children.length === 0)
            children = null;
        if (objectTypeFilter === null || objectTypeFilter === undefined)
            return children;
        if ((children === null || children === undefined) && !(object instanceof objectTypeFilter))
            return null;
        return children;
    };

    /**
     * Adds a grouped callback that will be triggered when the session state tree changes.
     * USE WITH CARE. The groupedCallback should not run computationally-expensive code.
     * @method addTreeCallback
     * @param {Object} relevantContext
     * @param {Function} groupedCallback
     * @param {Boolean} triggerCallbackNow
     */
    p.addTreeCallback = function (relevantContext, groupedCallback, triggerCallbackNow) {
        if (triggerCallbackNow === undefined) triggerCallbackNow = false;
        this._treeCallbacks.addGroupedCallback(relevantContext, groupedCallback, triggerCallbackNow);
    };

    /**
     * @method removeTreeCallback
     * @param {Function} groupedCallback
     */
    p.removeTreeCallback = function (groupedCallback) {
        this._treeCallbacks.removeCallback(groupedCallback);
    };

    /**
     * This function will copy the session state from one sessioned object to another.
     * If the two objects are of different types, the behavior of this function is undefined.
     * @method copySessionState
     * @param {ILinkableObject} source A sessioned object to copy the session state from.
     * @param {ILinkableObject} destination A sessioned object to copy the session state to.
     * see {{#crossLink "SessionManager/getSessionState:method"}}{{/crossLink}}
     * see {{#crossLink "SessionManager/setSessionState:method"}}{{/crossLink}}
     */
    p.copySessionState = function (source, destination) {
        var sessionState = this.getSessionState(source);
        this.setSessionState(destination, sessionState, true);
    };

    /**
     * @method _applyDiff
     * @private
     * @param {Object} base
     * @param {Object} diff
     */
    p._applyDiff = function (base, diff) {
        if (base === null || base === undefined || typeof (base) !== 'object' || diff === null || diff === undefined || typeof (diff) !== 'object')
            return diff;

        for (var key in diff)
            base[key] = this._applyDiff(base[key], diff[key]);

        return base;
    };

    /**
     * Sets the session state of an ILinkableObject.
     * @method setSessionState
     * @param {ILinkableObject} linkableObject An object containing sessioned properties (sessioned objects may be nested).
     * @param {Object} newState An object containing the new values for sessioned properties in the sessioned object.
     * @param {Boolean} removeMissingDynamicObjects If true, this will remove any properties from an ILinkableCompositeObject that do not appear in the session state.
     * see {{#crossLink "SessionManager/getSessionState:method"}}{{/crossLink}}
     */
    p.setSessionState = function (linkableObject, newState, removeMissingDynamicObjects) {
        if (removeMissingDynamicObjects === undefined) removeMissingDynamicObjects = true;
        if (linkableObject === null) {
            console.log("SessionManager.setSessionState(): linkableObject cannot be null.");
            return;
        }

        if (linkableObject === undefined) {
            console.log("SessionManager.setSessionState(): linkableObject cannot be undefined.");
            return;
        }

        // special cases: for Explicit and Composite Session Object
        if (linkableObject instanceof weavecore.LinkableVariable) {
            var lv = linkableObject;
            if (removeMissingDynamicObjects === false && newState && newState.constructor.name === 'Object') {
                lv.setSessionState.call(lv, this._applyDiff.call(this, Object.create(lv.getSessionState(lv)), newState));
            } else {
                lv.setSessionState.call(lv, newState);
            }
            return;
        }
        //linkableHashmap is handled, In As3 version it implements ILinkableCompositeObject
        // in jS we couldnt do that, thats why linkableObject.setSessionState is used
        if (linkableObject instanceof weavecore.ILinkableCompositeObject || linkableObject.setSessionState) {
            if (newState.constructor.name === "String")
                newState = [newState];

            if (newState !== null && !(newState instanceof Array)) {
                var array = [];
                for (var key in newState)
                    array.push(weavecore.DynamicState.create(key, null, newState[key]));
                newState = array;
            }

            linkableObject.setSessionState(newState, removeMissingDynamicObjects);
            return;
        }

        if (newState === null || newState === undefined)
            return;

        // delay callbacks before setting session state
        var objectCC = this.getCallbackCollection(linkableObject);
        objectCC.delayCallbacks();

        // cache property names if necessary
        var className = (linkableObject.constructor.NS + '.' + linkableObject.constructor.CLASS_NAME);
        if (!this._classNameToSessionedPropertyNames[className])
            this._cacheClassInfo(linkableObject, className);

        // set session state
        var foundMissingProperty = false;
        var propertyNames;

        propertyNames = this._classNameToSessionedPropertyNames[className];

        for (var i = 0; i < propertyNames.length; i++) {
            var name = propertyNames[i];
            if (!newState.hasOwnProperty(name)) {
                if (removeMissingDynamicObjects) //&& linkableObject is ILinkableObjectWithNewProperties
                    foundMissingProperty = true;
                continue;
            }

            var property = null;
            try {
                property = linkableObject[name];
            } catch (e) {
                console.log('SessionManager.setSessionState(): Unable to get property "' + name + '" of class "' + linkableObject.constructor.name + '"', e);
            }

            if (property === null)
                continue;

            this.setSessionState(property, newState[name], removeMissingDynamicObjects);
        }

        // TODO: handle properties appearing in session state that do not appear in the linkableObject
        /*if (linkableObject instanceof ILinkableObjectWithNewProperties)
				for (name in newState)
					if (!deprecatedLookup.hasOwnProperty(name))
						linkableObject.handleMissingSessionStateProperty(newState, name);*/

        // handle properties missing from absolute session state
        if (foundMissingProperty)
            propertyNames.forEach(function (name) {
                if (!newState.hasOwnProperty(name))
                    linkableObject.handleMissingSessionStateProperty(newState, name);
            });

        // resume callbacks after setting session state
        objectCC.resumeCallbacks();

    };

    /**
     * Gets the session state of an ILinkableObject.
     * @method getSessionState
     * @param {IlinkableObject} linkableObject An object containing sessioned properties (sessioned objects may be nested).
     * @return {Object} An object containing the values from the sessioned properties.
     * see {{#crossLink "SessionManager/setSessionState:method"}}{{/crossLink}}
     */
    p.getSessionState = function (linkableObject) {
        if (linkableObject === null) {
            console.log("SessionManager.getSessionState(): linkableObject cannot be null.");
            return null;
        }

        if (linkableObject === undefined) {
            console.log("SessionManager.getSessionState(): linkableObject cannot be undefined.");
            return null;
        }

        var result = null;

        // special cases (explicit session state)
        if (linkableObject instanceof weavecore.LinkableVariable) {
            result = linkableObject.getSessionState();
        }
        //linkableHashmap is handled, In As3 version it implements ILinkableCompositeObject
        // in jS we couldnt do that, thats why linkableObject.setSessionState is used
        else if (linkableObject instanceof weavecore.ILinkableCompositeObject || linkableObject.getSessionState) {
            result = linkableObject.getSessionState();
        } else if (linkableObject.sessionable) { //sessionbale variable creation is must as there is no interface concept in JS
            // implicit session state
            // first pass: get property names
            // cache property names if necessary
            //var className = linkableObject.constructor.name; // we can't use constructor.name as minified verisons have different names
            var className = linkableObject.constructor.NS + '.' + linkableObject.constructor.CLASS_NAME;

            if (!this._classNameToSessionedPropertyNames[className])
                this._cacheClassInfo(linkableObject, className);

            var propertyNames = this._classNameToSessionedPropertyNames[className];
            var resultNames = [];
            var resultProperties = [];
            var property = null;
            var i;
            for (i = 0; i < propertyNames.length; i++) {
                var name = propertyNames[i];

                try {
                    property = null; // must set this to null first because accessing the property may fail
                    property = linkableObject[name];
                } catch (e) {
                    console.log('Unable to get property "' + name + '" of class "' + linkableObject.constructor.NS + '.' + linkableObject.constructor.CLASS_NAME + '"');
                }

                // first pass: set result[name] to the ILinkableObject
                if (property !== null && !this._getSessionStateIgnoreList.get(property)) {
                    // skip this property if it should not appear in the session state under the parent.
                    if (this._childToParentMap.get(property) === undefined || !this._childToParentMap.get(property).get(linkableObject))
                        continue;
                    // avoid infinite recursion in implicit session states
                    this._getSessionStateIgnoreList.set(property, true);
                    resultNames.push(name);
                    resultProperties.push(property);
                } else {
                    if (property !== null)
                        console.log("ignoring duplicate object:", name, property);
                }

            }

            // special case if there are no child objects -- return null
            if (resultNames.length > 0) {
                // second pass: get values from property names
                result = {};
                for (i = 0; i < resultNames.length; i++) {
                    var value = this.getSessionState(resultProperties[i]);
                    property = resultProperties[i];
                    // do not include objects that have a null implicit session state (no child objects)
                    if (value === null && !(property instanceof weavecore.LinkableVariable) && !(property instanceof weavecore.ILinkableCompositeObject) && !(property.getSessionState))
                        continue;
                    result[resultNames[i]] = value;

                }
            }
        }

        this._getSessionStateIgnoreList.set(linkableObject, undefined);

        return result;
    };


    /**
     * @method _cacheClassInfo
     * @private
     * @param {ILinkableObject} linkableObject
     * @param {String} className
     */
    p._cacheClassInfo = function (linkableObject, className) {
        // linkable property names
        var propertyNames = Object.getOwnPropertyNames(linkableObject);
        var sessionedPublicProperties = propertyNames.filter(function (propName) {
            if (propName.charAt(0) === '_')
                return false; //Private properties are ignored
            else {
                var isSessionable = false;
                if (linkableObject[propName] instanceof weavecore.ILinkableObject || linkableObject[propName].sessionable) {
                    isSessionable = true
                }
            }
            return isSessionable;
        });

        this._classNameToSessionedPropertyNames[className] = sessionedPublicProperties.sort();
    };

    /**
     * This function gets a list of sessioned property names so accessor functions for non-sessioned properties do not have to be called.
     * @method getLinkablePropertyNames
     * @param {ILinkableObject} linkableObject An object containing sessioned properties.
     * @param {Boolean} filtered If set to true, filters out deprecated, null, and excluded properties.
     * @return {Array} An Array containing the names of the sessioned properties of that object class.
     */
    p.getLinkablePropertyNames = function (linkableObject, filtered) {
        if (filtered === undefined) //default parameter value
            filtered = false;

        if (linkableObject === null) {
            console.log("SessionManager.getLinkablePropertyNames(): linkableObject cannot be null.");
            return [];
        }

        if (linkableObject === undefined) {
            console.log("SessionManager.getLinkablePropertyNames(): linkableObject cannot be undefined.");
            return [];
        }

        var className = linkableObject.constructor.NS + '.' + linkableObject.constructor.CLASS_NAME;
        var propertyNames = this._classNameToSessionedPropertyNames[className];
        if (propertyNames === null || propertyNames === undefined) {
            this._cacheClassInfo(linkableObject, className);
            propertyNames = this._classNameToSessionedPropertyNames[className];
        }

        if (filtered) {
            var filteredPropNames = propertyNames.filter(function (propName) {
                var property = linkableObject[propName];
                if (property === null || property === undefined)
                    return false;
                if (this._childToParentMap.get(property) === undefined || !this._childToParentMap.get(property).get(linkableObject))
                    return false;

                return true;
            });
            return filteredPropNames;
        }
        return propertyNames;
    };

    p.linkableObjectIsBusy = function (linkableObject) {
        var busy = false;

        this._aBusyTraversal[this._aBusyTraversal.length] = linkableObject; // push
        this._dBusyTraversal.set(linkableObject, true);

        outerLoop: for (var i = 0; i < this._aBusyTraversal.length; i++) {
            linkableObject = this._aBusyTraversal[i];

            if (linkableObject.isBusy) {
                if (linkableObject.isBusy()) {
                    busy = true;
                    break;
                }
                // do not check children
                continue;
            }

            // if the object is assigned a task, it's busy
            for (var task in _d2dOwnerTask.dictionary.get(linkableObject)) {
                if (this.debugBusyTasks) {
                    var stackTrace = this._dTaskStackTrace.get(task);
                    console.log(stackTrace);
                }
                busy = true;
                break outerLoop;
            }

            // see if children are busy
            var dChild = this._parentToChildMap.get(linkableObject);
            for (var child in dChild) {
                // queue all the children that haven't been queued yet
                if (!this._dBusyTraversal.get(child)) {
                    this._aBusyTraversal[this._aBusyTraversal.length] = child; // push
                    this._dBusyTraversal.set(child, true);
                }
            }
        }

        // reset traversal dictionary for next time
        for (var i = 0; i < this._aBusyTraversal.length; i++) {
            var linkableObject = this._aBusyTraversal[i];
            this._dBusyTraversal.set(linkableObject, false);
        }

        this._aBusyTraversal.length = 0;

        return busy;

    }

    /**
     * This function gets the CallbackCollection associated with an ILinkableObject.
     * If there is no CallbackCollection defined for the object, one will be created.
     * This CallbackCollection is used for reporting changes in the session state
     * @method getCallbackCollection
     * @param {ILinkableObject} linkableObject An ILinkableObject to get the associated ICallbackCollection for.
     * @return {CallbackCollection} The CallbackCollection associated with the given object.
     */
    p.getCallbackCollection = function (linkableObject) {
        if (linkableObject === null || linkableObject === undefined)
            return null;
        if (linkableObject instanceof weavecore.CallbackCollection)
            return linkableObject;

        var objectCC = this.linkableObjectToCallbackCollectionMap.get(linkableObject);
        if (objectCC === null || objectCC === undefined) {
            objectCC = this.registerDisposableChild(linkableObject, new weavecore.CallbackCollection());
            if (weavecore.CallbackCollection.debug)
                objectCC._linkableObject = linkableObject;
            this.linkableObjectToCallbackCollectionMap.set(linkableObject, objectCC);
        }

        return objectCC;
    };


    /**
     * This function checks if an object has been disposed by the SessionManager.
     * @method objectWasDisposed
     * @param {Object} object An object to check.
     * @return {Boolean} A value of true if disposeObject() was called for the specified object.
     * see {{#crossLink "SessionManager/disposeObject:method"}}{{/crossLink}}
     */
    p.objectWasDisposed = function (object) {
        if (object === undefined)
            return true; // added by sanjay:
        if (object === null) //null means :Object parameter is null i.e Object has no parameters
            return false;
        if (object instanceof weavecore.ILinkableObject || object.sessionable) {
            var cc = this.getCallbackCollection(object);
            if (cc)
                return cc.wasDisposed;
        }
        return this._disposedObjectsMap.get(object) !== undefined;
    };


    /**
     * This function should be called when an ILinkableObject  is no longer needed.
     * @method disposeObject
     * @param {Object} object An ILinkableObject  to clean up.
     * see {{#crossLink "SessionManager/objectWasDisposed:method"}}{{/crossLink}}
     */
    p.disposeObject = function (object) {
        if (object !== null && object !== undefined && !this._disposedObjectsMap.get(object)) {
            this._disposedObjectsMap.set(object, true);

            // TODO: clean up pointers to busy tasks
            //disposeBusyTaskPointers(object as ILinkableObject);

            try {
                // if the object implements IDisposableObject, call its dispose() function now
                //if (object instanceof IDisposableObject)
                //	{
                //	object.dispose();
                //	}
                if (object.dispose && object.dispose.constructor === Function) {
                    // call dispose() anyway if it exists, because it is common to forget to implement IDisposableObject.
                    object.dispose();
                }
            } catch (e) {
                console.log(e);
            }

            var linkableObject = object;
            if (linkableObject) {
                // dispose the callback collection corresponding to the object.
                // this removes all callbacks, including the one that triggers parent callbacks.
                var objectCC = this.getCallbackCollection(linkableObject);
                if (objectCC !== linkableObject)
                    this.disposeObject(objectCC);
            }

            // unregister from parents
            if (this._childToParentMap.get(object) !== undefined) {
                // remove the parent-to-child mappings
                for (var parent in this._childToParentMap.get(object))
                    if (this._parentToChildMap.get(parent) !== undefined)
                        this._parentToChildMap.get(parent).delete(object);
                    // remove child-to-parent mapping
                this._childToParentMap.delete(object);
            }

            // unregister from owner
            var owner = this._childToOwnerMap.get(object);
            if (owner !== null || owner !== undefined) {
                if (this._ownerToChildMap.get(owner) !== undefined)
                    this._ownerToChildMap.get(owner).delete(object);
                this._childToOwnerMap.delete(object);
            }

            // if the object is an ILinkableVariable, unlink it from all bindable properties that were previously linked
            //if (linkableObject instanceof LinkableVariable)
            //for (var bindableParent:* in _watcherMap[linkableObject])
            //for (var bindablePropertyName:String in _watcherMap[linkableObject][bindableParent])
            //unlinkBindableProperty(linkableObject as ILinkableVariable, bindableParent, bindablePropertyName);

            // unlink this object from all other linkable objects
            //for (var otherObject in linkFunctionCache.dictionary[linkableObject])
            //unlinkSessionState(linkableObject, otherObject as ILinkableObject);

            // dispose all registered children that this object owns
            var children = this._ownerToChildMap.get(object);
            if (children !== null && children !== undefined) {
                // clear the pointers to the child dictionaries for this object
                this._ownerToChildMap.delete(object);
                this._parentToChildMap.delete(object);
                // dispose the children this object owned
                for (var child in children)
                    this.disposeObject(child);
            }

            this._treeCallbacks.triggerCallbacks("Session Tree: Object Disposed");
        }
    };


    /**
     * This function computes the diff of two session states.
     * @method computeDiff
     * @param {Object} oldState The source session state.
     * @param {Object} newState The destination session state.
     * @return {Object} A patch that generates the destination session state when applied to the source session state, or undefined if the two states are equivalent.
     * see {{#crossLink "SessionManager/combineDiff:method"}}{{/crossLink}}
     */
    p.computeDiff = function (oldState, newState) {
        var type = typeof (oldState); // the type of null is 'object'
        var diffValue;

        // special case if types differ
        if (typeof (newState) !== type)
            return newState;


        if (type === 'number') {
            if (isNaN(oldState) && isNaN(newState))
                return undefined; // no diff

            if (oldState !== newState)
                return newState;

            return undefined; // no diff
        } else if (oldState === null || oldState === undefined || newState === null || newState === undefined || type !== 'object') // other primitive value
        {
            if (oldState !== newState) // no type-casting
                return newState;

            return undefined; // no diff
        } else if (oldState.constructor === Array && newState.constructor === Array) {
            // If neither is a dynamic state array, don't compare them as such.
            if (!weavecore.DynamicState.isDynamicStateArray(oldState) && !weavecore.DynamicState.isDynamicStateArray(newState)) {
                if (weavecore.StandardLib.compare(oldState, newState) === 0)
                    return undefined; // no diff
                return newState;
            }

            // create an array of new DynamicState objects for all new names followed by missing old names
            var i;
            var typedState;
            var changeDetected = false;

            // create oldLookup
            var oldLookup = {};
            var objectName;
            var className;
            var sessionState;
            for (i = 0; i < oldState.length; i++) {
                // assume everthing is typed session state
                //note: there is no error checking here for typedState
                typedState = oldState[i];
                objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                // use '' instead of null to avoid "null"
                oldLookup[objectName || ''] = typedState;
            }
            if (oldState.length !== newState.length)
                changeDetected = true;

            // create new Array with new DynamicState objects
            var result = [];
            for (i = 0; i < newState.length; i++) {
                // assume everthing is typed session state
                //note: there is no error checking here for typedState
                typedState = newState[i];
                objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                className = typedState[weavecore.DynamicState.CLASS_NAME];
                sessionState = typedState[weavecore.DynamicState.SESSION_STATE];
                var oldTypedState = oldLookup[objectName || ''];
                delete oldLookup[objectName || '']; // remove it from the lookup because it's already been handled

                // If the object specified in newState does not exist in oldState, we don't need to do anything further.
                // If the class is the same as before, then we can save a diff instead of the entire session state.
                // If the class changed, we can't save only a diff -- we need to keep the entire session state.
                // Replace the sessionState in the new DynamicState object with the diff.
                if (oldTypedState !== undefined && oldTypedState[weavecore.DynamicState.CLASS_NAME] === className) {
                    className = null; // no change
                    diffValue = this.computeDiff(oldTypedState[weavecore.DynamicState.SESSION_STATE], sessionState);
                    if (diffValue === undefined) {
                        // Since the class name is the same and the session state is the same,
                        // we only need to specify that this name is still present.
                        result.push(objectName);

                        if (!changeDetected && oldState[i][weavecore.DynamicState.OBJECT_NAME] != objectName)
                            changeDetected = true;

                        continue;
                    }
                    sessionState = diffValue;
                }

                // save in new array and remove from lookup
                result.push(weavecore.DynamicState.create(objectName || null, className, sessionState)); // convert empty string to null
                changeDetected = true;
            }

            // Anything remaining in the lookup does not appear in newState.
            // Add DynamicState entries with an invalid className ("delete") to convey that each of these objects should be removed.
            for (objectName in oldLookup) {
                result.push(weavecore.DynamicState.create(objectName || null, SessionManager.DIFF_DELETE)); // convert empty string to null
                changeDetected = true;
            }

            if (changeDetected)
                return result;

            return undefined; // no diff
        } else // nested object
        {
            var diff; // start with no diff

            // find old properties that changed value
            for (var oldName in oldState) {
                diffValue = this.computeDiff(oldState[oldName], newState[oldName]);
                if (diffValue !== undefined) {
                    if (!diff)
                        diff = {};
                    diff[oldName] = diffValue;
                }
            }

            // find new properties
            for (var newName in newState) {
                if (oldState[newName] === undefined) {
                    if (!diff)
                        diff = {};
                    diff[newName] = newState[newName]; // TODO: same object pointer.. potential problem?
                }
            }

            return diff;
        }
    };

    /**
     * This modifies an existing diff to include an additional diff.
     * @method combineDiff
     * @param {Object} baseDiff The base diff which will be modified to include an additional diff.
     * @param {Object} diffToAdd The diff to add to the base diff.  This diff will not be modified.
     * @return {Object} The modified baseDiff, or a new diff object if baseDiff is a primitive value.
     * see {{#crossLink "SessionManager/computeDiff:method"}}{{/crossLink}}
     */
    p.combineDiff = function (baseDiff, diffToAdd) {
        var baseType = typeof (baseDiff); // the type of null is 'object'
        var diffType = typeof (diffToAdd);

        // special cases
        if (baseDiff === null || baseDiff === undefined || diffToAdd === null || diffToAdd === undefined || baseType !== diffType || baseType !== 'object') {
            if (diffType === 'object') // not a primitive, so make a copy
                baseDiff = Object.getPrototypeOf(Object.create(diffToAdd)).slice(0); //TODO: find better solution for array copy(currently Shallow copy)
            else
                baseDiff = diffToAdd;
        } else if (Array.isArray(baseDiff) && Array.isArray(diffToAdd)) {
            var i;

            // If either of the arrays look like DynamicState arrays, treat as such
            if (weavecore.DynamicState.isDynamicStateArray(baseDiff) || weavecore.DynamicState.isDynamicStateArray(diffToAdd)) {
                var typedState;
                var objectName;

                // create lookup: objectName -> old diff entry
                // temporarily turn baseDiff into an Array of object names
                var baseLookup = {};
                for (i = 0; i < baseDiff.length; i++) {
                    typedState = baseDiff[i];
                    // note: no error checking for typedState
                    if (typeof typedState === 'string' || typedState instanceof String || typedState === null || typedState === undefined)
                        objectName = typedState;
                    else
                        objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                    baseLookup[objectName] = typedState;
                    // temporarily turn baseDiff into an Array of object names
                    baseDiff[i] = objectName;
                }
                // apply each typedState diff appearing in diffToAdd
                for (i = 0; i < diffToAdd.length; i++) {
                    typedState = diffToAdd[i];
                    // note: no error checking for typedState
                    if (typeof typedState === 'string' || typedState instanceof String || typedState === null || typedState === undefined)
                        objectName = typedState;
                    else
                        objectName = typedState[weavecore.DynamicState.OBJECT_NAME];

                    // adjust names list so this name appears at the end
                    if (baseLookup.hasOwnProperty(objectName)) {
                        for (var j = baseDiff.indexOf(objectName); j < baseDiff.length - 1; j++)
                            baseDiff[j] = baseDiff[j + 1];
                        baseDiff[baseDiff.length - 1] = objectName;
                    } else {
                        baseDiff.push(objectName);
                    }

                    // apply diff
                    var oldTypedState = baseLookup[objectName];
                    if (typeof oldTypedState === 'string' || oldTypedState instanceof String || oldTypedState === null || oldTypedState === undefined) {
                        if (typeof typedState === 'string' || typedState instanceof String || typedState === null || typedState === undefined)
                            baseLookup[objectName] = typedState; // avoid unnecessary function call overhead
                        else
                            baseLookup[objectName] = Object.getPrototypeOf(Object.create(typedState)).slice(0); //TODO: Temp solution for Array Copy
                    } else if (!(typeof typedState === 'string' || typedState instanceof String || typedState === null || typedState === undefined)) // update dynamic state
                    {
                        var className = typedState[weavecore.DynamicState.CLASS_NAME];
                        // if new className is different and not null, start with a fresh typedState diff
                        if (className && className != oldTypedState[weavecore.DynamicState.CLASS_NAME]) {
                            baseLookup[objectName] = Object.getPrototypeOf(Object.create(typedState)).slice(0); //TODO: Temp solution for Array Copy
                        } else // className hasn't changed, so combine the diffs
                        {
                            oldTypedState[weavecore.DynamicState.SESSION_STATE] = this.combineDiff(oldTypedState[weavecore.DynamicState.SESSION_STATE], typedState[weavecore.DynamicState.SESSION_STATE]);
                        }
                    }
                }
                // change baseDiff back from names to typed states
                for (i = 0; i < baseDiff.length; i++)
                    baseDiff[i] = baseLookup[baseDiff[i]];
            } else // not typed session state
            {
                // overwrite old Array with new Array's values
                i = baseDiff.length = diffToAdd.length;
                while (i--) {
                    var value = diffToAdd[i];
                    if (value === null || value === undefined || typeof value !== 'object')
                        baseDiff[i] = value; // avoid function call overhead
                    else
                        baseDiff[i] = this.combineDiff(baseDiff[i], value);
                }
            }
        } else // nested object
        {
            for (var newName in diffToAdd)
                baseDiff[newName] = this.combineDiff(baseDiff[newName], diffToAdd[newName]);
        }

        return baseDiff;
    };

    /**
     * @public
     * @property  DIFF_DELETE
     * @static
     * @readOnly
     * @type String
     * @default "delete"
     */
    Object.defineProperty(SessionManager, 'DIFF_DELETE', {
        value: "delete"
    });

    weavecore.SessionManager = SessionManager;

}());
