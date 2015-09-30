var Portfolio =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "js/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.Navigation = __webpack_require__(1);
	exports.Content = __webpack_require__(3);

	exports.Home = __webpack_require__(4);
	exports.Academic = __webpack_require__(5);
	exports.Projects = __webpack_require__(9);
	exports.Publications = __webpack_require__(12);
	exports.Contributions = __webpack_require__(13);

	exports.ReacTree = __webpack_require__(6);

	exports.Github = __webpack_require__(10);
	exports.GithubSession = __webpack_require__(11);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _react = __webpack_require__(2);

	var React = _interopRequireWildcard(_react);

	var Navigation = (function (_React$Component) {
	    _inherits(Navigation, _React$Component);

	    function Navigation() {
	        _classCallCheck(this, Navigation);

	        _get(Object.getPrototypeOf(Navigation.prototype), "constructor", this).apply(this, arguments);
	    }

	    _createClass(Navigation, [{
	        key: "render",
	        value: function render() {
	            return React.createElement(
	                "nav",
	                { className: "navbar navbar-default portfolio-menu", role: "navigation" },
	                React.createElement(
	                    "div",
	                    { className: "container-fluid" },
	                    React.createElement(
	                        "div",
	                        { className: "navbar-header responsive-logo" },
	                        React.createElement(
	                            "button",
	                            { className: "navbar-toggle collapsed", type: "button", "data-toggle": "collapse", "data-target": "#bs-navbar-collapse-1" },
	                            React.createElement(
	                                "span",
	                                { className: "sr-only" },
	                                "Toggle navigation"
	                            ),
	                            React.createElement("span", { className: "icon-bar" }),
	                            React.createElement("span", { className: "icon-bar" }),
	                            React.createElement("span", { className: "icon-bar" })
	                        ),
	                        React.createElement(
	                            "div",
	                            { className: "navbar-brand" },
	                            "Sanjay Krishna Anbalagan"
	                        )
	                    ),
	                    React.createElement(
	                        "div",
	                        { className: "collapse navbar-collapse", id: "bs-navbar-collapse-1" },
	                        React.createElement(
	                            "ul",
	                            { className: "nav navbar-nav navbar-right responsive-nav " },
	                            React.createElement(
	                                "li",
	                                null,
	                                React.createElement(
	                                    "a",
	                                    { href: "#home" },
	                                    "About-Me"
	                                )
	                            ),
	                            React.createElement(
	                                "li",
	                                null,
	                                React.createElement(
	                                    "a",
	                                    { href: "#projects" },
	                                    "Projects"
	                                )
	                            ),
	                            React.createElement(
	                                "li",
	                                null,
	                                React.createElement(
	                                    "a",
	                                    { href: "#publications" },
	                                    "Publicaitons"
	                                )
	                            ),
	                            React.createElement(
	                                "li",
	                                null,
	                                React.createElement(
	                                    "a",
	                                    { href: "#contributions" },
	                                    "Contributions"
	                                )
	                            ),
	                            React.createElement(
	                                "li",
	                                null,
	                                React.createElement(
	                                    "a",
	                                    { href: "#academics" },
	                                    "Academics"
	                                )
	                            )
	                        )
	                    )
	                )
	            );
	        }
	    }]);

	    return Navigation;
	})(React.Component);

	module.exports = Navigation;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = React;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _react = __webpack_require__(2);

	var React = _interopRequireWildcard(_react);

	var _pagesHome = __webpack_require__(4);

	var _pagesHome2 = _interopRequireDefault(_pagesHome);

	var _pagesAcademic = __webpack_require__(5);

	var _pagesAcademic2 = _interopRequireDefault(_pagesAcademic);

	var _pagesProjects = __webpack_require__(9);

	var _pagesProjects2 = _interopRequireDefault(_pagesProjects);

	var _pagesPublications = __webpack_require__(12);

	var _pagesPublications2 = _interopRequireDefault(_pagesPublications);

	var _pagesContributions = __webpack_require__(13);

	var _pagesContributions2 = _interopRequireDefault(_pagesContributions);

	var Content = (function (_React$Component) {
	    _inherits(Content, _React$Component);

	    function Content(props) {
	        _classCallCheck(this, Content);

	        _get(Object.getPrototypeOf(Content.prototype), 'constructor', this).call(this, props);
	        this.activePage = WeaveAPI.globalHashMap.getObject("activePage");
	        this.routes = {
	            undefined: React.createElement(_pagesHome2['default'], null),
	            '/': React.createElement(_pagesHome2['default'], null),
	            'home': React.createElement(_pagesHome2['default'], null),
	            'academics': React.createElement(_pagesAcademic2['default'], null),
	            'projects': React.createElement(_pagesProjects2['default'], null),
	            'publications': React.createElement(_pagesPublications2['default'], null),
	            'contributions': React.createElement(_pagesContributions2['default'], null)
	        };

	        this.state = {
	            page: this.activePage.value
	        };

	        this._updateState = this._updateState.bind(this);
	    }

	    _createClass(Content, [{
	        key: 'componentDidMount',
	        value: function componentDidMount() {
	            this.activePage.addImmediateCallback(this, this._updateState, true);
	        }
	    }, {
	        key: '_updateState',
	        value: function _updateState() {
	            console.log("page changed");
	            this.setState({
	                page: this.activePage.value
	            });
	        }
	    }, {
	        key: 'componentWillUnmount',
	        value: function componentWillUnmount() {
	            this.activePage.removeCallback(this, this._updateState);
	        }
	    }, {
	        key: 'render',
	        value: function render() {

	            var pageComponent = this.routes[this.state.page];
	            console.log(pageComponent);
	            return pageComponent;
	        }
	    }]);

	    return Content;
	})(React.Component);

	module.exports = Content;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _react = __webpack_require__(2);

	var React = _interopRequireWildcard(_react);

	var Home = (function (_React$Component) {
	    _inherits(Home, _React$Component);

	    function Home() {
	        _classCallCheck(this, Home);

	        _get(Object.getPrototypeOf(Home.prototype), "constructor", this).apply(this, arguments);
	    }

	    _createClass(Home, [{
	        key: "render",
	        value: function render() {
	            return React.createElement(
	                "div",
	                { className: "row" },
	                React.createElement(
	                    "div",
	                    { className: "col-md-4" },
	                    React.createElement(
	                        "span",
	                        null,
	                        " ",
	                        React.createElement("img", { src: "images/me.PNG" }),
	                        " "
	                    )
	                ),
	                React.createElement(
	                    "div",
	                    { className: "col-md-8" },
	                    React.createElement(
	                        "h2",
	                        null,
	                        React.createElement(
	                            "span",
	                            { className: "colorOne" },
	                            " Sanjay "
	                        ),
	                        React.createElement(
	                            "span",
	                            { className: "colorTwo" },
	                            "Krishna "
	                        )
	                    )
	                )
	            );
	        }
	    }]);

	    return Home;
	})(React.Component);

	module.exports = Home;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _react = __webpack_require__(2);

	var React = _interopRequireWildcard(_react);

	var ReactTree = __webpack_require__(6);

	var Academic = (function (_React$Component) {
	    _inherits(Academic, _React$Component);

	    function Academic() {
	        _classCallCheck(this, Academic);

	        _get(Object.getPrototypeOf(Academic.prototype), 'constructor', this).call(this);
	    }

	    _createClass(Academic, [{
	        key: 'render',
	        value: function render() {
	            return React.createElement(
	                'div',
	                { className: 'row' },
	                React.createElement(ReactTree, null)
	            );
	        }
	    }]);

	    return Academic;
	})(React.Component);

	module.exports = Academic;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _react = __webpack_require__(2);

	var React = _interopRequireWildcard(_react);

	__webpack_require__(7);

	__webpack_require__(8);

	var ReactTree = (function (_React$Component) {
	    _inherits(ReactTree, _React$Component);

	    function ReactTree() {
	        _classCallCheck(this, ReactTree);

	        _get(Object.getPrototypeOf(ReactTree.prototype), 'constructor', this).call(this);
	        this.academics = WeaveAPI.globalHashMap.requestObject("academicsData", weavecore.LinkableVariable);
	        this.state = {
	            data: this.academics.getSessionState()
	        };

	        this.tree = new sanjay.d3Tree();

	        this._setReactState = this._setReactState.bind(this);
	    }

	    _createClass(ReactTree, [{
	        key: 'componentDidMount',
	        value: function componentDidMount() {
	            this.academics.addImmediateCallback(this, this._setReactState);
	            var config = {
	                container: React.findDOMNode(this)

	            };

	            this.tree.create(config);
	            if (this.academics.getSessionState()) this.tree.loadData(JSON.parse(this.academics.getSessionState()));
	        }
	    }, {
	        key: 'componentDidUpdate',
	        value: function componentDidUpdate(prevProps, prevState) {
	            if (this.state.data) {
	                this.tree.loadData(JSON.parse(this.state.data));
	            }
	        }
	    }, {
	        key: 'componentWillUnmount',
	        value: function componentWillUnmount() {
	            this.academics.removeCallback(this._setReactState);
	        }
	    }, {
	        key: '_setReactState',
	        value: function _setReactState() {

	            this.setState({
	                data: this.academics.getSessionState()
	            });
	        }
	    }, {
	        key: 'render',
	        value: function render() {
	            return React.createElement(
	                'div',
	                null,
	                ' '
	            );
	        }
	    }]);

	    return ReactTree;
	})(React.Component);

	module.exports = ReactTree;

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = d3;

