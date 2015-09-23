import * as React from 'react';

class Navigation extends React.Component {
    render() {
        return <div id="main-nav" className="navbar navbar-inverse bs-docs-nav" role="banner">
		<div className="container">
			<div className="navbar-header responsive-logo">
				<button className="navbar-toggle collapsed" type="button" data-toggle="collapse" data-target="#bs-navbar-collapse">
                    <span className="sr-only">Toggle navigation</span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
				</button>
				<div className="navbar-brand">
                    Sanjay Krishna Anbalagan
				</div>
			</div>
			<nav className="navbar-collapse collapse" role="navigation" id="bs-navbar-collapse">
                <ul className="nav navbar-nav navbar-right responsive-nav main-nav-list">
                    <li><a href="#home">About-Me</a></li>
                    <li><a href="#projects">Projects</a></li>
                    <li><a href="#publications">Publicaitons</a></li>
                    <li><a href="#contributions">Contributions</a></li>
                    <li><a href="#academics">Academics</a></li>

                </ul>
			</nav>
		</div>
	</div>;
    }
}

module.exports = Navigation;
