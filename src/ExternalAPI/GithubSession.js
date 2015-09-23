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



    if (typeof exports !== 'undefined') {
        module.exports = GithubSession;
    } else {
        console.log('window is used');
        window.Portfolio = window.Portfolio ? window.Portfolio : {};
        window.Portfolio.GithubSession = GithubSession;
    }


}());
