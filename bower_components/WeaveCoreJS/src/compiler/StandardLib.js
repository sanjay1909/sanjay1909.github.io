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
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

/**
 * This provides a set of useful static functions.
 * All the functions defined in this class are pure functions,
 * meaning they always return the same result with the same arguments, and they have no side-effects.
 *
 * @author adufilie
 * @author sanbalag
 */
(function () {
    "use strict";

    //constructor
    function StandardLib() {
        throw "StandardLib cannot be instantiated.";
    }

    /**
     * This compares two dynamic objects or primitive values and is much faster than ObjectUtil.compare().
     * Does not check for circular refrences.
     * @param a First dynamic object or primitive value.
     * @param b Second dynamic object or primitive value.
     * @return A value of zero if the two objects are equal, nonzero if not equal.
     */
    StandardLib.compare = function (a, b, objectCompare) {
        objectCompare = (objectCompare === undefined ? null : objectCompare);
        var c;
        var ObjectUtil = weavecore.ObjectUtil;
        if (a === b)
            return 0;
        if (a === null || a === undefined)
            return 1;
        if (b === null || b === undefined)
            return -1;
        var typeA = typeof (a);
        var typeB = typeof (b);
        if (typeA !== typeB)
            return weavecore.ObjectUtil.stringCompare(typeA, typeB);
        if (typeA === 'boolean')
            return weavecore.ObjectUtil.numericCompare(Number(a), Number(b));
        if (typeA === 'number')
            return weavecore.ObjectUtil.numericCompare(a, b);
        if (typeA === 'string')
            return weavecore.ObjectUtil.stringCompare(a, b);

        if (typeA !== 'object')
            return 1;

        if (a instanceof Date && b instanceof Date)
            return weavecore.ObjectUtil.dateCompare(a, b);

        if (a.constructor === Array && b.constructor === Array) {
            var an = a.length;
            var bn = b.length;
            if (an < bn)
                return -1;
            if (an > bn)
                return 1;
            for (var i = 0; i < an; i++) {
                c = StandardLib.compare(a[i], b[i]);
                if (c !== 0)
                    return c;
            }
            return 0;
        }

        if (objectCompare !== null) {
            var result = objectCompare(a, b);
            if (isFinite(result))
                return result;
        }

        var qna = a.constructor.name;
        var qnb = b.constructor.name;

        if (qna != qnb)
            return weavecore.ObjectUtil.stringCompare(qna, qnb);

        var p;

        // test if objects are dynamic
        try {
            a[''];
            b[''];
        } catch (e) {
            return 1; // not dynamic objects
        }

        // if there are properties in a not found in b, return -1
        for (p in a) {
            if (!b.hasOwnProperty(p))
                return -1;
        }
        for (p in b) {
            // if there are properties in b not found in a, return 1
            if (!a.hasOwnProperty(p))
                return 1;

            c = StandardLib.compare(a[p], b[p]);
            if (c !== 0)
                return c;
        }

        return 0;
    };

    weavecore.StandardLib = StandardLib;
}());
