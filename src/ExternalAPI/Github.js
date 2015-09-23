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
            url += ((/\?/).test(url) ? '&' : '?');
            // Fix #195 about XMLHttpRequest.send method and GET/HEAD request
            if (data && typeof data === "object" && ['GET', 'HEAD'].indexOf(method) > -1) {
                url += '&' + Object.keys(data).map(function (k) {
                    return k + '=' + data[k];
                }).join('&');
            }
            return url + '&' + (new Date()).getTime();
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

    var Github = function () {


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
                    setTimeout(
                        function () {
                            self.contributors(cb, retry);
                        },
                        retry
                    );
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

    if (typeof exports !== 'undefined') {
        module.exports = Github;
    } else {
        console.log('window is used: Github');
        window.Portfolio = window.Portfolio ? window.Portfolio : {};
        window.Portfolio.Github = Github;
    }
}).call(this);
