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


if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * Facilitates the creation of dynamic trees.
 */
(function () {


    //----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----

    /**
     * Constructs a new WeaveTreeItem.
     * @param params An Object containing property values to set on the WeaveTreeItem.
     *               If params is a String, both <code>label</code> and <code>data</code> will be set to that String.
     */

    function WeaveTreeItem(params) {
        //set default values
        if (params === undefined) params = null;
        /**
         * Set this to change the constructor used for initializing child items.
         * This variable is intentionally uninitialized to avoid overwriting the value set by an extending class in its constructor.
         */
        this.childItemClass; // IMPORTANT - no initial value
        this._recursion = {}; // recursionName -> Boolean
        this._label = "";
        this._children = null;
        this._source = null;
        /**
         * Cached values that get invalidated when the source triggers callbacks.
         */
        this._cache = {};

        /**
         * Cached values of getCallbackCollection(source).triggerCounter.
         */
        this._counter = {};


        //----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----

        /**
         * This can be set to either a String or a Function.
         * This property is checked by Flex's default data descriptor.
         * If this property is not set, the <code>data</code> property will be used as the label.
         */
        Object.defineProperty(this, 'label', {
            get: function () {
                const id = 'label';
                if (this.isCached(id))
                    return this._cache[id];

                var str = this.getString(this._label, id);
                if (!str && this.data !== null && this.data !== undefined)
                    str = String(this.data);
                return this.cache(id, str);
            },
            set: function (value) {
                this._counter['label'] = undefined;
                this._label = value;
            }
        });




        Object.defineProperty(this, 'children', {
            /**
             * Gets a filtered copy of the child menu items.
             * When this property is accessed, refresh() will be called except if refresh() is already being called.
             * This property is checked by Flex's default data descriptor.
             */
            get: function () {
                const id = 'children';
                if (this.isCached(id))
                    return this._cache[id];

                var items = this.getObject(this._children, id);
                if (!items)
                    return this.cache(id, null);

                var result = items.map(WeaveTreeItem._mapItems.bind(this), this.childItemClass).filter(WeaveTreeItem._filterItems.bind(this));
                return this.cache(id, result);
            },
            /**
             * This can be set to either an Array or a Function that returns an Array.
             * The function can be like function():void or function(item:WeaveTreeItem):void.
             * The Array can contain either WeaveTreeItems or Objects, each of which will be passed to the WeaveTreeItem constructor.
             */
            set: function (value) {
                this._counter['children'] = undefined;
                this._children = value;
            }
        });


        /**
         * A pointer to the ILinkableObject that created this node.
         * This is used to determine when to invalidate cached values.
         */
        Object.defineProperty(this, 'source', {
            get: function () {
                if (this._source && WeaveAPI.SessionManager.objectWasDisposed(this._source)) {
                    this.source = null;
                }
                return this._source;
            },
            set: function (value) {
                if (this._source != value)
                    this._counter = {};
                this._source = value;
            }
        });

        /**
         * This can be any data associated with this tree item.
         */
        this.data = null;

        if (typeof (params) === 'string') {
            this.label = params;
            this.data = params;
        } else
            for (var key in params)
                this[key] = params[key];
    }






    //----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----
    var p = WeaveTreeItem.prototype;
    /**
     * Computes a Boolean value from various structures
     * @param param Either a Boolean, and Object like {not: param}, a Function, an ILinkableVariable, or an Array of those objects.
     * @param recursionName A name used to keep track of recursion.
     * @return A Boolean value derived from the param, or the param itself if called recursively.
     */
    p.getBoolean = function (param, recursionName) {
        if (!this._recursion[recursionName]) {
            try {
                this._recursion[recursionName] = true;

                if (this.isSimpleObject(param, 'not'))
                    param = !this.getBoolean(param['not'], "not_" + recursionName);
                if (this.isSimpleObject(param, 'or'))
                    param = this.getBoolean(param['or'], "or_" + recursionName);
                if (typeof (param) === "function")
                    param = this.evalFunction(param);
                if (param instanceof weavecore.LinkableVariable)
                    param = param.getSessionState();
                if (param instanceof Array) {
                    var breakValue = recursionName.indexOf("or_") === 0;
                    for (var param in param) {
                        param = this.getBoolean(param, "item_" + recursionName);
                        if (param ? breakValue : !breakValue)
                            break;
                    }
                }
                param = param ? true : false;
            } finally {
                this._recursion[recursionName] = false;
            }
        }
        return param;
    };

    /**
     * Checks if an object has a single specified property.
     */
    p.isSimpleObject = function (object, singlePropertyName) {
        if (!(object instanceof Object) || object.constructor !== Object)
            return false;

        var found = false;
        for (var key in object) {
            if (found)
                return false; // two or more properties

            if (key !== singlePropertyName)
                return false; // not the desired property

            found = true; // found the desired property
        }
        return found;
    };

    /**
     * Gets a String value from a String or Function.
     * @param param Either a String or a Function.
     * @param recursionName A name used to keep track of recursion.
     * @return A String value derived from the param, or the param itself if called recursively.
     */
    p.getString = function (param, recursionName) {
        if (!this._recursion[recursionName]) {
            try {
                this._recursion[recursionName] = true;

                if (typeof (param) === "function")
                    param = this.evalFunction(param);
                else
                    param = param || '';
            } finally {
                this._recursion[recursionName] = false;
            }
        }
        return param;
    };

    /**
     * Evaluates a function to get an Object or just returns the non-Function Object passed in.
     * @param param Either an Object or a Function.
     * @param recursionName A name used to keep track of recursion.
     * @return An Object derived from the param, or the param itself if called recursively.
     */
    p.getObject = function (param, recursionName) {
        if (!this._recursion[recursionName]) {
            try {
                this._recursion[recursionName] = true;

                if (typeof (param) === "function")
                    param = this.evalFunction(param);
            } finally {
                this._recursion[recursionName] = false;
            }
        }
        return param;
    };

    /**
     * First tries calling a function with no parameters.
     * If an ArgumentError is thrown, the function will called again, passing this WeaveTreeItem as the first parameter.
     */
    p.evalFunction = function (func) {
        try {
            // first try calling the function with no parameters
            return func.call(this);
        } catch (e) {
            console.log(e);
            /*if (!(e is ArgumentError))
				{
					if (e is Error)
						trace((e as Error).getStackTrace());
					throw e;
				}*/
        }

        // on ArgumentError, pass in this WeaveTreeItem as the first parameter
        return func.call(this, this);
    };

    //----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----//----

    /**
     * Checks if cached value is valid.
     * Always returns false if the source property is not set.
     * @param id A string identifying a property.
     * @return true if the property value has been cached.
     */
    p.isCached = function (id) {
        if (this._source && WeaveAPI.SessionManager.objectWasDisposed(this._source))
            source = null;
        return this._source && this._counter[id] === WeaveAPI.SessionManager.getCallbackCollection(this._source).triggerCounter;
    };

    /**
     * Retrieves or updates a cached value for a property.
     * Does not cache the value if the source property is not set.
     * @param id A string identifying a property.
     * @param newValue Optional new value to cache for the property.
     * @return The new or existing value for the property.
     */
    p.cache = function (id, newValue) {
        if (arguments.length === 1)
            return this._cache[id];

        if (this._source && WeaveAPI.SessionManager.objectWasDisposed(this._source))
            source = null;
        if (this._source) {
            this._counter[id] = WeaveAPI.SessionManager.getCallbackCollection(this._source).triggerCounter;
            this._cache[id] = newValue;
        }
        return newValue;
    };


    /**
     * Initializes an Array of WeaveTreeItems using an Array of objects to pass to the constructor.
     * Any Arrays passed in will be flattened.
     * @param WeaveTreeItem_implementation The implementation of WeaveTreeItem to use.
     * @param items Item descriptors.
     */
    WeaveTreeItem.createItems = function (WeaveTreeItem_implementation, items) {
        // flatten
        var n = 0;
        while (n !== items.length) {
            n = items.length;
            items = [].concat.apply(null, items);
        }

        return items.map(_mapItems, WeaveTreeItem_implementation).filter(_filterItems);
    };

    /**
     * Used for mapping an Array of params objects to an Array of WeaveTreeItem objects.
     * The "this" argument is used to specify a particular WeaveTreeItem implementation.
     */
    WeaveTreeItem._mapItems = function (item, i, a) {
        // If the item is a Class definition, create an instance of that Class.
        if (typeof (item) === 'function')
            return new item();

        // If the item is a String or an Object, we can pass it to the constructor.
        if (typeof (item) === 'string' || (item !== null && item !== undefined && item.constructor.name === "Object")) {
            var ItemClass = WeaveTreeItem;
            return new ItemClass(item);
        }

        // If the item is any other type, return the original item.
        return item;
    };

    /**
     * Filters out null items.
     */
    WeaveTreeItem._filterItems = function (item, i, a) {
        return item !== null || item !== undefined;
    };



    weavecore.WeaveTreeItem = WeaveTreeItem;

}());
