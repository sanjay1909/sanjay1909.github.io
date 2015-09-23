import * as React from 'react';

var GithubSession = require('../ExternalAPI/GithubSession.js');



class Projects extends React.Component {
    constructor() {
        super()
        this.gitHub = WeaveAPI.globalHashMap.requestObject("gitHub", GithubSession);
        this.state = {
            repos: this.gitHub.repos
        }

        this._setReactState = this._setReactState.bind(this);

    }

    componentDidMount() {
        this.gitHub._reposUserName.addImmediateCallback(this, this._setReactState);
    }


    componentWillUnmount() {
        this.gitHub._reposUserName.removeCallback(this._setReactState);
    }


    _setReactState() {

        this.setState({
        repos: this.gitHub.repos
        });
    }

    render() {


        var repoList =this.state.repos ? this.state.repos.map(function(repo){
            var name = repo['name'];
            var description = repo['description'];
            var url = repo['html_url'];

            if(name === 'ui-slider' ||name === 'as-me' ||name === 'FormVisualization'  ||name === 'sanjay1909.github.io' )return null;
            return <div className="col-md-4">
                        <div className="panel panel-default">
                            <div className="panel-body">
                            <h4>{name}</h4>
                            {description}
                            </div>
                            <div className="panel-footer"><a href={url} target='_blank'>Read More..</a></div>
                        </div>
                    </div>;

                    }) :[];
        return <div className = "row" >
        {repoList}

            < /div> ;
    }
}

module.exports = Projects;
