if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to Boolean values.
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
    Object.defineProperty(LinkableBoolean, 'NS', {
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
    Object.defineProperty(LinkableBoolean, 'CLASS_NAME', {
        value: 'LinkableBoolean'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableBoolean, 'SESSIONABLE', {
        value: true
    });

    function LinkableBoolean(defaultValue, verifier, defaultValueTriggersCallbacks) {
        // set default values for Parameters
        if (verifier === undefined) verifier = null;
        if (defaultValueTriggersCallbacks === undefined) defaultValueTriggersCallbacks = true;

        weavecore.LinkableVariable.call(this, "boolean", verifier, defaultValue, defaultValueTriggersCallbacks);

        Object.defineProperty(this, 'value', {
            get: function () {
                return this._sessionStateExternal;
            },
            set: function (val) {
                this.setSessionState(val);
            }
        });

    }

    LinkableBoolean.prototype = new weavecore.LinkableVariable();
    LinkableBoolean.prototype.constructor = LinkableBoolean;

    var p = LinkableBoolean.prototype;


    p.setSessionState = function (val) {
        if (typeof (val) === "string") {
            val = weavecore.ObjectUtil.stringCompare(val, "true", true) === 0;
        }
        weavecore.LinkableVariable.prototype.setSessionState.call(this, val ? true : false);
    };

    weavecore.LinkableBoolean = LinkableBoolean;

}());
