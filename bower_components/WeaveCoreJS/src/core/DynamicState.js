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

    // constructor
    /**
     * Utility Class to create Dynamic state objects with three properties: objectName, className, sessionState
     * @class DynamicState
     */
    function DynamicState() {
        throw "DynamicState cannot be instantiated.";
    }

    // Static Public Const Properties
    /**
     * The name of the property containing the name assigned to the object when the session state is generated.
     * @static
     * @public
     * @property OBJECT_NAME
     * @readOnly
     * @default "objectName"
     * @type String
     */
    Object.defineProperty(DynamicState, 'OBJECT_NAME', {
        value: "objectName"
    });

    /**
     * The name of the property containing the qualified class name of the original object providing the session state.
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @default "className"
     * @type String
     */
    Object.defineProperty(DynamicState, 'CLASS_NAME', {
        value: "className"
    });

    /**
     * The name of the property containing the session state for an object of the type specified by className.
     * @static
     * @public
     * @property SESSION_STATE
     * @readOnly
     * @default "sessionState"
     * @type String
     */
    Object.defineProperty(DynamicState, 'SESSION_STATE', {
        value: "sessionState"
    });

    /**
     * The name of the property used to make isDynamicState() return false in order to bypass special diff logic for dynamic state arrays.
     * @static
     * @public
     * @property BYPASS_DIFF
     * @readOnly
     * @default "bypassDiff"
     * @type String
     */
    Object.defineProperty(DynamicState, 'BYPASS_DIFF ', {
        value: "bypassDiff"
    });

    //static Public Methods
    /**
     * Creates an Object having three properties: objectName, className, sessionState
     * @method create
     * @static
     * @param {String} objectName The name assigned to the object when the session state is generated.
     * @param {String} className The qualified class name of the original object providing the session state.
     * @param {Object} sessionState The session state for an object of the type specified by className.
     */
    DynamicState.create = function (objectName, className, sessionState) {
        var obj = {};
        // convert empty strings ("") to null
        obj[DynamicState.OBJECT_NAME] = objectName || null;
        obj[DynamicState.CLASS_NAME] = className || null;
        obj[DynamicState.SESSION_STATE] = sessionState;
        return obj;
    };

    /**
     * This function can be used to detect dynamic state objects within nested, untyped session state objects.
     * This function will check if the given object has the three properties of a dynamic state object.
     * @method isDynamicState
     * @static
     * @param {Object} object An object to check.
     * @return {Boolean} true if the object has all three properties and no extras.
     */
    DynamicState.isDynamicState = function (object, handleBypassDiff) {
        handleBypassDiff = (handleBypassDiff === undefined ? false : handleBypassDiff);
        var matchCount = 0;
        for (var name in object) {
            if (name === DynamicState.OBJECT_NAME || name === DynamicState.CLASS_NAME || name === DynamicState.SESSION_STATE)
                matchCount++;
            else if (handleBypassDiff && name === DynamicState.BYPASS_DIFF)
                continue;
            else
                return false;
        }
        return (matchCount == 3); // must match all three properties with no extras
    };

    /**
     * This function checks whether or not a session state is an Array containing at least one
     * object that looks like a DynamicState and has no other non-String items.
     * @method isDynamicStateArray
     * @static
     * @param {Object} state
     * @return {Boolean} A value of true if the Array looks like a dynamic session state or diff.
     */
    DynamicState.isDynamicStateArray = function (state, handleBypassDiff) {
        handleBypassDiff = (handleBypassDiff === undefined ? false : handleBypassDiff);
        if (!Array.isArray(state))
            return false;
        var result = false;
        for (var i = 0; i < state.length; i++) {
            var item = state[i];
            if (typeof item == 'string' || item instanceof String)
                continue; // dynamic state diffs can contain String values.
            if (DynamicState.isDynamicState(item, handleBypassDiff))
                result = true;
            else
                return false;
        }
        return result;
    };

    /**
     * Alters a session state object to bypass special diff logic for dynamic state arrays.
     * It does so by adding the "bypassDiff" property to any part for which isDynamicState(part) returns true.
     * @method alterSessionStateToBypassDiff
     * @static
     * @param {Object} state
     * @return {Boolean} A value of true if the Array looks like a dynamic session state or diff.
     */
    DynamicState.alterSessionStateToBypassDiff = function (object) {
        if (DynamicState.isDynamicState(object)) {
            object[DynamicState.BYPASS_DIFF] = true;
            object = object[DynamicState.SESSION_STATE];
        }
        for (var name in object)
            DynamicState.alterSessionStateToBypassDiff(object[name]);

    };

    weavecore.DynamicState = DynamicState;

}());
