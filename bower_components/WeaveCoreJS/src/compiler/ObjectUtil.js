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
 * This provides a set of useful static functions for Object Comparison.
 * All Static functions are Ported from  Apache Flex mx.utils.ObjectUtil - ActionScript Code
 * @author sanjay1909
 */
(function () {
    "use strict";

    //constructor
    function ObjectUtil() {
        throw "ObjectUtil cannot be instantiated.";
    }

    /**
     *  Compares two numeric values.
     *  @param a First number.
     *  @param b Second number.
     *  @return 0 is both numbers are NaN.
     *  1 if only <code>a</code> is a NaN.
     *  -1 if only <code>b</code> is a NaN.
     *  -1 if <code>a</code> is less than <code>b</code>.
     *  1 if <code>a</code> is greater than <code>b</code>.
     */
    ObjectUtil.numericCompare = function (a, b) {
        if (isNaN(a) && isNaN(b))
            return 0;

        if (isNaN(a))
            return 1;

        if (isNaN(b))
            return -1;

        if (a < b)
            return -1;

        if (a > b)
            return 1;

        return 0;
    };

    /**
     *  Compares two String values.
     *  @param a First String value.
     *  @param b Second String value.
     *  @param caseInsensitive Specifies to perform a case insensitive compare,
     *  <code>true</code>, or not, <code>false</code>.
     *
     *  @return 0 is both Strings are null.
     *  1 if only <code>a</code> is null.
     *  -1 if only <code>b</code> is null.
     *  -1 if <code>a</code> precedes <code>b</code>.
     *  1 if <code>b</code> precedes <code>a</code>.
     */
    ObjectUtil.stringCompare = function (a, b, caseInsensitive) {
        if ((a === null || a === undefined) && (b === null || b === undefined))
            return 0;

        if (a === null || a === undefined)
            return 1;

        if (b === null || b === undefined)
            return -1;

        // Convert to lowercase if we are case insensitive.
        if (caseInsensitive) {
            a = a.toLocaleLowerCase();
            b = b.toLocaleLowerCase();
        }

        var result = a.localeCompare(b);

        if (result < -1)
            result = -1;
        else if (result > 1)
            result = 1;

        return result;
    };

    /**
     *  Compares the two Date objects and returns an integer value
     *  indicating if the first Date object is before, equal to,
     *  or after the second item.
     *  @param a Date object.
     *  @param b Date object.
     *  @return 0 if <code>a</code> and <code>b</code> are equal
     *  (or both are <code>null</code>);
     *  -1 if <code>a</code> is before <code>b</code>
     *  (or <code>b</code> is <code>null</code>);
     *  1 if <code>a</code> is after <code>b</code>
     *  (or <code>a</code> is <code>null</code>);
     *  0 is both dates getTime's are NaN;
     *  1 if only <code>a</code> getTime is a NaN;
     *  -1 if only <code>b</code> getTime is a NaN.
     */
    ObjectUtil.dateCompare = function (a, b) {
        if ((a === null || a === undefined) && (b === null || b === undefined))
            return 0;

        if (a === null || undefined)
            return 1;

        if (b === null || undefined)
            return -1;

        var na = a.getTime();
        var nb = b.getTime();

        if (na < nb)
            return -1;

        if (na > nb)
            return 1;

        if (isNaN(na) && isNaN(nb))
            return 0;

        if (isNaN(na))
            return 1;

        if (isNaN(nb))
            return -1;

        return 0;
    };

    weavecore.ObjectUtil = ObjectUtil;

}());