/***/ },
/* 8 */
/***/ function(module, exports) {

	//this.sanjay ? this.sanjay : {};
	'use strict';

	window.sanjay = window.sanjay ? window.sanjay : {};
	(function () {
	    function d3Tree() {
	        this.config = {};
	        this.config.container = {};
	        //this.config.size = {};
	    }

	    var p = d3Tree.prototype;

	    function initialize() {}

	    p.create = function (config) {

	        if (config.container) {
	            if (config.container.constructor.name === 'String') {
	                this.config.container = {
	                    'element': document.getElementById(config.container),
	                    'id': config.container
	                };
	            } else {
	                //to-do check its dom element if so, get its ID too
	                if (config.container.constructor.name === 'HTMLDivElement') {
	                    this.config.container = {
	                        'element': config.container,
	                        'id': config.container.id
	                    };
	                } else {
	                    console.log("Error: " + config.container + " - Not a HTMLDivElement element ");
	                }
	            }
	        } else {
	            if (this.config.container.constructor.name === 'String') {
	                this.config.container = {
	                    'element': document.getElementById(config.container),
	                    'id': 'body'
	                };
	            }
	        }

	        this.container = d3.select(this.config.container.element);

	        if (config.size) {
	            this.config.size = config.size;
	            if (!config.size.width) this.config.size.width = parseInt(this.container.style('width'), 10);
	            if (!config.size.height) {
	                this.config.size.height = parseInt(this.container.style('height'), 10);
	                if (this.config.size.height == 0) this.config.size.height = 400; // when div dont have child value will be zero
	            }
	        } else {
	                this.config.size = {};
	                this.config.size.width = parseInt(this.container.style('width'), 10);
	                this.config.size.height = parseInt(this.container.style('height'), 10);
	                if (this.config.size.height == 0) this.config.size.height = 400; // when div dont have child value will be zero
	            }
	        if (config.margin) {
	            this.config.margin = config.margin;
	            if (!config.margin.left) this.config.margin.left = 20;
	            if (!config.margin.right) this.config.margin.right = 20;
	            if (!config.margin.top) this.config.margin.top = 20;
	            if (!config.margin.bottom) this.config.margin.bottom = 20;
	        } else {
	            this.config.margin = {};
	            this.config.margin.left = this.config.margin.right = this.config.margin.top = this.config.margin.bottom = 20;
	        }
	        var width = this.config.size.width;
	        var height = this.config.size.height;
	        this.root;

	        this.tree = d3.layout.tree().size([height, width - 200]);

	        this.diagonal = d3.svg.diagonal().projection(function (d) {
	            return [d.y, d.x];
	        });

	        this.viz = d3.select(this.config.container.element).classed("svg-container", true) //container class to make it responsive
	        .append("svg").attr("preserveAspectRatio", "xMinYMin meet") //responsive SVG needs these 2 attributes and no width and height attr
	        .attr("viewBox", "0 0 600 600").classed("svg-content-responsive", true) //class to make it responsive
	        .append("g").attr("transform", "translate( 60 ,0)");
	    };

	    function toggleAll(data) {
	        if (data.children) {
	            data.children.forEach(toggleAll);
	            toggle(data);
	        }
	    }

	    p.loadData = function (json) {

	        var height = this.config.size.height;
	        this.root = json;
	        this.root.x0 = height / 2;
	        this.root.y0 = 0;

	        // Initialize the display to show a few nodes.
	        // root.children.forEach(toggleAll);
	        toggle(this.root);

	        this.update(this.root);
	    };

	    p.update = function (source) {
	        var duration = d3.event && d3.event.altKey ? 5000 : 500;

	        var chart = this;

	        // Compute the new tree layout.
	        var nodes = this.tree.nodes(this.root).reverse();

	        // Normalize for fixed-depth.
	        nodes.forEach(function (d) {
	            d.y = d.depth * 180;
	        });

	        // Update the nodes…
	        var node = this.viz.selectAll("g.node").data(nodes, function (d, i) {
	            return d.id || (d.id = ++i);
	        });

	        // Enter any new nodes at the parent's previous position.
	        var nodeEnter = node.enter().append("svg:g").attr("class", "node").attr("transform", function (d) {
	            return "translate(" + source.y0 + "," + source.x0 + ")";
	        }).on("click", function (d) {
	            toggle(d);
	            chart.update(d);
	        });

	        nodeEnter.append("svg:circle").attr("r", 1e-6).style("fill", function (d) {
	            return d._children ? "lightsteelblue" : "#fff";
	        });

	        nodeEnter.append("svg:text").attr("x", function (d) {
	            return d.children || d._children ? -10 : 10;
	        }).attr("dy", ".35em").attr("text-anchor", function (d) {
	            return d.children || d._children ? "end" : "start";
	        }).text(function (d) {
	            return d.name;
	        }).style("fill-opacity", 1e-6).style("fill", 'black');

	        // Transition nodes to their new position.
	        var nodeUpdate = node.transition().duration(duration).attr("transform", function (d) {
	            return "translate(" + d.y + "," + d.x + ")";
	        });

	        nodeUpdate.select("circle").attr("r", 4.5).style("fill", function (d) {
	            return d._children ? "lightsteelblue" : "#fff";
	        });

	        nodeUpdate.select("text").style("fill-opacity", 1);

	        // Transition exiting nodes to the parent's new position.
	        var nodeExit = node.exit().transition().duration(duration).attr("transform", function (d) {
	            return "translate(" + source.y + "," + source.x + ")";
	        }).remove();

	        nodeExit.select("circle").attr("r", 1e-6);

	        nodeExit.select("text").style("fill-opacity", 1e-6);

	        // Update the links…
	        var link = this.viz.selectAll("path.link").data(this.tree.links(nodes), function (d) {
	            return d.target.id;
	        });

	        // Enter any new links at the parent's previous position.
	        link.enter().insert("svg:path", "g").attr("class", "link").attr("d", function (d) {
	            var o = {
	                x: source.x0,
	                y: source.y0
	            };
	            return chart.diagonal({
	                source: o,
	                target: o
	            });
	        }).transition().duration(duration).attr("d", chart.diagonal);

	        // Transition links to their new position.
	        link.transition().duration(duration).attr("d", chart.diagonal);

	        // Transition exiting nodes to the parent's new position.
	        link.exit().transition().duration(duration).attr("d", function (d) {
	            var o = {
	                x: source.x,
	                y: source.y
	            };
	            return chart.diagonal({
	                source: o,
	                target: o
	            });
	        }).remove();

	        // Stash the old positions for transition.
	        nodes.forEach(function (d) {
	            d.x0 = d.x;
	            d.y0 = d.y;
	        });
	    };

	    // Toggle children.
	    function toggle(data) {
	        if (data.children) {
	            data._children = data.children;
	            data.children = null;
	        } else {
	            data.children = data._children;
	            data._children = null;
	        }
	    }

	    sanjay.d3Tree = d3Tree;
	})();

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _react = __webpack_require__(2);

	var React = _interopRequireWildcard(_react);

	var _ExternalAPIGithubJs = __webpack_require__(10);

	var Github = _interopRequireWildcard(_ExternalAPIGithubJs);

	var GithubSession = __webpack_require__(11);

	var Projects = (function (_React$Component) {
	    _inherits(Projects, _React$Component);

	    function Projects() {
	        _classCallCheck(this, Projects);

	        _get(Object.getPrototypeOf(Projects.prototype), 'constructor', this).call(this);
	        this.gitHub = WeaveAPI.globalHashMap.requestObject("gitHub", GithubSession);

	        this._promise = WeaveAPI.SessionManager.registerLinkableChild(this.gitHub, new weavecore.LinkablePromise(this._getUserRepos.bind(this), this.describePromise.bind(this), true));

	        this.state = {
	            repos: []
	        };

	        this._setReactState = this._setReactState.bind(this);
	        this._getUserRepos = this._getUserRepos.bind(this);
	    }

	    _createClass(Projects, [{
	        key: 'describePromise',
	        value: function describePromise() {
	            return console.log("Running For User: ", this.gitHub.user.value);
	        }
	    }, {
	        key: '_getUserRepos',
	        value: function _getUserRepos() {
	            var usr = new Github.User(this.gitHub.user.value);
	            return usr.repos();
	        }
	    }, {
	        key: 'componentDidMount',
	        value: function componentDidMount() {

	            this._promise.depend(this.gitHub.user);
	            WeaveAPI.SessionManager.getCallbackCollection(this._promise).addImmediateCallback(null, this._setReactState.bind(this));
	        }
	    }, {
	        key: 'componentWillUnmount',
	        value: function componentWillUnmount() {
	            WeaveAPI.SessionManager.getCallbackCollection(this._promise).removeCallback(this._setReactState.bind(this));
	            this._promise.dispose();
	        }
	    }, {
	        key: '_setReactState',
	        value: function _setReactState() {
	            if (this._promise.result) {
	                this.setState({
	                    repos: JSON.parse(this._promise.result)
	                });
	            } else {
	                console.log(this._promise.error);
	                this.setState({
	                    repos: []
	                });
	            }
	        }
	    }, {
	        key: 'render',
	        value: function render() {

	            var repoList = this.state.repos ? this.state.repos.map(function (repo) {
	                var name = repo['name'];
	                var description = repo['description'];
	                var url = repo['html_url'];

	                if (name === 'ui-slider' || name === 'as-me' || name === 'FormVisualization' || name === 'sanjay1909.github.io') return null;
	                return React.createElement(
	                    'div',
	                    { className: 'col-md-4' },
	                    React.createElement(
	                        'div',
	                        { className: 'card card--medium' },
	                        React.createElement(
	                            'div',
	                            null,
	                            React.createElement(
	                                'h3',
	                                { className: 'card__title' },
	                                name
	                            ),
	                            React.createElement(
	                                'p',
	                                { className: 'card__text' },
	                                description
	                            )
	                        ),
	                        React.createElement(
	                            'div',
	                            { className: 'card__action-bar' },
	                            React.createElement(
	                                'span',
	                                { className: 'card__button' },
	                                ' ',
	                                React.createElement(
	                                    'a',
	                                    { href: url, target: '_blank' },
	                                    'Read More..'
	                                )
	                            )
	                        )
	                    )
	                );
	            }) : [];
	            return React.createElement(
	                'div',
	                { className: 'row' },
	                repoList
	            );
	        }
	    }]);

	    return Projects;
	})(React.Component);

	module.exports = Projects;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	(function () {
	    'use strict';

	    var XMLHttpRequest;
	    var API_URL = 'https://api.github.com';

	    //prefer native XMLHttpRequest always
	    if (typeof window !== 'undefined' && typeof window.XMLHttpRequest !== 'undefined') {
	        XMLHttpRequest = window.XMLHttpRequest;
	    }

	    // Method that performs the ajax request
	    function _request(method, path, data, cb, raw, sync) {
	        function getURL() {
	            var url = path.indexOf('//') >= 0 ? path : API_URL + path;
	            url += /\?/.test(url) ? '&' : '?';
	            // Fix #195 about XMLHttpRequest.send method and GET/HEAD request
	            if (data && typeof data === "object" && ['GET', 'HEAD'].indexOf(method) > -1) {
	                url += '&' + Object.keys(data).map(function (k) {
	                    return k + '=' + data[k];
	                }).join('&');
	            }
	            return url + '&' + new Date().getTime();
	        }

	        // Creating a promise
	        var promise = new Promise(function (resolve, reject) {

	            // Instantiates the XMLHttpRequest
	            var client = new XMLHttpRequest();
	            var uri = getURL();

	            client.open(method, getURL(), !sync);

	            /*if (!sync) {
	                client.onreadystatechange = function () {
	                    if (this.readyState === 4) {
	                        if (this.status >= 200 && this.status < 300 || this.status === 304) {
	                            cb(null, raw ? this.responseText : this.responseText ? JSON.parse(this.responseText) : true, this);
	                        } else {
	                            cb({
	                                path: path,
	                                request: this,
	                                error: this.status
	                            });
	                        }
	                    }
	                };
	            }*/

	            if (!raw) {
	                client.dataType = 'json';
	                client.setRequestHeader('Accept', 'application/vnd.github.v3+json');
	            } else {
	                client.setRequestHeader('Accept', 'application/vnd.github.v3.raw+json');
	            }

	            client.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

	            if (data) {
	                client.send(JSON.stringify(data));
	            } else {
	                client.send();
	            }

	            client.onload = function () {
	                if (this.status >= 200 && this.status < 300) {
	                    // Performs the function "resolve" when this.status is equal to 2xx
	                    resolve(this.response);
	                } else {
	                    // Performs the function "reject" when this.status is different than 2xx
	                    reject(this.statusText);
	                }
	            };
	            client.onerror = function () {
	                reject(this.statusText);
	            };

	            /* if (sync) {
	                 return client.response;
	             }*/
	        });

	        // Return the promise
	        return promise;
	    }

	    function _requestAllPages(path, cb) {
	        var results = [];
	        (function iterate() {
	            _request('GET', path, null, function (err, res, xhr) {
	                if (err) {
	                    return cb(err);
	                }

	                results.push.apply(results, res);

	                var links = (xhr.getResponseHeader('link') || '').split(/\s*,\s*/g),
	                    next = null;
	                links.forEach(function (link) {
	                    next = /rel="next"/.test(link) ? link : next;
	                });

	                if (next) {
	                    next = (/<(.*)>/.exec(next) || [])[1];
	                }

	                if (!next) {
	                    cb(err, results);
	                } else {
	                    path = next;
	                    iterate();
	                }
	            });
	        })();
	    }

	    var Github = function Github() {

	        // HTTP Request Abstraction
	        // =======

	        // Top Level API
	        // -------

	        this.getIssues = function (user, repo) {
	            return new Github.Issue({
	                user: user,
	                repo: repo
	            });
	        };

	        this.getRepo = function (user, repo) {
	            return new Github.Repository({
	                user: user,
	                name: repo
	            });
	        };

	        this.getUser = function (userName) {
	            return new Github.User(userName);
	        };

	        this.getGist = function (id) {
	            return new Github.Gist({
	                id: id
	            });
	        };
	    };

	    // User API
	    // =======

	    Github.User = function (username) {
	        this.userName = username;

	        /*function (err, res) {
	            cb(err, res);
	        }*/
	        this.userInfo = function () {
	            return _request("GET", '/users/' + this.userName, null);
	        };

	        // List user organizations
	        // -------

	        this.orgs = function (cb) {
	            _request("GET", '/users/' + this.userName + '/orgs', null, function (err, res) {
	                cb(err, res);
	            });
	        };

	        // List user repositories
	        // -------

	        this.repos = function () {
	            // Github does not always honor the 1000 limit so we want to iterate over the data set.
	            return _request("GET", '/users/' + this.userName + '/repos');
	        };

	        /*this.repos = function (cb) {
	            // Github does not always honor the 1000 limit so we want to iterate over the data set.
	            _requestAllPages('/users/' + this.userName + '/repos?type=all&per_page=1000&sort=updated', function (err, res) {
	                cb(err, res);
	            });
	        };*/

	        // List a user's gists
	        // -------

	        this.gists = function (cb) {
	            _request('GET', '/users/' + this.userName + '/gists', null, function (err, res) {
	                cb(err, res);
	            });
	        };
	    };

	    // Organisation API
	    // =======

	    Github.Organisation = function (orgName) {
	        this.orgName = orgName;

	        // List orgs repositories
	        // -------

	        this.repos = function (cb) {
	            // Github does not always honor the 1000 limit so we want to iterate over the data set.
	            _requestAllPages('/orgs/' + this.orgName + '/repos?type=all&per_page=1000&sort=updated', function (err, res) {
	                cb(err, res);
	            });
	        };

	        // List orgs  members
	        // -------

	        this.members = function (cb) {
	            _request('GET', '/orgs/' + this.orgName + '/members', null, function (err, res) {
	                cb(err, res);
	            });
	        };
	    };

	    // Repository API
	    // =======

	    Github.Repository = function (options) {
	        var repo = options.name;
	        var user = options.user;

	        var that = this;
	        var repoPath = '/repos/' + user + '/' + repo;

	        var currentTree = {
	            'branch': null,
	            'sha': null
	        };

	        // List all tags of a repository
	        // -------

	        this.listTags = function (cb) {
	            _request('GET', repoPath + '/tags', null, function (err, tags) {
	                if (err) {
	                    return cb(err);
	                }

	                cb(null, tags);
	            });
	        };

	        // Show repository information
	        // -------

	        this.show = function (cb) {
	            _request("GET", repoPath, null, cb);
	        };

	        // Show repository contributors
	        // -------

	        this.contributors = function (cb, retry) {
	            retry = retry || 1000;
	            var self = this;
	            _request("GET", repoPath + "/stats/contributors", null, function (err, data, response) {
	                if (err) return cb(err);
	                if (response.status === 202) {
	                    setTimeout(function () {
	                        self.contributors(cb, retry);
	                    }, retry);
	                } else {
	                    cb(err, data);
	                }
	            });
	        };

	        // Get contents
	        // --------

	        this.contents = function (ref, path, cb) {
	            path = encodeURI(path);
	            _request("GET", repoPath + "/contents" + (path ? "/" + path : ""), {
	                ref: ref
	            }, cb);
	        };

	        // Read file at given path
	        // -------

	        this.read = function (branch, path, cb) {
	            _request("GET", repoPath + "/contents/" + encodeURI(path) + (branch ? "?ref=" + branch : ""), null, function (err, obj) {
	                if (err && err.error === 404) return cb("not found", null, null);

	                if (err) return cb(err);
	                cb(null, obj);
	            }, true);
	        };
	    };

	    // Gists API
	    // =======

	    Github.Gist = function (options) {
	        var id = options.id;
	        var gistPath = "/gists/" + id;

	        // Read the gist
	        // --------

	        this.read = function (cb) {
	            _request("GET", gistPath, null, function (err, gist) {
	                cb(err, gist);
	            });
	        };
	    };

	    // Issues API
	    // ==========

	    Github.Issue = function (options) {
	        var path = "/repos/" + options.user + "/" + options.repo + "/issues";

	        this.list = function (options, cb) {
	            var query = [];
	            for (var key in options) {
	                if (options.hasOwnProperty(key)) {
	                    query.push(encodeURIComponent(key) + "=" + encodeURIComponent(options[key]));
	                }
	            }
	            _requestAllPages(path + '?' + query.join("&"), cb);
	        };
	    };

	    console.log(Github);

	    if (true) {
	        module.exports = Github;
	    } else {
	        console.log('window is used: Github');
	        window.Portfolio = window.Portfolio ? window.Portfolio : {};
	        window.Portfolio.Github = Github;
	    }
	}).call(undefined);

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	(function () {
	    Object.defineProperty(GithubSession, 'NS', {
	        value: 'Portfolio'
	    });

	    Object.defineProperty(GithubSession, 'CLASS_NAME', {
	        value: 'GithubSession'
	    });

	    function GithubSession() {
	        Object.defineProperty(this, 'sessionable', {
	            value: true
	        });

	        Object.defineProperty(this, 'user', {
	            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableString('sanjay1909'))
	        });
	    }

	    var p = GithubSession.prototype;

	    if (true) {
	        module.exports = GithubSession;
	    } else {
	        console.log('window is used');
	        window.Portfolio = window.Portfolio ? window.Portfolio : {};
	        window.Portfolio.GithubSession = GithubSession;
	    }
	})();

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _react = __webpack_require__(2);

	var React = _interopRequireWildcard(_react);

	var Publications = (function (_React$Component) {
	    _inherits(Publications, _React$Component);

	    function Publications() {
	        _classCallCheck(this, Publications);

	        _get(Object.getPrototypeOf(Publications.prototype), "constructor", this).apply(this, arguments);
	    }

	    _createClass(Publications, [{
	        key: "render",
	        value: function render() {
	            return React.createElement(
	                "div",
	                { className: "row" },
	                React.createElement(
	                    "div",
	                    { className: "col-md-8" },
	                    React.createElement(
	                        "h2",
	                        null,
	                        " Will Update Soon "
	                    )
	                )
	            );
	        }
	    }]);

	    return Publications;
	})(React.Component);

	module.exports = Publications;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _react = __webpack_require__(2);

	var React = _interopRequireWildcard(_react);

	var Contributions = (function (_React$Component) {
	    _inherits(Contributions, _React$Component);

	    function Contributions() {
	        _classCallCheck(this, Contributions);

	        _get(Object.getPrototypeOf(Contributions.prototype), "constructor", this).apply(this, arguments);
	    }

	    _createClass(Contributions, [{
	        key: "render",
	        value: function render() {
	            return React.createElement(
	                "div",
	                { className: "row" },
	                React.createElement(
	                    "ul",
	                    null,
	                    React.createElement(
	                        "li",
	                        null,
	                        React.createElement(
	                            "a",
	                            { href: "http://blog.asanjay.com/", target: "_blanck" },
	                            React.createElement("i", { className: "fa fa-newspaper-o" }),
	                            "Blog"
	                        )
	                    ),
	                    React.createElement(
	                        "li",
	                        null,
	                        React.createElement(
	                            "a",
	                            { href: "http://sanjay1909.github.io/Tutorials/", target: "_blanck" },
	                            React.createElement("i", { className: "fa fa-book" }),
	                            "Tutorials"
	                        )
	                    )
	                )
	            );
	        }
	    }]);

	    return Contributions;
	})(React.Component);

	module.exports = Contributions;

/***/ }
/******/ ]);
//# sourceMappingURL=portfolio.js.map
