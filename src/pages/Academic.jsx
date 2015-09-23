import * as React from 'react';
var ReactTree = require('../d3/ReactTree.js');

class Academic extends React.Component {
    constructor() {
        super()


    }

    render() {
        return <div className = "row" >
                < ReactTree / >
            </div> ;
    }
}

module.exports = Academic;
