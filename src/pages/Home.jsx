import * as React from 'react';

class Home extends React.Component {

    render() {
	    var functionText = "function ShowReport(data)\n {\nreturn visualization;\n}\n";

        return <div className = "row home" >
                < div className = "col-md-4 text-center" >
                     < span > < img src = "images/me.PNG" /> </span>
                </div>
                <div className = "col-md-8" >
                    <h2><span className="colorOne"> Sanjay </span><span  className="colorTwo">Krishna </span></h2>
	                <br/>
	                <br/>
	                <br/>
	                <br/>
	                <div className="colorOne" style={{width:"460px",textAlign:"justify"}}>
		                <span>I consider myself as a <span className="colorTwo">Software Engineer</span> actively involved in open source projects.</span>
	                    <span>This site is the result of our Data framework - <a target="_blank" href="weave/index.html?file=SanjayResume.weave" className="colorTwo">WeaveCoreJS</a> and Facebook UI framework - <span className="colorTwo">ReactJS</span></span>
		                <span> To give a taste of what i have been part of last few years, i prepared a use case using our open source project.</span>

	                </div>
	                <br/>
	                <div className="colorOne" style={{width:"480px"}}>
		                <div style={{display:"flex"}}>
			                <div className="colorTwo" style={{paddingRight:"8px",whiteSpace: "nowrap"}}>Link 1:</div>
			                <span><a style={{fontSize:"18px",fontWeight: "bold"}} className="colorOne" target="_blank" href="weave/Embed.html"> INTERACTIVE RESUME</a>  (Report Mode)</span>
		                </div>
		                <div style={{display:"flex"}}>
			                <div className="colorTwo" style={{paddingRight:"8px",whiteSpace: "nowrap"}}>Link 2:</div>
			                <div>
				                <div><a  className="colorOne" target="_blank" href="weave/index.html?file=SanjayResume.weave"> <span style={{fontSize:"18px",fontWeight: "bold"}}>DATA<span className="colorTwo"> &#8614;</span> VISUALIZATION</span></a>  (Dashboard Mode)</div>
		                        <span className="colorOne"> (Use the <span className="colorTwo">History Button </span> in the menu bar to experience the steps involved)</span>
		                    </div>
	                    </div>
	                
                    </div>
                 </div>
        </div> ;
    }
}

module.exports = Home;
