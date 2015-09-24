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


    // constructor:
    /**
     * @class LinkablePromise
     * @param {Function} A function to invoke, which must take zero parameters and may return an AsyncToken.
     * @param {Object} A description of the task as a String, or a function to call which returns a descriptive string.
     * @param {Boolean}
     * @constructor
     */

    function LinkablePromise(task, description, validateNow) {
        description = (description ? description : null);
        validateNow = (validateNow !== undefined ? validateNow : false);

        weavecore.ILinkableObject.call(this);

        this._lazy = true;
        this._invalidated = true;
        this._selfTriggeredCount = 0;

        this._result;
        this._error;

        this._task = task;
        this._description = description;
        this._callbackCollection = WeaveAPI.SessionManager.getCallbackCollection(this);
        this._callbackCollection.addImmediateCallback(null, _immediateCallback.bind(this));
        this._callbackCollection.addGroupedCallback(null, _groupedCallback.bind(this), validateNow);
        if (validateNow) {
            this._lazy = false;
            _immediateCallback.call(this);
        }

        /**
         * The result of calling the invoke function.
         * When this value is accessed, validate() will be called.
         * @public
         * @property result
         * @readOnly
         * @type Object
         */
        Object.defineProperty(this, 'result', {
            get: function () {
                this.validate()
                return this._result;
            }
        });

        /**
         * The error that occurred calling the invoke function.
         * When this value is accessed, validate() will be called.
         * @public
         * @property error
         * @readOnly
         * @type Object
         */
        Object.defineProperty(this, 'error', {
            get: function () {
                this.validate()
                return this._error;
            }
        });

    }

    LinkablePromise.prototype = new weavecore.ILinkableObject();
    LinkablePromise.prototype.constructor = LinkablePromise;

    // Prototypes
    var p = LinkablePromise.prototype;

    p.validate = function () {
        if (!this._lazy)
            return;

        this._lazy = false;

        if (this._invalidated)
            this._callbackCollection.triggerCallbacks();

    }

    function _immediateCallback() {
        // stop if self-triggered
        if (this._callbackCollection.triggerCounter === this._selfTriggeredCount)
            return;

        // reset variables
        this._invalidated = true;
        // _asyncToken = null;
        this._result = null;
        this._error = null;

        // TO-DO: Progress Indicator we are no longer waiting for the async task
        // WeaveAPI.ProgressIndicator.removeTask(_groupedCallback);

        // stop if lazy
        if (this._lazy)
            return;

        // stop if still busy because we don't want to invoke the task if an external dependency is not ready
        if (WeaveAPI.SessionManager.linkableObjectIsBusy(this)) {
            // make sure _groupedCallback() will not invoke the task.
            // this is ok to do since callbacks will be triggered again when the dependencies are no longer busy.
            this._invalidated = false;
            return;
        }


        var _tmp_description = null;
        if (this._description instanceof Function)
            _tmp_description = this._description();
        else
            _tmp_description = this._description;

        //TO-DO:Progress Indicator mark as busy starting now because we plan to start the task inside _groupedCallback()
        //WeaveAPI.ProgressIndicator.addTask(_groupedCallback, this, _tmp_description);
    }

    function _groupedCallback() {
        try {
            if (this._lazy || !this._invalidated)
                return;

            // _invalidated is true prior to invoking the task
            var invokeResult = this._task.apply(null);

            // if _invalidated has been set to false, it means _immediateCallback() was triggered from the task and it's telling us we should stop now.
            if (!this._invalidated)
                return;

            // set _invalidated to false now since we invoked the task
            this._invalidated = false;

            if (invokeResult instanceof Promise)
                invokeResult.then(_handleResult.bind(this), _handleFault.bind(this));
            else {
                _result = invokeResult;
                weavecore.StageUtils.callLater(this, _handleResult.bind(this));
                //_asyncToken = invokeResult as AsyncToken;
            }

            /*if (_asyncToken) {
                _asyncToken.addResponder(new AsyncResponder(_handleResult, _handleFault, _asyncToken));
            } else {
                _result = invokeResult;
                weavecore.StageUtils.callLater(this, _handleResult);
            }*/
        } catch (invokeError) {
            this._invalidated = false;
            this._error = invokeError;
            weavecore.StageUtils.callLater(this, _handleFault.bind(this));
        }
    }

    function _handleResult(result) {
        result = (result === undefined ? null : result);

        if (this._invalidated)
            return;

        //TO-DO: ProgressIndicator no longer busy
        // WeaveAPI.ProgressIndicator.removeTask(_groupedCallback);

        // if there is an result, save the result
        if (result)
            this._result = result;

        this._selfTriggeredCount = this._callbackCollection.triggerCounter + 1;
        this._callbackCollection.triggerCallbacks();
    }

    function _handleFault(fault) {
        fault = (fault === undefined ? null : fault);

        if (this._invalidated)
            return;

        //TO-DO:Progress Indicator no longer busy
        // WeaveAPI.ProgressIndicator.removeTask(_groupedCallback);

        // if there is an fault, save the error
        if (event)
            this._error = fault;

        this._selfTriggeredCount = this._callbackCollection.triggerCounter + 1;
        this._callbackCollection.triggerCallbacks();
    }



    /**
     * Registers dependencies of the LinkablePromise.
     * @method depend
     * @param dependencies {Array} Array of dependencies, Taken form JS Arguments Parameter
     */
    p.depend = function () {

        if (arguments) {
            for (var i = 0; i < arguments.length; i++) {
                var dependency = arguments[i];
                WeaveAPI.SessionManager.registerLinkableChild(this, dependency);
            }

        }

        return this;
    }

    p.dispose = function () {
        //TO-DO: Progress Indicator
        // WeaveAPI.ProgressIndicator.removeTask(_groupedCallback);
        this._lazy = true;
        this._invalidated = true;
        this._result = null;
        this._error = null;
    }

    weavecore.LinkablePromise = LinkablePromise;


}());
