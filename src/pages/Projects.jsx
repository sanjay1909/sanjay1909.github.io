import * as React from 'react';

var GithubSession = require('../ExternalAPI/GithubSession.js');



import * as Github from '../ExternalAPI/Github.js';



class Projects extends React.Component {
    constructor() {
        super()
        this.gitHub = WeaveAPI.globalHashMap.requestObject("gitHub", GithubSession);

        this._promise = WeaveAPI.SessionManager.registerLinkableChild(this.gitHub, new weavecore.LinkablePromise(this._getUserRepos.bind(this), this.describePromise.bind(this), true));


        this.state = {
            repos: []
        }

        this._setReactState = this._setReactState.bind(this);
        this._getUserRepos = this._getUserRepos.bind(this);

    }

    describePromise () {
        return console.log("Running For User: ", this.gitHub.user.value);
    }

    _getUserRepos () {
        var usr = new Github.User(this.gitHub.user.value);
        return usr.repos();
    }

    componentDidMount() {

        this._promise.depend(this.gitHub.user);
        WeaveAPI.SessionManager.getCallbackCollection(this._promise).addImmediateCallback(null,this._setReactState.bind(this));
    }


    componentWillUnmount() {
    WeaveAPI.SessionManager.getCallbackCollection(this._promise).removeCallback(this._setReactState.bind(this));
         this._promise.dispose();
    }


    _setReactState() {
        if(this._promise.result){
            this.setState({
                repos: JSON.parse(this._promise.result)
            });
        }
        else{
            console.log(this._promise.error)
            this.setState({
                repos: []
            });
        }


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
