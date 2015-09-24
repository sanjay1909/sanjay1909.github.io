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
 * This is a wrapper for a 2-dimensional Dictionary.
 *
 * @author adufilie
 * @author sanjay1909
 */

(function () {
    function Dictionary2D() {
        this.dictionary = new Map();
    }

    var p = Dictionary2D.prototype;

    /**
     *
     * @param key1 The first dictionary key.
     * @param key2 The second dictionary key.
     * @return The value in the dictionary.
     */
    p.get = function (key1, key2) {
        var d2 = this.dictionary.get(key1);
        return d2 ? d2.get(key2) : undefined;
    };

    /**
     * This will add or replace an entry in the dictionary.
     * @param key1 The first dictionary key.
     * @param key2 The second dictionary key.
     * @param value The value to put into the dictionary.
     */
    p.set = function (key1, key2, value) {
        var d2 = this.dictionary.get(key1);
        if (d2 === null || d2 === undefined)
            d2 = new Map();
        this.dictionary.set(key1, d2);
        d2.set(key2, value);
    };

    /**
     * This removes all values associated with the given primary key.
     * @param key1 The first dictionary key.
     */
    p.removeAllPrimary = function (key1) {
        this.dictionary.delete(key1);
    };

    /**
     * This removes all values associated with the given secondary key.
     * @param key2 The second dictionary key.
     */
    p.removeAllSecondary = function (key2) {
        for (var key1 of this.dictionary.keys()) {
            this.dictionary.get(key1).delete(key2);
        }

    };

    /**
     * This removes a value associated with the given primary and secondary keys.
     * @param key1 The first dictionary key.
     * @param key2 The second dictionary key.
     * @return The value that was in the dictionary.
     */
    p.remove = function (key1, key2) {
        var value;
        var d2 = this.dictionary.get(key1);
        if (d2) {
            value = d2.get(key2);
            d2.delete(key2);
        }

        // if entries remain in d2, keep it
        for (var v2 of d2.values())
            return value;

        // otherwise, remove it
        this.dictionary.delete(key1);

        return value;
    };

    weavecore.Dictionary2D = Dictionary2D;
}());
