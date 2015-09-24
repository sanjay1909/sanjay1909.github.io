/**
 * @module weavecore
 */

//namesapce
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {
    "use strict";

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableHashMap, 'NS', {
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
    Object.defineProperty(LinkableHashMap, 'CLASS_NAME', {
        value: 'LinkableHashMap'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableHashMap, 'SESSIONABLE', {
        value: true
    });


    // constructor:
    /**
     * Allows dynamically creating instances of objects inheriting ILinkableObject at runtime.
     * The session state is an Array of {{#crossLink "DynamicState"}}{{/crossLink}} objects.
     * @class LinkableHashMap
     * @extends CallbackCollection
     * @constructor
     * @param {Class} typeRestriction If specified, this will limit the type of objects that can be added to this LinkableHashMap.
     */
    function LinkableHashMap(typeRestriction) {
        if (typeRestriction === undefined) typeRestriction = null;

        weavecore.CallbackCollection.call(this);

        /**
         * restricts the type of object that can be stored
         * @private
         * @property _typeRestriction
         * @type Class
         */
        this._typeRestriction;
        /**
         * qualified class name of _typeRestriction
         * @private
         * @property _typeRestrictionClassName
         * @type String
         */
        this._typeRestrictionClassName;

        if (typeRestriction !== null && typeRestriction !== undefined) {
            this._typeRestriction = typeRestriction;
            this._typeRestrictionClassName = typeRestriction.name;
        }

        /**
         * @private
         * @readOnly
         * @property _childListCallbacks
         * @type ChildListCallbackInterface
         */
        Object.defineProperty(this, '_childListCallbacks', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.ChildListCallbackInterface())
        });

        /**
         * an ordered list of names appearing in _nameToObjectMap
         * @private
         * @readOnly
         * @property _orderedNames
         * @type Array
         */
        Object.defineProperty(this, '_orderedNames', {
            value: []
        });

        /**
         * maps an identifying name to an object
         * @private
         * @readOnly
         * @property _nameToObjectMap
         * @type Object
         */
        Object.defineProperty(this, '_nameToObjectMap', {
            value: {}
        });

        /**
         * maps an object to an identifying name
         * @private
         * @readOnly
         * @property _objectToNameMap
         * @type Map
         */
        Object.defineProperty(this, '_objectToNameMap', {
            value: new Map()
        });

        /**
         * maps an identifying name to a value of true if that name is locked.
         * @private
         * @readOnly
         * @property _nameIsLocked
         * @type Object
         */
        Object.defineProperty(this, '_nameIsLocked', {
            value: {}
        });

        /**
         * maps a previously used name to a value of true.  used when generating unique names.
         * @private
         * @readOnly
         * @property _previousNameMap
         * @type Object
         */
        Object.defineProperty(this, '_previousNameMap', {
            value: {}
        });

        /**
         * The child type restriction, or null if there is none.
         * @public
         * @readOnly
         * @property typeRestriction
         * @type Class
         */
        Object.defineProperty(this, 'typeRestriction', {
            get: function () {
                return this._typeRestriction;
            }
        });

        /**
         * This is an interface for adding and removing callbacks that will get triggered immediately
         * when the list of child objects changes.
         * @public
         * @readOnly
         * @property childListCallbacks
         * @type ChildListCallbackInterface
         */
        Object.defineProperty(this, 'childListCallbacks', {
            get: function () {
                return this._childListCallbacks;
            }
        });


    }

    LinkableHashMap.prototype = new weavecore.CallbackCollection();
    LinkableHashMap.prototype.constructor = LinkableHashMap;

    var p = LinkableHashMap.prototype;

    /**
     * This function returns an ordered list of names in the hash map.
     * @method getNames
     * @param {Class} filter If specified, names of objects that are not of this type will be filtered out.
     * @return {Array} A copy of the ordered list of names of objects contained in this LinkableHashMap.
     */
    p.getNames = function (filter) {
        // set default value for parameter
        if (filter === undefined) filter = null;
        var result = [];
        for (var i = 0; i < this._orderedNames.length; i++) {
            var name = this._orderedNames[i];
            if (filter === null || this._nameToObjectMap[name] instanceof filter)
                result.push(name);
        }
        return result;
    };

    /**
     * This function returns an ordered list of objects in the hash map.
     * @method getObjects
     * @param {Class} filter If specified, objects that are not of this type will be filtered out.
     * @return {Array} An ordered Array of objects that correspond to the names returned by getNames(filter).
     */
    p.getObjects = function (filter) {
        // set default value for parameter
        if (filter === undefined) filter = null;
        var result = [];
        for (var i = 0; i < this._orderedNames.length; i++) {
            var name = this._orderedNames[i];
            var object = this._nameToObjectMap[name];
            if (filter === null || filter === undefined || object instanceof filter)
                result.push(object);
        }
        return result;
    };

    /**
     * This function gets the object associated with the specified name.
     * @method getObject
     * @param {String} name The identifying name to associate with an object.
     * @return {ILinkableObject} The object associated with the given name.
     */
    p.getObject = function (name) {
        return this._nameToObjectMap[name];
    };

    /**
     * This function gets the name of the specified object in the hash map.
     * @getName
     * @param {ILinkableObject} object An object contained in this LinkableHashMap.
     * @return {String} The name associated with the object, or null if the object was not found.
     */
    p.getName = function (object) {
        return this._objectToNameMap.get(object);
    };

    /**
     * This will reorder the names returned by getNames().
     * Any names appearing in newOrder that do not appear in getNames() will be ignored.
     * Callbacks will be called if the new name order differs from the old order.
     * @method setNameOrder
     * @param {Array} newOrder The new desired ordering of names.
     */
    p.setNameOrder = function (newOrder) {
        var changeDetected = false;
        var name;
        var i;
        var originalNameCount = this._orderedNames.length; // remembers how many names existed before appending
        var haveSeen = {}; // to remember which names have been seen in newOrder
        // append each name in newOrder to the end of _orderedNames
        for (i = 0; i < newOrder.length; i++) {
            name = newOrder[i];
            // ignore bogus names and append each name only once.
            if (this._nameToObjectMap[name] === undefined || haveSeen[name] !== undefined)
                continue;
            haveSeen[name] = true; // remember that this name was appended to the end of the list
            this._orderedNames.push(name); // add this name to the end of the list
        }
        // Now compare the ordered appended items to the end of the original list.
        // If the order differs, set _nameOrderChanged to true.
        // Meanwhile, set old name entries to null so they will be removed in the next pass.
        var appendedCount = this._orderedNames.length - originalNameCount;
        for (i = 0; i < appendedCount; i++) {
            var newIndex = originalNameCount + i;
            var oldIndex = this._orderedNames.indexOf(this._orderedNames[newIndex]);
            if (newIndex - oldIndex !== appendedCount)
                changeDetected = true;
            this._orderedNames[oldIndex] = null;
        }
        // remove array items that have been set to null
        var out = 0;
        for (i = 0; i < this._orderedNames.length; i++)
            if (this._orderedNames[i] !== null && this._orderedNames[i] !== undefined)
                this._orderedNames[out++] = this._orderedNames[i];
        this._orderedNames.length = out;
        // if the name order changed, run child list callbacks
        if (changeDetected)
            this._childListCallbacks.runCallbacks(null, null, null);
    };

    /**
     * This function creates an object in the hash map if it doesn't already exist.
     * If there is an existing object associated with the specified name, it will be kept if it
     * is the specified type, or replaced with a new instance of the specified type if it is not.
     * @method requestObject
     * @param {String} name The identifying name of a new or existing object.
     * @param {Class} classDef The Class of the desired object type.
     * @param {Boolean} lockObject If this is true, the object will be locked in place under the specified name.
     * @return {Object} The object under the requested name of the requested type, or null if an error occurred.
     */
    p.requestObject = function (name, classDef, lockObject) {
        var className = classDef ? classDef.NS + '.' + (classDef.CLASS_NAME ? classDef.CLASS_NAME : classDef.name) : null;
        var result = this._initObjectByClassName.call(this, name, className, lockObject);
        return classDef ? result : null;
    };

    /**
     * This function will copy the session state of an ILinkableObject to a new object under the given name in this LinkableHashMap.
     * @method requestObjectCopy
     * @param {String} newName A name for the object to be initialized in this LinkableHashMap.
     * @param {ILinkableObject} objectToCopy An object to copy the session state from.
     * @return {ILinkableObject} The new object of the same type, or null if an error occurred.
     */
    p.requestObjectCopy = function (name, objectToCopy) {
        if (objectToCopy === null || objectToCopy === undefined) {
            this.removeObject(name);
            return null;
        }

        this.delayCallbacks(); // make sure callbacks only trigger once
        var classDef = objectToCopy.constructor; //ClassUtils.getClassDefinition(className);
        var sessionState = WeaveAPI.SessionManager.getSessionState(objectToCopy);
        //  if the name refers to the same object, remove the existing object so it can be replaced with a new one.
        if (name === this.getName(objectToCopy))
            this.removeObject(name);
        var object = requestObject(name, classDef, false);
        if (object !== null && object !== undefined)
            WeaveAPI.SessionManager.setSessionState(object, sessionState);
        this.resumeCallbacks();

        return object;
    };

    /**
     * This function will rename an object by making a copy and removing the original.
     * @method renameObject
     * @param {String} oldName The name of an object to replace.
     * @param {String} newName The new name to use for the copied object.
     * @return {ILinkableObject} The copied object associated with the new name, or the original object if newName is the same as oldName.
     */
    p.renameObject = function (oldName, newName) {
        if (oldName !== newName) {
            this.delayCallbacks();

            // prepare a name order that will put the new name in the same place the old name was
            var newNameOrder = this._orderedNames.concat();
            var index = newNameOrder.indexOf(oldName);
            if (index >= 0)
                newNameOrder.splice(index, 1, newName);

            this.requestObjectCopy(newName, getObject(oldName));
            this.removeObject(oldName);
            this.setNameOrder(newNameOrder);

            this.resumeCallbacks();
        }
        return this.getObject(newName);
    };

    /**
     * If there is an existing object associated with the specified name, it will be kept if it
     * is the specified type, or replaced with a new instance of the specified type if it is not.
     * @method _initObjectByClassName
     * @private
     * @param {String} name The identifying name of a new or existing object.  If this is null, a new one will be generated.
     * @param {String} className The qualified class name of the desired object type.
     * @param {Boolean} lockObject If this is set to true, lockObject() will be called on the given name.
     * @return {ILinkableObject} The object associated with the given name, or null if an error occurred.
     */
    p._initObjectByClassName = function (name, className, lockObject) {
        if (className) {
            // if no name is specified, generate a unique one now.
            if (!name)
                name = this.generateUniqueName(className);
            if (className !== "delete") // to-do Add Support for class Utils - delete is temp solution
            {
                // If this name is not associated with an object of the specified type,
                // associate the name with a new object of the specified type.
                console.log(className);
                var classDef = eval(className);
                //var classDef = window['weavecore'][className]; //TODO:remove hardcoded weavecore with namespace
                var object = this._nameToObjectMap[name];
                if (!object || object.constructor !== classDef)
                    this._createAndSaveNewObject.call(this, name, classDef, lockObject);
                else if (lockObject)
                    this._lockObject(name);

            } else {
                this.removeObject(name);
            }
        } else {
            this.removeObject(name);
        }
        return this._nameToObjectMap[name];
    };

    /**
     * @method _createAndSaveNewObject
     * @private
     * @param {String} name The identifying name to associate with a new object.
     * @param {Class} classDef The Class definition used to instantiate a new object.
     * @param {Boolean} lockObject If this is set to true, lockObject() will be called on the given name.
     */
    p._createAndSaveNewObject = function (name, classDef, lockObject) {
        if (this._nameIsLocked[name])
            return;

        // remove any object currently using this name
        this.removeObject(name);
        // create a new object
        var object = new classDef();
        // register the object as a child of this LinkableHashMap
        WeaveAPI.SessionManager.registerLinkableChild(this, object);
        // save the name-object mappings
        this._nameToObjectMap[name] = object;
        this._objectToNameMap.set(object, name);
        // add the name to the end of _orderedNames
        this._orderedNames.push(name);
        // remember that this name was used.
        this._previousNameMap[name] = true;

        if (lockObject)
            this._lockObject(name);

        // make sure the callback variables signal that the object was added
        this._childListCallbacks.runCallbacks(name, object, null);
    };

    /**
     * This function will lock an object in place for a given identifying name.
     * If there is no object using the specified name, this function will have no effect.
     * @method _lockObject
     * @private
     * @param {String} name The identifying name of an object to lock in place.
     */
    p._lockObject = function (name) {
        if (name !== null && name !== undefined && this._nameToObjectMap[name] !== null && this._nameToObjectMap[name] !== undefined)
            this._nameIsLocked[name] = true;
    };

    /**
     * This function will return true if the specified object was previously locked.
     * @method objectIsLocked
     * @param {String} name The name of an object.
     * @return {Boolean}
     */
    p.objectIsLocked = function (name) {
        return this._nameIsLocked[name] ? true : false;
    };

    /**
     * This function removes an object from the hash map.
     * @method removeObject
     * @param {String} name The identifying name of an object previously saved with setObject().
     */
    p.removeObject = function (name) {
        if (!name || this._nameIsLocked[name])
            return;

        var object = this._nameToObjectMap[name];
        if (object === null || object === undefined)
            return; // do nothing if the name isn't mapped to an object.

        //console.log(LinkableHashMap, "removeObject",name,object);
        // remove name & associated object
        delete this._nameToObjectMap[name];
        this._objectToNameMap.delete(object);
        var index = this._orderedNames.indexOf(name);
        this._orderedNames.splice(index, 1);

        // make sure the callback variables signal that the object was removed
        this._childListCallbacks.runCallbacks(name, null, object);

        // dispose the object AFTER the callbacks know that the object was removed
        WeaveAPI.SessionManager.disposeObject(object);
    };

    /**
     * This function attempts to removes all objects from this LinkableHashMap.
     * Any objects that are locked will remain.
     * @method removeAllObjects
     */
    p.removeAllObjects = function () {
        this.delayCallbacks();
        var orderedNamesCopy = this._orderedNames.concat();
        for (var i = 0; i < orderedNamesCopy.length; i++) {
            this.removeObject(orderedNamesCopy[i]);
        }
        this.resumeCallbacks();
    };

    /**
     * This function removes all objects from this LinkableHashMap.
     * adds implementaion to {{#crossLink "CallbackCollection/dispose:method"}}{{/crossLink}}
     * @method dispose
     */
    p.dispose = function dispose() {

        weavecore.CallbackCollection.prototype.dispose.call(this);

        // first, remove all objects that aren't locked
        this.removeAllObjects();

        // remove all locked objects
        var orderedNamesCopy = this._orderedNames.concat();
        for (var i = 0; i < orderedNamesCopy.length; i++) {
            var name = orderedNamesCopy[i];
            this._nameIsLocked[name] = undefined; // make sure removeObject() will carry out its action
            this.removeObject(name);
        }
    };

    /**
     * This will generate a new name for an object that is different from all the names of objects previously used in this LinkableHashMap.
     * @method generateUniqueName
     * @param {String} baseName The name to start with.  If the name is already in use, an integer will be appended to create a unique name.
     */
    p.generateUniqueName = function (baseName) {
        var count = 1;
        var name = baseName;
        while (this._previousNameMap[name] !== undefined)
            name = baseName + (++count);
        return name;
    };

    /**
     * This gets the session state of this composite object.
     * @method getSessionState
     * @return {Array} An Array of {{#crossLink "DynamicState"}}{{/crossLink}} objects which compose the session state for this object.
     */
    p.getSessionState = function () {
        var result = new Array(this._orderedNames.length);
        for (var i = 0; i < this._orderedNames.length; i++) {
            var name = this._orderedNames[i];
            var object = this._nameToObjectMap[name];
            result[i] = weavecore.DynamicState.create(
                name,
                object.constructor.NS + '.' + object.constructor.CLASS_NAME,
                WeaveAPI.SessionManager.getSessionState(object)
            );
        }
        return result;
    };

    /**
     * This sets the session state of this composite object.
     * @method setSessionState
     * @param {Array} newState An Array of child name Strings or {{#crossLink "DynamicState"}}{{/crossLink}} objects containing the new values and types for child ILinkableObjects.
     * @param {Boolean} removeMissingDynamicObjects If true, this will remove any child objects that do not appear in the session state.
     *     As a special case, a null session state will result in no change regardless of the removeMissingDynamicObjects value.
     */
    p.setSessionState = function (newStateArray, removeMissingDynamicObjects) {
        // special case - no change
        if (newStateArray === null || newStateArray === undefined)
            return;

        this.delayCallbacks();

        // first pass: make sure the types match and sessioned properties are instantiated.
        var i;
        var delayed = [];
        var callbacks;
        var objectName;
        var className;
        var typedState;
        var remainingObjects = removeMissingDynamicObjects ? {} : null; // maps an objectName to a value of true
        var newObjects = {}; // maps an objectName to a value of true if the object is newly created as a result of setting the session state
        var newNameOrder = []; // the order the object names appear in the vector
        if (newStateArray !== null && newStateArray !== undefined) {
            // first pass: delay callbacks of all children
            for (var m = 0; m < this._orderedNames.length; m++) {
                objectName = this._orderedNames[m]
                callbacks = WeaveAPI.SessionManager.getCallbackCollection(this._nameToObjectMap[objectName]);
                delayed.push(callbacks)
                callbacks.delayCallbacks();
            }
            // initialize all the objects before setting their session states because they may refer to each other.
            for (i = 0; i < newStateArray.length; i++) {
                typedState = newStateArray[i];
                if (!weavecore.DynamicState.isDynamicState(typedState, true))
                    continue;
                objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                className = typedState[weavecore.DynamicState.CLASS_NAME];
                // ignore objects that do not have a name because they may not load the same way on different application instances.
                if (objectName === null || objectName === undefined)
                    continue;
                // if className is not specified, make no change
                if (className === null || className === undefined)
                    continue;
                // initialize object and remember if a new one was just created
                if (this._nameToObjectMap[objectName] !== this._initObjectByClassName.call(this, objectName, className))
                    newObjects[objectName] = true;
            }

            // next pass: delay callbacks of all children (again, because there may be new children)
            for (var n = 0; n < this._orderedNames.length; n++) {
                objectName = this._orderedNames[n]
                callbacks = WeaveAPI.SessionManager.getCallbackCollection(this._nameToObjectMap[objectName]);
                delayed.push(callbacks)
                callbacks.delayCallbacks();
            }

            // next pass: copy the session state for each property that is defined.
            // Also remember the ordered list of names that appear in the session state.
            for (i = 0; i < newStateArray.length; i++) {
                typedState = newStateArray[i];
                if (typeof (typedState) === "string") {
                    objectName = typedState;
                    if (removeMissingDynamicObjects)
                        remainingObjects[objectName] = true;
                    newNameOrder.push(objectName);
                    continue;
                }

                if (!weavecore.DynamicState.isDynamicState(typedState, true))
                    continue;
                objectName = typedState[weavecore.DynamicState.OBJECT_NAME];
                if (objectName === null || objectName === undefined)
                    continue;
                var object = this._nameToObjectMap[objectName];
                if (object === null || object === undefined)
                    continue;
                // if object is newly created, we want to apply an absolute session state
                WeaveAPI.SessionManager.setSessionState(object, typedState[weavecore.DynamicState.SESSION_STATE], newObjects[objectName] || removeMissingDynamicObjects);
                if (removeMissingDynamicObjects)
                    remainingObjects[objectName] = true;
                newNameOrder.push(objectName);
            }
        }
        if (removeMissingDynamicObjects) {
            // third pass: remove objects based on the Boolean flags in remainingObjects.
            var orderedNamesCopy = this._orderedNames.concat();
            for (var j = 0; j < orderedNamesCopy.length; j++) {
                objectName = torderedNamesCopy[j];
                if (remainingObjects[objectName] !== true) {
                    //trace(LinkableHashMap, "missing value: "+objectName);
                    this.removeObject(objectName);
                }
            }
        }
        // update name order AFTER objects have been added and removed.
        this.setNameOrder(newNameOrder);

        for (var k = 0; k < delayed.length; k++) {
            callbacks = delayed[k]
            if (!WeaveAPI.SessionManager.objectWasDisposed(callbacks))
                callbacks.resumeCallbacks();
        }

        this.resumeCallbacks();
    };

    weavecore.LinkableHashMap = LinkableHashMap;
}());
