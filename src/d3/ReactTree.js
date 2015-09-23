import * as React from 'react';
import 'd3';
import './treeLayout.js';

class ReactTree extends React.Component {
    constructor() {
        super()
        this.academics = WeaveAPI.globalHashMap.requestObject("academicsData", weavecore.LinkableVariable);
        this.state = {
            data: this.academics.getSessionState()
        }

        this.tree = new sanjay.d3Tree();

        this._setReactState = this._setReactState.bind(this);

    }

    componentDidMount() {
        this.academics.addImmediateCallback(this, this._setReactState);
        var config = {
            container: React.findDOMNode(this),

        }

        this.tree.create(config)
        if (this.academics.getSessionState())
            this.tree.loadData(JSON.parse(this.academics.getSessionState()));

    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.data) {
            this.tree.loadData(JSON.parse(this.state.data));
        }
    }


    componentWillUnmount() {
        this.academics.removeCallback(this._setReactState);
    }


    _setReactState() {

        this.setState({
            data: this.academics.getSessionState()
        });
    }




    render() {
        return <div > < /div>;
    }
}

module.exports = ReactTree;
