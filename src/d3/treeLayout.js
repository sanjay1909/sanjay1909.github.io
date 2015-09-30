//this.sanjay ? this.sanjay : {};
window.sanjay = window.sanjay ? window.sanjay : {};
(function () {
    function d3Tree() {
        this.config = {};
        this.config.container = {};
        //this.config.size = {};
    }

    var p = d3Tree.prototype;

    function initialize() {

    }

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
                    console.log("Error: " + config.container + " - Not a HTMLDivElement element ")
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
                if (this.config.size.height == 0) this.config.size.height = 400 // when div dont have child value will be zero
            }

        } else {
            this.config.size = {};
            this.config.size.width = parseInt(this.container.style('width'), 10);
            this.config.size.height = parseInt(this.container.style('height'), 10);
            if (this.config.size.height == 0) this.config.size.height = 400 // when div dont have child value will be zero
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

        this.tree = d3.layout.tree()
            .size([height, width - 200]);

        this.diagonal = d3.svg.diagonal()
            .projection(function (d) {
                return [d.y, d.x];
            });

        this.viz = d3.select(this.config.container.element)
            .classed("svg-container", true) //container class to make it responsive
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet") //responsive SVG needs these 2 attributes and no width and height attr
            .attr("viewBox", "0 0 600 600")
            .classed("svg-content-responsive", true) //class to make it responsive
            .append("g")
            .attr("transform", "translate( 60 ,0)");


    }





    function toggleAll(data) {
        if (data.children) {
            data._children = data.children;
            data._children.forEach(toggleAll);
            data.children = null;
        }
    }

    p.loadData = function (json) {

        var height = this.config.size.height;
        this.root = json;
        this.root.x0 = height / 2;
        this.root.y0 = 0;

        //root.children.forEach(collapse);
        // Initialize the display to show a few nodes.
        // root.children.forEach(toggleAll);


        this.update(this.root);
        this.root.children.forEach(toggleAll);
    }

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
        var node = this.viz.selectAll("g.node")
            .data(nodes, function (d, i) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", function (d) {
                toggle(d);
                chart.update(d);
            });

        nodeEnter.append("svg:circle")
            .attr("r", 1e-6)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("svg:text")
            .attr("x", function (d) {
                return d.children || d._children ? -10 : 10;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.name;
            })
            .style("fill-opacity", 1e-6)
            .style("fill", '#f8b45c');

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = this.viz.selectAll("path.link")
            .data(this.tree.links(nodes), function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return chart.diagonal({
                    source: o,
                    target: o
                });
            })
            .transition()
            .duration(duration)
            .attr("d", chart.diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", chart.diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return chart.diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

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

}());
