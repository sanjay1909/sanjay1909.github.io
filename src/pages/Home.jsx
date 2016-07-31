import * as React from 'react';

class Home extends React.Component {
    render() {
        return <div className = "row home" >
                < div className = "col-md-4 text-center" >
                     < span > < img src = "images/me.PNG" /> </span>
                </div>
                < div className = "col-md-8" >
                    <h2><span className="colorOne"> Sanjay </span><span  className="colorTwo">Krishna </span></h2>
	                <br/>
                    <span><span className="colorTwo"> Digital </span><a className="colorOne" target="_blank" href="weave/Embed.html">Resume</a> </span>
	                <br/>
	                <br/>
	                <br/>
	                <span><a className="colorOne" target="_blank" href="weave/index.html?file=SanjayResume.weave">Click here to see how the digital resume is created</a> </span>
	                <br/>
	                <span className="colorTwo"> Use the History Button in the menu bar to see the steps .......</span>
                 </div >
                 </div> ;
    }
}

module.exports = Home;
