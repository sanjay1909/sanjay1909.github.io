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

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableWatcher, 'NS', {
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
    Object.defineProperty(LinkableWatcher, 'CLASS_NAME', {
        value: 'LinkableWatcher'
    });

    /**
     * TO-DO:temporary solution for checking class in sessionable
     * @static
     * @public
     * @property SESSIONABLE
     * @readOnly
     * @type String
     */
    Object.defineProperty(LinkableWatcher, 'SESSIONABLE', {
        value: true
    });

    // constructor:
    /**
     * This is used to dynamically attach a set of callbacks to different targets.
     * The callbacks of the LinkableWatcher will be triggered automatically when the
     * target triggers callbacks, changes, becomes null or is disposed.
     * Instead of calling this constructor directly, consider using one of the {{#crossLink "SessionManager"}}{{/crossLink}} functions
     * {{#crossLink "SessionManager/registerLinkableChild:method"}}{{/crossLink}} or  {{#crossLink "SessionManager/registerDisposableChild:method"}}{{/crossLink}} to make sure the watcher will get disposed automatically.
     * @class LinkableWatcher
     * @extends ILinkableObject
     * @constructor
     * @param {Class} typeRestriction Optionally restricts which type of targets this watcher accepts.
     * @param {Function} immediateCallback A function to add as an immediate callback.
     * @param {Function} groupedCallback A function to add as a grouped callback.
     */
    function LinkableWatcher(typeRestriction, immediateCallback, groupedCallback) {
        if (typeRestriction === undefined) typeRestriction = null;
        if (immediateCallback === undefined) immediateCallback = null;
        if (groupedCallback === undefined) groupedCallback = null;

        weavecore.ILinkableObject.call(this);

        this._typeRestriction = typeRestriction;

        if (immediateCallback !== null)
            WeaveAPI.SessionManager.getCallbackCollection(this).addImmediateCallback(null, immediateCallback);

        if (groupedCallback !== null)
            WeaveAPI.SessionManager.getCallbackCollection(this).addGroupedCallback(null, groupedCallback);

        this._target; // the current target or ancestor of the to-be-target
        this._foundTarget = true; // false when _target is not the desired target
        this._targetPath; // the path that is being watched
        this._pathDependencies = new Map(); // Maps an ILinkableDynamicObject to its previous internalObject.

        Object.defineProperty(this, 'targetPath', {
            /**
             * This is the path that is currently being watched for linkable object targets.
             */
            get: function () {
                return this._targetPath ? this._targetPath.concat() : null;
            },
            /**
             * This will set a path which should be watched for new targets.
             * Callbacks will be triggered immediately if the path changes or points to a new target.
             */
            set: function (path) {
                // do not allow watching the globalHashMap
                if (path && path.length === 0)
                    path = null;
                if (weavecore.StandardLib.compare(this._targetPath, path) !== 0) {
                    var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
                    cc.delayCallbacks();

                    this._resetPathDependencies();
                    this._targetPath = path;
                    this._handlePath();
                    cc.triggerCallbacks();

                    cc.resumeCallbacks();
                }
            },
            configurable: true
        });

        Object.defineProperty(this, 'target', {
            /**
             * This is the linkable object currently being watched.
             * Setting this will unset the targetPath.
             */
            get: function () {
                return this._foundTarget ? this._target : null;
            },
            set: function (newTarget) {
                var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
                cc.delayCallbacks();
                this.targetPath = null;
                this.internalSetTarget(newTarget);
                cc.resumeCallbacks();
            },
            configurable: true
        });

    }

    LinkableWatcher.prototype = new weavecore.ILinkableObject();
    LinkableWatcher.prototype.constructor = LinkableWatcher;

    var p = LinkableWatcher.prototype;

    /**
     * This sets the new target to be watched without resetting targetPath.
     * Callbacks will be triggered immediately if the new target is different from the old one.
     */
    p.internalSetTarget = function (newTarget) {
        if (this._foundTarget && this._typeRestriction)
            newTarget = newTarget;

        // do nothing if the targets are the same.
        if (_target === newTarget)
            return;

        var sm = WeaveAPI.SessionManager;

        // unlink from old target
        if (this._target) {
            sm.getCallbackCollection(this._target).removeCallback(this._handleTargetTrigger);
            sm.getCallbackCollection(this._target).removeCallback(this._handleTargetDispose);
            // if we own the previous target, dispose it
            if (sm.getLinkableOwner(this._target) === this)
                sm.disposeObject(this._target);
            else
                sm.unregisterLinkableChild(this, this._target);
        }

        this._target = newTarget;

        // link to new target
        if (this._target) {
            // we want to register the target as a linkable child (for busy status)
            sm.registerLinkableChild(this, _target);
            // we don't want the target triggering our callbacks directly
            sm.getCallbackCollection(this._target).removeCallback(sm.getCallbackCollection(this).triggerCallbacks);
            sm.getCallbackCollection(this._target).addImmediateCallback(this, this._handleTargetTrigger.bind(this), false, true);
            // we need to know when the target is disposed
            sm.getCallbackCollection(this._target).addDisposeCallback(this, this._handleTargetDispose.bind(this));
        }

        if (this._foundTarget)
            this._handleTargetTrigger();
    };


    p._handleTargetTrigger = function () {
        if (this._foundTarget)
            WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
        else
            this._handlePath();
    };



    p._handleTargetDispose = function () {
        if (this._targetPath) {
            this._handlePath();
        } else {
            this._target = null;
            WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
        }
    };

    p._handlePath = function () {
        if (!this._targetPath) {
            this._foundTarget = true;
            this.internalSetTarget(null);
            return;
        }

        // traverse the path, finding ILinkableDynamicObject path dependencies along the way
        var sm = WeaveAPI.SessionManager;
        var node = WeaveAPI.globalHashMap;
        var subPath = [];
        for (var name of this._targetPath) {
            if (node instanceof weavecore.LinkableDynamicObject)
                this._addPathDependency(node);

            subPath[0] = name;
            var child = sm.getObject(node, subPath);
            if (child) {
                node = child;
            } else {
                // the path points to an object that doesn't exist yet
                if (node instanceof weavecore.LinkableHashMap) {
                    // watching childListCallbacks instead of the hash map accomplishes two things:
                    // 1. eliminate unnecessary calls to _handlePath()
                    // 2. avoid watching the root hash map (and registering the root as a child of the watcher)
                    node = node.childListCallbacks;
                }
                this._foundTarget = false;
                if (node instanceof weavecore.LinkableDynamicObject) {
                    if (this._target !== null) {
                        // path dependency code will detect changes to this node
                        this.internalSetTarget(null);
                        // must trigger here because _foundtarget is false
                        sm.getCallbackCollection(this).triggerCallbacks();
                    }
                } else
                    this.internalSetTarget(node);
                return;
            }
        }

        // we found a desired target if there is no type restriction or the object fits the restriction
        this._foundTarget = !this._typeRestriction || node instanceof this._typeRestriction;
        this.internalSetTarget(node);
    };

    p._addPathDependency = function (ldo) {
        var sm = WeaveAPI.SessionManager;
        if (!this._pathDependencies.get(ldo)) {
            this._pathDependencies.set(ldo, ldo.internalObject);
            sm.getCallbackCollection(ldo).addImmediateCallback(this, this._handlePathDependencies.bind(this));
            sm.getCallbackCollection(ldo).addDisposeCallback(this, this._handlePathDependencies.bind(this));
        }
    };


    p._handlePathDependencies = function () {
        var sm = WeaveAPI.SessionManager;
        for (var key of this._pathDependencies.keys()) {
            var ldo = key;
            if (sm.objectWasDisposed(ldo) || ldo.internalObject !== this._pathDependencies.get(ldo)) {
                this._resetPathDependencies();
                this._handlePath();
                return;
            }
        }
    };

    p._resetPathDependencies = function () {
        var sm = WeaveAPI.SessionManager;
        for (var key of this._pathDependencies.keys())
            sm.getCallbackCollection(key).removeCallback(this._handlePathDependencies);
        this._pathDependencies = new Map();
    };


    p.dispose = function () {
        this._targetPath = null;
        this._target = null;
        // everything else will be cleaned up automatically
    };

    weavecore.LinkableWatcher = LinkableWatcher;

    /*
			// JavaScript test code for path dependency case
			var lhm = weave.path('lhm').remove().request('LinkableHashMap');

			var a = lhm.push('a').request('LinkableDynamicObject').state(lhm.getPath('b', null));

			a.addCallback(function () {
			if (a.getType(null))
			console.log('a.getState(null): ', JSON.stringify(a.getState(null)));
			else
			console.log('a has no internal object');
			}, false, true);

			var b = lhm.push('b').request('LinkableDynamicObject').state(lhm.getPath('c'));

			// a has no internal object

			var c = lhm.push('c').request('LinkableDynamicObject').request(null, 'LinkableString').state(null, 'c value');

			// a.getState(null): []
			// a.getState(null): [{"className":"weave.core::LinkableString","objectName":null,"sessionState":null}]
			// a.getState(null): [{"className":"weave.core::LinkableString","objectName":null,"sessionState":"c value"}]

			b.remove(null);

			// a has no internal object

			b.request(null, 'LinkableString').state(null, 'b value');

			// a.getState(null): null
			// a.getState(null): "b value"
		*/
}());
