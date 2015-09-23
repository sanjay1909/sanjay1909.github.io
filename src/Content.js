import * as React from "react";
import Home from './pages/Home';
import Academic from './pages/Academic';
import Projects from './pages/Projects';
import Publications from './pages/Publications';
import Contributions from './pages/Contributions';

class Content extends React.Component {

    constructor(props) {
        super(props)
        this.activePage = WeaveAPI.globalHashMap.getObject("activePage");
        this.routes = {
            undefined: < Home / > ,
            '/': < Home / > ,
            'home': < Home / > ,
            'academics': < Academic / > ,
            'projects': < Projects / > ,
            'publications': < Publications / > ,
            'contributions': < Contributions / >
        };


        this.state = {
            page: this.activePage.value
        };


        this._updateState = this._updateState.bind(this);
    }

    componentDidMount() {
        this.activePage.addImmediateCallback(this, this._updateState, true);

    }



    _updateState() {
        console.log("page changed");
        this.setState({
            page: this.activePage.value
        });
    }

    componentWillUnmount() {
        this.activePage.removeCallback(this, this._updateState)
    }

    render() {

        var pageComponent = this.routes[this.state.page];
        console.log(pageComponent);
        return pageComponent;



    }


}

module.exports = Content;
