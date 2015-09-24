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
    Object.defineProperty(ChildListCallbackInterface, 'NS', {
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
    Object.defineProperty(ChildListCallbackInterface, 'CLASS_NAME', {
        value: 'ChildListCallbackInterface'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(ChildListCallbackInterface, 'SESSIONABLE', {
        value: true
    });

    // constructor:
    /**
     * Private Class for use with {{#crossLink "LinkableHashMap"}}{{/crossLink}}
     * @class ChildListCallbackInterface
     * @extends CallbackCollection
     * @private
     * @constructor
     */
    function ChildListCallbackInterface() {

        // specify the preCallback function in super() so list callback
        // variables will be set before each change callback.
        weavecore.CallbackCollection.call(this, this._setCallbackVariables);
        /**
         * returned by public getter
         * @private
         * @property _lastNameAdded
         * @default null
         * @type String
         **/
        this._lastNameAdded = null;
        /**
         * returned by public getter
         * @private
         * @property _lastObjectAdded
         * @default null
         * @type ILinkableObject
         **/
        this._lastObjectAdded = null;
        /**
         * returned by public getter
         * @private
         * @property _lastNameRemoved
         * @default null
         * @type String
         **/
        this._lastNameRemoved = null;
        /**
         * returned by public getter
         * @private
         * @property _lastObjectRemoved
         * @default null
         * @type ILinkableObject
         **/
        this._lastObjectRemoved = null;

        /**
         * This is the name of the object that was added prior to running callbacks.
         * @public
         * @property lastNameAdded
         * @readOnly
         * @type String
         */
        Object.defineProperty(this, 'lastNameAdded', {
            get: function () {
                return this._lastNameAdded;
            }
        });

        /**
         * This is the object that was added prior to running callbacks.
         * @public
         * @property lastObjectAdded
         * @readOnly
         * @type ILinkableObject
         */
        Object.defineProperty(this, 'lastObjectAdded', {
            get: function () {
                return this._lastObjectAdded;
            }
        });

        /**
         * This is the name of the object that was removed prior to running callbacks.
         * @public
         * @property lastNameRemoved
         * @readOnly
         * @type String
         */
        Object.defineProperty(this, 'lastNameRemoved', {
            get: function () {
                return this._lastNameRemoved;
            }
        });

        /**
         * This is the object that was removed prior to running callbacks.
         * @public
         * @property lastObjectRemoved
         * @readOnly
         * @type ILinkableObject
         */
        Object.defineProperty(this, 'lastObjectRemoved', {
            get: function () {
                return this._lastObjectRemoved;
            }
        });

    }

    ChildListCallbackInterface.prototype = new weavecore.CallbackCollection();
    ChildListCallbackInterface.prototype.constructor = ChildListCallbackInterface;

    var p = ChildListCallbackInterface.prototype;
    /**
     * This function will set the list callback variables:
     *     lastNameAdded, lastObjectAdded, lastNameRemoved, lastObjectRemoved, childListChanged
     * @method _setCallbackVariables
     * @private
     * @param {String} name This is the name of the object that was just added or removed from the hash map.
     * @param {ILinkableObject} objectAdded This is the object that was just added to the hash map.
     * @param {ILinkableObject} objectRemoved This is the object that was just removed from the hash map.
     */
    p._setCallbackVariables = function (name, objectAdded, objectRemoved) {
        this._lastNameAdded = objectAdded ? name : null;
        this._lastObjectAdded = objectAdded;
        this._lastNameRemoved = objectRemoved ? name : null;
        this._lastObjectRemoved = objectRemoved;
    };

    /**
     * This function will run callbacks immediately, setting the list callback variables before each one.
     * @method runCallbacks
     * @param {String} name
     * @param {ILinkableObject} objectAdded
     * @param {ILinkableObject} objectRemoved
     */
    p.runCallbacks = function (name, objectAdded, objectRemoved) {
        // remember previous values
        var _name = this._lastNameAdded || this._lastNameRemoved;
        var _added = this._lastObjectAdded;
        var _removed = this._lastObjectRemoved;

        this._runCallbacksImmediately(name, objectAdded, objectRemoved);

        // restore previous values (in case an external JavaScript popup caused us to interrupt something else)
        this._setCallbackVariables.call(this, _name, _added, _removed);
    };



    weavecore.ChildListCallbackInterface = ChildListCallbackInterface;

}());
