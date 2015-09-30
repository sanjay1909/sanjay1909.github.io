import * as React from 'react';

class Navigation extends React.Component {
    render() {
        return <nav className="navbar navbar-default portfolio-menu" role="navigation">
		<div className="container-fluid">
			<div className="navbar-header responsive-logo">
				<button className="navbar-toggle collapsed" type="button" data-toggle="collapse" data-target="#bs-navbar-collapse-1">
                    <span className="sr-only">Toggle navigation</span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
				</button>
				<div className="navbar-brand">
                    <span className="colorOne">Sanjay Krishna</span><span  className="colorTwo"> Anbalagan </span>
				</div>
			</div>
			<div className="collapse navbar-collapse" id="bs-navbar-collapse-1">
                <ul className="nav navbar-nav navbar-right responsive-nav ">
                    <li><a href="#home">About-Me</a></li>
                    <li><a href="#academics">Academics</a></li>
                    <li><a href="#projects">Projects</a></li>
                    <li><a href="#publications">Publicaitons</a></li>
                    <li><a href="#contributions">Contributions</a></li>


                </ul>
			</div>
		</div>
	</nav>;
    }
}

module.exports = Navigation;
