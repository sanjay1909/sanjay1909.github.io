import * as Github from './Github.js';

console.log(Github);
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

        Object.defineProperty(this, '_userInfoName', {
            value: new weavecore.LinkableString('')
        });
        Object.defineProperty(this, '_reposUserName', {
            value: new weavecore.LinkableString('')
        });
        Object.defineProperty(this, '_orgsUserName', {
            value: new weavecore.LinkableString('')
        });

        this.userInfo;
        this.repos;
        this.orgs;

        initialize.call(this);


    }

    function initialize() {
        this.user.addImmediateCallback(this, updateUser.bind(this), true);
    }

    function updateUser() {
        var usr = new Github.User(this.user.value);
        usr.userInfo(function (err, res) {
            this.userInfo = res;
            this._userInfoName.value = this.user.value;
        }.bind(this));

        usr.repos(function (err, res) {
            this.repos = res;
            this._reposUserName.value = this.user.value;
        }.bind(this));

        usr.orgs(function (err, res) {
            this.orgs = res;
            this._orgsUserName.value = this.user.value;
        }.bind(this));
    }

    var p = GithubSession.prototype;

    if (typeof exports !== 'undefined') {
        module.exports = GithubSession;
    } else {
        console.log('window is used');
        window.Portfolio = window.Portfolio ? window.Portfolio : {};
        window.Portfolio.GithubSession = GithubSession;
    }


}());
