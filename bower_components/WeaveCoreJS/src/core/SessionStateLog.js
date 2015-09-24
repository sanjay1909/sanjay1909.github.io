if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This class saves the session history of an ILinkableObject.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {

    /**
     * This is an entry in the session history log.  It contains both undo and redo session state diffs.
     * The triggerDelay is the time it took for the user to make a change since the last synchronization.
     * This time difference does not include the time it took to set the session state.  This way, when
     * the session state is replayed at a reasonable speed regardless of the speed of the computer.
     * @param id
     * @param forward The diff for applying redo.
     * @param backward The diff for applying undo.
     * @param triggerDelay The length of time between the last synchronization and the diff.
     */
    function LogEntry(id, forward, backward, triggerDelay, diffDuration) {
        this.id = id;
        this.forward = forward; // the diff for applying redo
        this.backward = backward; // the diff for applying undo
        this.triggerDelay = triggerDelay; // the length of time between the last synchronization and the diff
        this.diffDuration = diffDuration; // the length of time in which the diff took place
    }

    /**
     * This will convert an Array of generic objects to an Array of LogEntry objects.
     * Generic objects are easier to create backwards compatibility for.
     */
    LogEntry.convertGenericObjectsToLogEntries = function (array, defaultTriggerDelay) {
        for (var i = 0; i < array.length; i++) {
            var o = array[i];
            if (!(o instanceof LogEntry))
                array[i] = new LogEntry(o.id, o.forward, o.backward, o.triggerDelay || defaultTriggerDelay, o.diffDuration);
        }
        return array;
    };


    function getTimer() {
        var start = new Date().getTime();
        return start;
    }

    function SessionStateLog(subject, syncDelay) {
        // set default values
        if (syncDelay === undefined)
            syncDelay = 0;
        this._subject = subject; // the object we are monitoring
        this._syncDelay = syncDelay; // the number of milliseconds to wait before automatically synchronizing
        this._prevState = WeaveAPI.SessionManager.getSessionState(this._subject); // remember the initial state

        /**
         * When this is set to true, changes in the session state of the subject will be automatically logged.
         */
        SessionStateLog.prototype.enableLogging = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean(true), this.synchronizeNow.bind(this));


        WeaveAPI.SessionManager.registerDisposableChild(this._subject, this); // make sure this is disposed when _subject is disposed

        var cc = WeaveAPI.SessionManager.getCallbackCollection(this._subject);
        cc.addImmediateCallback(this, this._immediateCallback.bind(this));
        cc.addGroupedCallback(this, this._groupedCallback.bind(this));

        this._undoHistory = []; // diffs that can be undone
        this._redoHistory = []; // diffs that can be redone
        this._nextId = 0; // gets incremented each time a new diff is created
        this._undoActive = false; // true while an undo operation is active
        this._redoActive = false; // true while a redo operation is active

        this._syncTime = getTimer(); // this is set to getTimer() when synchronization occurs
        this._triggerDelay = -1; // this is set to (getTimer() - _syncTime) when immediate callbacks are triggered for the first time since the last synchronization occurred
        this._saveTime = 0; // this is set to getTimer() + _syncDelay to determine when the next diff should be computed and logged
        this._savePending = false; // true when a diff should be computed

        Object.defineProperty(SessionStateLog, 'debug', {
            value: true,
            writable: true
        });
        Object.defineProperty(SessionStateLog, 'enableHistoryRewrite', {
            value: true,
            writable: true
        });

        /**
         * @TODO create an interface for the objects in this Array
         */
        Object.defineProperty(this, 'undoHistory', {
            get: function () {
                return this._undoHistory;
            }
        });

        /**
         * @TODO create an interface for the objects in this Array
         */
        Object.defineProperty(this, 'redoHistory', {
            get: function () {
                return this._redoHistory;
            }
        });

    }

    SessionStateLog.prototype = new weavecore.LinkableVariable();
    SessionStateLog.prototype.constructor = SessionStateLog;

    var p = SessionStateLog.prototype;


    /**
     * @inheritDoc
     */
    p.dispose = function () {
        if (this._undoHistory === null || this._undoHistory === undefined)
            console.log("SessionStateLog.dispose() called more than once");

        this._subject = null;
        this._undoHistory = null;
        this._redoHistory = null;
    };

    /**
     * This function will save any pending diff in session state.
     * Use this function only when necessary (for example, when writing a collaboration service that must synchronize).
     */
    p.synchronizeNow = function () {
        this._saveDiff.call(this, true);
    };



    /**
     * This gets called as an immediate callback of the subject.
     */
    p._immediateCallback = function () {
        if (!this.enableLogging.value)
            return;

        // we have to wait until grouped callbacks are called before we save the diff
        this._saveTime = Number.MAX_VALUE;

        // make sure only one call to saveDiff() is pending
        if (!this._savePending) {
            this._savePending = true;
            this._saveDiff.call(this);
        }


        if (SessionStateLog.debug && (this._undoActive || this._redoActive)) {
            var state = WeaveAPI.SessionManager.getSessionState(this._subject);
            var forwardDiff = WeaveAPI.SessionManager.computeDiff(this._prevState, state);
            console.log('immediate diff:', forwardDiff);
        }
    };

    /**
     * This gets called as a grouped callback of the subject.
     */
    p._groupedCallback = function () {
        if (!this.enableLogging.value)
            return;

        // Since grouped callbacks are currently running, it means something changed, so make sure the diff is saved.
        this._immediateCallback();
        // It is ok to save a diff some time after the last time grouped callbacks are called.
        // If callbacks are triggered again before the next frame, the immediateCallback will reset this value.
        this._saveTime = getTimer() + this._syncDelay;

        if (SessionStateLog.debug && (this._undoActive || this._redoActive)) {
            var state = WeaveAPI.SessionManager.getSessionState(this._subject);
            var forwardDiff = WeaveAPI.SessionManager.computeDiff(this._prevState, state);
            console.log('grouped diff:', forwardDiff);
        }
    };

    /**
     * This will save a diff in the history, if there is any.
     * @param immediately Set to true if it should be saved immediately, or false if it can wait.
     */
    p._saveDiff = function (immediately) {
        //console.log("save difference is called");
        if (immediately === undefined) {
            immediately = false;
        }
        if (!this.enableLogging.value) {
            this._savePending = false;
            return;
        }

        var currentTime = getTimer();

        // remember how long it's been since the last synchronization
        if (this._triggerDelay < 0)
            this._triggerDelay = currentTime - this._rsyncTime;

        if (!immediately && getTimer() < this._saveTime) {
            // console.log("save difference is Paused");
            // we have to wait until the next frame to save the diff because grouped callbacks haven't finished.
            weavecore.StageUtils.callLater(this, this._saveDiff.bind(this));
            return;
        }

        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks.call(cc);

        // console.log("save difference is executed");

        var state = WeaveAPI.SessionManager.getSessionState(this._subject);
        var forwardDiff = WeaveAPI.SessionManager.computeDiff(this._prevState, state);
        if (forwardDiff !== undefined) {
            var diffDuration = currentTime - (this._rsyncTime + this._triggerDelay);
            var backwardDiff = WeaveAPI.SessionManager.computeDiff(state, this._prevState);
            var oldEntry;
            var newEntry;
            if (this._undoActive) {
                // To prevent new undo history from being added as a result of applying an undo, overwrite first redo entry.
                // Keep existing delay/duration.
                oldEntry = this._redoHistory[0];
                newEntry = new LogEntry(this._nextId++, backwardDiff, forwardDiff, oldEntry.triggerDelay, oldEntry.diffDuration);
                if (this.enableHistoryRewrite) {
                    this._redoHistory[0] = newEntry;
                } else if (weavecore.StandardLib.compare(oldEntry.forward, newEntry.forward) !== 0) {
                    this._redoHistory.unshift(newEntry);
                }
            } else {
                newEntry = new LogEntry(this._nextId++, forwardDiff, backwardDiff, this._triggerDelay, diffDuration);
                if (this._redoActive) {
                    // To prevent new undo history from being added as a result of applying a redo, overwrite last undo entry.
                    // Keep existing delay/duration.
                    oldEntry = this._undoHistory.pop();
                    newEntry.triggerDelay = oldEntry.triggerDelay;
                    newEntry.diffDuration = oldEntry.diffDuration;

                    if (!this.enableHistoryRewrite && weavecore.StandardLib.compare(oldEntry.forward, newEntry.forward) === 0)
                        newEntry = oldEntry; // keep old entry
                }
                // save new undo entry
                this._undoHistory.push(newEntry);
            }

            if (SessionStateLog.debug)
                debugHistory.call(this, newEntry);

            this._rsyncTime = currentTime; // remember when diff was saved
            cc.triggerCallbacks.call(cc);
        }

        // always reset sync time after undo/redo even if there was no new diff
        if (this._undoActive || this._redoActive)
            this._rsyncTime = currentTime;
        this._prevState = state;
        this._undoActive = false;
        this._redoActive = false;
        this._savePending = false;
        this._triggerDelay = -1;

        cc.resumeCallbacks.call(cc);
    };



    /**
     * This will undo a number of steps from the saved history.
     * @param numberOfSteps The number of steps to undo.
     */
    p.undo = function (numberOfSteps) {
        if (isNaN(numberOfSteps))
            numberOfSteps = 1;
        this.applyDiffs.call(this, -numberOfSteps);
    };

    /**
     * This will redo a number of steps that have been previously undone.
     * @param numberOfSteps The number of steps to redo.
     */
    p.redo = function (numberOfSteps) {
        if (isNaN(numberOfSteps))
            numberOfSteps = 1;
        this.applyDiffs.call(this, numberOfSteps);
    };

    /**
     * This will clear all undo and redo history.
     * @param directional Zero will clear everything. Set this to -1 to clear all undos or 1 to clear all redos.
     */
    p.clearHistory = function (directional) {
        if (directional === undefined) directional = 0;
        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();

        this.synchronizeNow();

        if (directional <= 0) {
            if (this._undoHistory.length > 0)
                cc.triggerCallbacks("Log: Clear History Undo > 0");
            this._undoHistory.length = 0;
        }
        if (directional >= 0) {
            if (this._redoHistory.length > 0)
                cc.triggerCallbacks("Log: Clear History Redo > 0");
            this._redoHistory.length = 0;
        }

        cc.resumeCallbacks();
    };

    /**
     * This will apply a number of undo or redo steps.
     * @param delta The number of steps to undo (negative) or redo (positive).
     */
    p.applyDiffs = function (delta) {
        var stepsRemaining = Math.min(Math.abs(delta), delta < 0 ? this._undoHistory.length : this._redoHistory.length);
        if (stepsRemaining > 0) {
            var logEntry;
            var diff;
            var debug = SessionStateLog.debug && stepsRemaining === 1;

            // if something changed and we're not currently undoing/redoing, save the diff now
            if (this._savePending && !this._undoActive && !this._redoActive)
                this.synchronizeNow();

            var combine = stepsRemaining > 2;
            var baseDiff = null;
            WeaveAPI.SessionManager.getCallbackCollection(this._subject).delayCallbacks.call(this._subject);
            // when logging is disabled, revert to previous state before applying diffs
            if (!this.enableLogging.value) {
                var state = WeaveAPI.SessionManager.getSessionState(this._subject);
                // baseDiff becomes the change that needs to occur to get back to the previous state
                baseDiff = WeaveAPI.SessionManager.computeDiff(state, this._prevState);
                if (baseDiff !== null && baseDiff !== undefined)
                    combine = true;
            }
            while (stepsRemaining-- > 0) {
                if (delta < 0) {
                    logEntry = this._undoHistory.pop();
                    this._redoHistory.unshift(logEntry);
                    diff = logEntry.backward;
                } else {
                    logEntry = this._redoHistory.shift();
                    this._undoHistory.push(logEntry);
                    diff = logEntry.forward;
                }
                if (debug)
                    console.log('apply ' + (delta < 0 ? 'undo' : 'redo'), logEntry.id + ':', diff);

                if (stepsRemaining === 0 && this.enableLogging.value) {
                    // remember the session state right before applying the last step so we can rewrite the history if necessary
                    this._prevState = WeaveAPI.SessionManager.getSessionState(this._subject);
                }

                if (combine) {
                    baseDiff = WeaveAPI.SessionManager.combineDiff(baseDiff, diff);
                    if (stepsRemaining <= 1) {
                        WeaveAPI.SessionManager.setSessionState(this._subject, baseDiff, false);
                        combine = false;
                    }
                } else {
                    WeaveAPI.SessionManager.setSessionState(this._subject, diff, false);
                }

                if (debug) {
                    var newState = WeaveAPI.SessionManager.getSessionState(this._subject);
                    var resultDiff = WeaveAPI.SessionManager.computeDiff(this._prevState, newState);
                    console.log('resulting diff:', resultDiff);
                }
            }

            WeaveAPI.SessionManager.getCallbackCollection(this._subject).resumeCallbacks.call(this._subject);

            this._undoActive = delta < 0 && this._savePending;
            this._redoActive = delta > 0 && this._savePending;
            if (!this._savePending) {
                this._prevState = WeaveAPI.SessionManager.getSessionState(this._subject);
            }
            var slcc = WeaveAPI.SessionManager.getCallbackCollection(this);
            slcc.triggerCallbacks.call(slcc);
        }
    };



    function debugHistory(logEntry) {
        var h = this._undoHistory.concat();
        for (var i = 0; i < h.length; i++)
            h[i] = h[i].id;
        var f = this._redoHistory.concat();
        for (i = 0; i < f.length; i++)
            f[i] = f[i].id;
        if (logEntry) {
            console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            console.log('NEW HISTORY (backward) ' + logEntry.id + ':', logEntry.backward);
            console.log("===============================================================");
            console.log('NEW HISTORY (forward) ' + logEntry.id + ':', logEntry.forward);
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        }
        console.log('undo [' + h + ']', 'redo [' + f + ']');
    }

    /**
     * This will generate an untyped session state object that contains the session history log.
     * @return An object containing the session history log.
     */
    p.getSessionState = function () {
        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();
        this.synchronizeNow.call(this);

        // The "version" property can be used to detect old session state formats and should be incremented whenever the format is changed.
        var state = {
            "version": 0,
            "currentState": this._prevState,
            "undoHistory": this._undoHistory.concat(),
            "redoHistory": this._redoHistory.concat(),
            "nextId": this._nextId
                // not including enableLogging
        };

        cc.resumeCallbacks();
        return state;
    };

    /**
     * This will load a session state log from an untyped session state object.
     * @param input The ByteArray containing the output from seralize().
     */
    p.setSessionState = function (state) {
        // make sure callbacks only run once while we set the session state
        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.delayCallbacks();
        this.enableLogging.delayCallbacks();
        try {
            var version = state.version;
            switch (version) {
            case 0:
                {
                    // note: some states from version 0 may include enableLogging, but here we ignore it
                    this._prevState = state.currentState;
                    this._undoHistory = LogEntry.convertGenericObjectsToLogEntries(state.undoHistory, this._syncDelay);
                    this._redoHistory = LogEntry.convertGenericObjectsToLogEntries(state.redoHistory, this._syncDelay);
                    this._nextId = state.nextId;

                    break;
                }
            default:
                console.log("Weave history format version " + version + " is unsupported.");
            }

            // reset these flags so nothing unexpected happens in later frames
            this._undoActive = false;
            this._redoActive = false;
            this._savePending = false;
            this._saveTime = 0;
            this._triggerDelay = -1;
            this._rsyncTime = getTimer();

            WeaveAPI.SessionManager.setSessionState(this._subject, this._prevState);
        } finally {
            this.enableLogging.resumeCallbacks();
            cc.triggerCallbacks("Log: Setsessionstate");
            cc.resumeCallbacks();
        }
    };
    weavecore.SessionStateLog = SessionStateLog;

}());
