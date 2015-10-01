import * as React from 'react';

var GithubSession = require('../ExternalAPI/GithubSession.js');



import * as Github from '../ExternalAPI/Github.js';



class Projects extends React.Component {
    constructor() {
        super()
        this.gitHub = WeaveAPI.globalHashMap.requestObject("gitHub", GithubSession);

        this._promise = WeaveAPI.SessionManager.registerLinkableChild(this.gitHub, new weavecore.LinkablePromise(this._getUserRepos.bind(this), this.describePromise.bind(this), true));


        this.state = {
            repos: [],
            showUserName:false
        }

        this._setReactState = this._setReactState.bind(this);
        this._getUserRepos = this._getUserRepos.bind(this);
        this.toggleUI = this.toggleUI.bind(this);
        this.updateUserName = this.updateUserName.bind(this);

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
        else if(this._promise.error){

            console.log(this._promise.error)
            this.setState({
                repos: []
            });
        }


    }

    toggleUI(){
        this.setState({
                showUserName: !this.state.showUserName
        });
    }

     updateUserName(){
        this.gitHub.user.value = React.findDOMNode(this.refs.githubUser).value;
    }


//TO-DO add Wiki page links and extract readme - file directly
// provide agear box where user can view their projects
    render() {


        var repoList =this.state.repos ? this.state.repos.map(function(repo){
            var name = repo['name'];
            var description = repo['description'];
            var url = repo['html_url'];
             var demoURL;

             if(repo.owner.login === 'sanjay1909'){
                if(name === 'ui-slider' ||name === 'as-me' ||name === 'FormVisualization'  ||name === 'sanjay1909.github.io' || name === 'Tutorials' )return null;

                if(name === 'VizAdapter' )
                    demoURL = 'https://' + repo.owner.login +".github.io/" +name;
                else
                    demoURL = 'https://' + repo.owner.login +".github.io/" +name + '/demo';
             }
             else{
                demoURL = 'https://' + repo.owner.login +".github.io/" +name;
             }




            return <div className="col-md-4">
                        <div className="card card--medium">
                            <div>
                            <h3 className="card__title">{name}</h3>
                            <p className="card__text">{description}</p>
                            </div>
                            <div className="card__action-bar">
                                <span className="card__button">
                                    <a href={url} target='_blank'>Read More..</a>
                                </span>
                                <span className="card__button pull-right">
                                    <a href={demoURL} target='_blank'><i className="fa fa-external-link"></i> Demo</a>
                                </span>
                            </div>
                        </div>
                    </div>;

            }) :[];
        var userUI;
        if(this.state.showUserName)userUI = <span><input ref="githubUser" type="text" placeholder="GitHub UserName"/><i className="fa fa-refresh" onClick={this.updateUserName}></i></span>;
        return <div className='projects'>
                    <div>
                        <p><span className="colorOne">The contents are populated from <span  className="colorTwo"> gitHub API </span>calls. Personalize with your own Git user name by clicking the bottom right <span  className="colorTwo">gear</span> box</span></p>


                    </div>
                    <div className = "row" >
                        {repoList}
                    < /div>
                    <span  className='controllers'>{userUI}<i className="fa fa-cog" onClick={this.toggleUI} ></i></span>
               < /div>;
    }
}

module.exports = Projects;
