/*
    Weave (Web-based Analysis and Visualization Environment)
    Copyright (C) 2008-2011 University of Massachusetts Lowell
    This file is a part of Weave.
    Weave is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License, Version 3,
    as published by the Free Software Foundation.
    Weave is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with Weave.  If not, see <http://www.gnu.org/licenses/>.
*/

// namespace

if (!this.weavecore)
    this.weavecore = {};

/**
 * This allows you to add callbacks that will be called when an event occurs on the stage.
 *
 * WARNING: These callbacks will trigger on every mouse and keyboard event that occurs on the stage.
 *          Developers should not add any callbacks that run computationally expensive code.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {

    // Internal class constructor

    Object.defineProperty(EventCallbackCollection, 'eventTypes', {
        value: ['tick']
    });

    function EventCallbackCollection(eventManager, eventType) {
        weavecore.CallbackCollection.call(this, this.setEvent.bind(this));
        this._eventManager = eventManager;
        this._eventType = eventType;

    }

    EventCallbackCollection.prototype = new weavecore.CallbackCollection();
    EventCallbackCollection.prototype.constructor = EventCallbackCollection;

    var p = EventCallbackCollection.prototype;

    /**
     * This is the _preCallback
     */
    p.setEvent = function setEvent(event) {
        this._eventManager.event = event;
    };

    /**
     * This function remembers the previous event value, runs callbacks using the new event value,
     * then restores the previous event value. This is necessary because it is possible for a popup
     * browser window to interrupt Flash with requests in the middle of an event.
     */
    p.runEventCallbacks = function (event) {
        var previousEvent = this._eventManager.event; // remember previous value
        this._runCallbacksImmediately(event); // make sure event is set before each immediate callback
        this._preCallback(previousEvent); // restore the previous value
    };

    /**
     * Call this when the stage is available to set up event listeners.
     */
    p.listenToStage = function () {
        // do not create event listeners for these meta events
        //if (eventType == POINT_CLICK_EVENT || eventType == THROTTLED_MOUSE_MOVE_EVENT)
        //return;

        //if (eventType == KeyboardEvent.KEY_DOWN && Capabilities.playerType == "Desktop")
        //cancelable = false;

        // Add a listener to the capture phase so the callbacks will run before the target gets the event.
        //stage.addEventListener(eventType, captureListener, true, 0, true); // use capture phase

        // If the target is the stage, the capture listener won't be called, so add
        // an additional listener that runs callbacks when the stage is the target.
        createjs.Ticker.addEventListener(this._eventType, this._tickerListener.bind(this)); // do not use capture phase

        // when callbacks are disposed, remove the listeners
        this.addDisposeCallback(null, function () {
            //stage.removeEventListener(eventType, captureListener, true);
            createjs.Ticker.removeEventListener(this._eventType, this._tickerListener.bind(this));
        });
    };

    p._tickerListener = function (event) {
        this._eventManager.eventTime = new Date().getTime();
        if (this._eventType === "tick") {
            if (this._eventManager.userActivity > 0 && !this._eventManager.mouseButtonDown)
                this._eventManager.userActivity--;
            this._eventManager.previousFrameElapsedTime = this._eventManager.eventTime - this._eventManager.currentFrameStartTime;
            this._eventManager.currentFrameStartTime = this._eventManager.eventTime;
            //this._eventManager.triggeredThrottledMouseThisFrame = false;
        }
        // finally, trigger callbacks for non-mouse-move events
        if (this._eventType === "tick") // altered temporarily
            this.runEventCallbacks(event);

    };

    weavecore.EventCallbackCollection = EventCallbackCollection;

    //constructor
    function StageUtils() {

        this.averageFrameTime = 0;

        Object.defineProperties(this, {
            eventManager: {
                value: new EventManager()
            },
            frameTimes: {
                value: []
            },
            _stackTraceMap: {
                value: new Map()
            },
            _taskElapsedTime: {
                value: new Map()
            },
            _taskStartTime: {
                value: new Map()
            },

        });
        this._currentTaskStopTime = 0;

        /**
         * This is an Array of "callLater queues", each being an Array of function invocations to be done later.
         * The Arrays get populated by callLater().
         * There are four nested Arrays corresponding to the four priorities (0, 1, 2, 3) defined by static constants in WeaveAPI.
         */
        Object.defineProperties(this, {
            _priorityCallLaterQueues: {
                value: [[], [], [], []]
            },
            _priorityAllocatedTimes: {
                value: [Number.MAX_VALUE, 300, 200, 100]
            }
        });
        this._activePriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE + 1; // task priority that is currently being processed
        this._activePriorityElapsedTime = 0;
        this._deactivatedMaxComputationTimePerFrame = 1000;
        this._nextCallLaterPriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE; // private variable to control the priority of the next callLater() internally
        this.addEventCallback("tick", null, this._handleCallLater.bind(this));
        this.maxComputationTimePerFrame = 100;
        this.maxComputationTimePerFrame_noActivity = 250;

    }

    var suP = StageUtils.prototype;
    suP.getMaxComputationTimePerFrame = function () {
        return this.maxComputationTimePerFrame;
    };

    suP.setMaxComputationTimePerFrame = function (value) {
        // this.eventManager.throttledMouseMoveInterval = value;
        this.maxComputationTimePerFrame = value;
    };

    suP.getTaskPriorityTimeAllocation = function (priority) {
        return this._priorityAllocatedTimes[priority];
    };

    suP.setTaskPriorityTimeAllocation = function (priority, milliseconds) {
        this._priorityAllocatedTimes[priority] = Math.max(milliseconds, 5);
    };

    StageUtils._time;
    StageUtils._times = [];

    suP.callLater = function (relevantContext, method, parameters) {
        if (method === null || method === undefined) {
            console.log('StageUtils.callLater(): received null "method" parameter');
            return;
        }

        this._priorityCallLaterQueues[this._nextCallLaterPriority].push(arguments);
        this._nextCallLaterPriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE;

        //if (this.debug_async_stack)
        //_stackTraceMap[arguments] = new Error("This is the stack trace from when callLater() was called.").getStackTrace();
    };

    suP._handleCallLater = function () {
        if (this.maxComputationTimePerFrame === 0)
            this.maxComputationTimePerFrame = 100;

        var maxComputationTime;
        if (this.eventManager.useDeactivatedFrameRate)
            maxComputationTime = this._deactivatedMaxComputationTimePerFrame;
        else if (!this.eventManager.userActivity)
            maxComputationTime = this.maxComputationTimePerFrame_noActivity;
        else
            maxComputationTime = this.maxComputationTimePerFrame;
        if (!this.eventManager.event) {
            console.log("StageUtils.handleCallLater(): _event is null. This should never happen.");
            return;
        }
        if (this.eventManager.event.type === "tick") {
            //resetDebugTime();

            /*if (debug_fps)
            {
                frameTimes.push(previousFrameElapsedTime);
                if (StandardLib.sum(frameTimes) >= 1000)
                {
                    averageFrameTime = StandardLib.mean(frameTimes);
                    var fps:Number = StandardLib.roundSignificant(1000 / averageFrameTime, 2);
                    trace(fps,'fps; max computation time',maxComputationTime);
                    frameTimes.length = 0;
                }
            }*/

            if (this.eventManager.previousFrameElapsedTime > 3000)
                console.log('Previous frame took', this.eventManager.previousFrameElapsedTime, 'ms');
        }

        //if (UIComponentGlobals.callLaterSuspendCount > 0)
        //return;

        // The variables countdown and lastPriority are used to avoid running newly-added tasks immediately.
        // This avoids wasting time on async tasks that do nothing and return early, adding themselves back to the queue.

        var args;
        var args2; // this is set to args[2]
        var stackTrace;
        var now;
        var allStop = this.eventManager.currentFrameStartTime + maxComputationTime;

        this._currentTaskStopTime = allStop; // make sure _iterateTask knows when to stop

        // first run the functions that should be called before anything else.
        /*if (pauseForGCIfCollectionImminent != null)
        {
            var t:int = getTimer();
            pauseForGCIfCollectionImminent();
            t = getTimer() - t;
            if (t > maxComputationTimePerFrame)
                trace('paused',t,'ms for GC');
        }*/
        var queue = this._priorityCallLaterQueues[WeaveAPI.TASK_PRIORITY_IMMEDIATE];
        var countdown;
        for (countdown = queue.length; countdown > 0; countdown--) {
            /*if (debug_callLater)
                DebugTimer.begin();*/

            now = new Date().getTime();
            // stop when max computation time is reached for this frame
            if (now > allStop) {
                /*if (debug_callLater)
                    DebugTimer.cancel();*/
                return;
            }

            // args: (relevantContext:Object, method:Function, parameters:Array, priority:uint)
            args = queue.shift();
            stackTrace = this._stackTraceMap[args];

            // don't call the function if the relevantContext was disposed.
            if (!WeaveAPI.SessionManager.objectWasDisposed(args[0])) {
                args2 = args[2];
                if (args2 !== null && args2 && args2.length > 0)
                    args[1].apply(null, args2);
                else
                    args[1].call();
            }

            /*if (debug_callLater)
                DebugTimer.end(stackTrace);*/
        }

        //			trace('-------');

        var minPriority = WeaveAPI.TASK_PRIORITY_IMMEDIATE + 1;
        var lastPriority = this._activePriority === minPriority ? this._priorityCallLaterQueues.length - 1 : this._activePriority - 1;
        var pStart = new Date().getTime();
        var pAlloc = this._priorityAllocatedTimes[this._activePriority];
        if (this.eventManager.useDeactivatedFrameRate)
            pAlloc = pAlloc * this._deactivatedMaxComputationTimePerFrame / this.maxComputationTimePerFrame;
        else if (!this.eventManager.userActivity)
            pAlloc = pAlloc * this.maxComputationTimePerFrame_noActivity / this.maxComputationTimePerFrame;
        var pStop = Math.min(allStop, pStart + pAlloc - this._activePriorityElapsedTime); // continue where we left off
        queue = this._priorityCallLaterQueues[this._activePriority];
        countdown = queue.length;
        while (true) {
            /*if (debug_callLater)
					DebugTimer.begin();*/

            now = new Date().getTime();
            if (countdown === 0 || now > pStop) {
                // add the time we just spent on this priority
                this._activePriorityElapsedTime += now - pStart;

                // if max computation time was reached for this frame or we have visited all priorities, stop now
                if (now > allStop || this._activePriority === lastPriority) {
                    /*if (debug_callLater)
							DebugTimer.cancel();
						if (debug_fps)
							trace('spent',currentFrameElapsedTime,'ms');*/
                    return;
                }

                // see if there are any entries left in the queues (except for the immediate queue)
                var remaining = 0;
                for (var i = minPriority; i < this._priorityCallLaterQueues.length; i++)
                    remaining += this._priorityCallLaterQueues[i].length;
                // stop if no more entries
                if (remaining === 0) {
                    /*if (debug_callLater)
							DebugTimer.cancel();*/
                    break;
                }

                // switch to next priority, reset elapsed time
                this._activePriority++;
                this._activePriorityElapsedTime = 0;
                if (this._activePriority === this._priorityCallLaterQueues.length)
                    this._activePriority = minPriority;
                pStart = now;
                pAlloc = this._priorityAllocatedTimes[_activePriority];
                if (this.eventManager.useDeactivatedFrameRate)
                    pAlloc = pAlloc * this._deactivatedMaxComputationTimePerFrame / this.maxComputationTimePerFrame;
                else if (!this.eventManager.userActivity)
                    pAlloc = pAlloc * this.maxComputationTimePerFrame_noActivity / this.maxComputationTimePerFrame;
                pStop = Math.min(allStop, pStart + pAlloc);
                queue = this._priorityCallLaterQueues[this._activePriority];
                countdown = queue.length;

                // restart loop to check stopping condition
                /*if (debug_callLater)
						DebugTimer.cancel();*/
                continue;
            }

            countdown--;

            //				trace('p',_activePriority,pElapsed,'/',pAlloc);
            _currentTaskStopTime = pStop; // make sure _iterateTask knows when to stop

            // call the next function in the queue
            // args: (relevantContext:Object, method:Function, parameters:Array, priority:uint)
            args = queue.shift();
            stackTrace = this._stackTraceMap[args]; // check this for debugging where the call came from

            //				WeaveAPI.SessionManager.unassignBusyTask(args);

            // don't call the function if the relevantContext was disposed.
            if (!WeaveAPI.SessionManager.objectWasDisposed(args[0])) {
                // TODO: PROFILING: check how long this function takes to execute.
                // if it takes a long time (> 1000 ms), something's wrong...
                args2 = args[2];
                if (args2 !== null && args2.length > 0)
                    args[1].apply(null, args2);
                else
                    args[1].call();
            }

            /*if (debug_callLater)
					DebugTimer.end(stackTrace);*/
        }

    };

    suP.addEventCallback = function (eventType, relevantContext, callback, runCallbackNow) {
        // set default parameter value
        if (runCallbackNow === null || runCallbackNow === undefined) {
            runCallbackNow = false;
        }
        var cc = this.eventManager.callbackCollections[eventType];
        if (cc !== null && cc !== undefined) {
            cc.addImmediateCallback(relevantContext, callback, runCallbackNow);
        } else {
            console.log("(StageUtils) Unsupported event: ", eventType);
        }
    };



    weavecore.StageUtils = new StageUtils();


    function EventManager() {
        Object.defineProperty(this, 'callbackCollections', {
            value: {}
        });
        this.userActivity = 0; // greater than 0 when there was user activity since the last frame.
        this.event = null;
        this.eventTime = 0;
        this.shiftKey = false;
        this.altKey = false;
        this.ctrlKey = false;
        this.mouseButtonDown = false;

        this.currentFrameStartTime = new Date().getTime(); // this is the result of getTimer() on the last ENTER_FRAME event.
        this.previousFrameElapsedTime = 0; // this is the amount of time it took to process the previous frame.
        this.pointClicked = false;
        this.deactivated = true; // true when application is deactivated
        this.useDeactivatedFrameRate = false;

        this.triggeredThrottledMouseThisFrame = false; // set to false on enterFrame, set to true on throttled mouse move
        this.nextThrottledMouseMoveTime = 0; // time threshold before triggering throttled mouse move again
        this.throttledMouseMoveInterval = 100; // time threshold before triggering throttled mouse move again

        // create a new callback collection for each type of event
        for (var j = 0; j < EventCallbackCollection.eventTypes.length; j++) {
            var type = EventCallbackCollection.eventTypes[j];
            this.callbackCollections[type] = new EventCallbackCollection(this, type);
            // this.callbackCollections[type] = WeaveAPI.SessionManager.registerDisposableChild(WeaveAPI.globalHashMap, new EventCallbackCollection(this, type));
        }

        //add event listeners
        for (var eventtype in this.callbackCollections) {
            this.callbackCollections[eventtype].listenToStage();
        }
        this.event;
    }


    weavecore.EventManager = EventManager;



}());
