import * as React from 'react';

class Contributions extends React.Component {
    render() {
        return <div className = "row contributions text-center" >

                <div className="col-md-4 col-sm-6 contribution ">
                    <a href="http://blog.asanjay.com/" target="_blanck"><i className="fa fa-newspaper-o"></i></a>
                    <h4><strong>Blog</strong></h4>
                </div>



                <div className="col-md-4 col-sm-6 contribution ">
                     <a href="https://www.behance.net/sanjay1909" target="_blanck"><i className="fa fa-camera"></i></a>
                    <h4><strong>Photoshop</strong></h4>
                </div>

                <div className="col-md-4 col-sm-6 contribution ">
                    <a href="http://sanjay1909.github.io/Tutorials/" target="_blanck"><i className="fa fa-book"></i></a>
                    <h4><strong>Tutorials</strong></h4>

                </div>


            < /div > ;
    }
}

module.exports = Contributions;
