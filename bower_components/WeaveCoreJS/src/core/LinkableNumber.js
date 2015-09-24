if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This is a LinkableVariable which limits its session state to Number values.
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
    Object.defineProperty(LinkableNumber, 'NS', {
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
    Object.defineProperty(LinkableNumber, 'CLASS_NAME', {
        value: 'LinkableNumber'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableNumber, 'SESSIONABLE', {
        value: true
    });

    function LinkableNumber(defaultValue, verifier, defaultValueTriggersCallbacks) {
        // set default values for Parameters
        if (defaultValue === undefined) defaultValue = NaN;
        if (verifier === undefined) verifier = null;
        if (defaultValueTriggersCallbacks === undefined) defaultValueTriggersCallbacks = true;

        // Note: Calling  weavecore.LinkableVariable.call() will set all the default values for member variables defined in the super class,
        // which means we can't set _sessionStateInternal = NaN here.
        weavecore.LinkableVariable.call(this, "number", verifier, arguments.length ? defaultValue : undefined, defaultValueTriggersCallbacks);

        Object.defineProperty(this, 'value', {
            get: function () {
                return this._sessionStateExternal;
            },
            set: function (val) {
                this.setSessionState(val);
            }
        });

    }

    LinkableNumber.prototype = new weavecore.LinkableVariable();
    LinkableNumber.prototype.constructor = LinkableNumber;

    var p = LinkableNumber.prototype;


    p.setSessionState = function (val) {
        if (typeof (val) != "number") {
            if (val === null || val === '' || val === undefined) val = NaN;
            else val = Number(val);
        }
        weavecore.LinkableVariable.prototype.setSessionState.call(this, val);
    };

    p.sessionStateEquals = function (otherSessionState) {
        // We must check for null here because we can't set _sessionStateInternal = NaN in the constructor.
        if (this._sessionStateInternal === null || this._sessionStateInternal === undefined)
            this._sessionStateInternal = this._sessionStateExternal = NaN;
        if (isNaN(this._sessionStateInternal) && isNaN(otherSessionState))
            return true;
        return this._sessionStateInternal === otherSessionState;
    };

    weavecore.LinkableNumber = LinkableNumber;

}());
