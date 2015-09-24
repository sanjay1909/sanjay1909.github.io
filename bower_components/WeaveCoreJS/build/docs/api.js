YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "CallbackCollection",
        "CallbackEntry",
        "ChildListCallbackInterface",
        "DynamicState",
        "Event",
        "EventDispatcher",
        "GroupedCallbackEntry",
        "ILinkableObject",
        "LinkableDynamicObject",
        "LinkableHashMap",
        "LinkablePromise",
        "LinkableWatcher",
        "SessionManager",
        "Ticker"
    ],
    "modules": [
        "CreateJS",
        "weavecore"
    ],
    "allModules": [
        {
            "displayName": "CreateJS",
            "name": "CreateJS",
            "description": "A collection of Classes that are shared across all the CreateJS libraries.  The classes are included in the minified\nfiles of each library and are available on the createsjs namespace directly.\n\n<h4>Example</h4>\n\n     myObject.addEventListener(\"change\", createjs.proxy(myMethod, scope));"
        },
        {
            "displayName": "weavecore",
            "name": "weavecore"
        }
    ]
} };
});
