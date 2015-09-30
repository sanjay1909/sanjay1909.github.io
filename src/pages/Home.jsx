import * as React from 'react';

class Home extends React.Component {
    render() {
        return <div className = "row home" >
                < div className = "col-md-4 text-center" >
                     < span > < img src = "images/me.PNG" / > < /span>
                < /div >
                < div className = "col-md-8" >
                < h2 ><span className="colorOne"> Sanjay </span><span  className="colorTwo">Krishna </span>< /h2>
                 </div >
            < /div > ;
    }
}

module.exports = Home;
