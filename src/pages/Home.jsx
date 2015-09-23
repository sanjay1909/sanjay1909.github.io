import * as React from 'react';

class Home extends React.Component {
    render() {
        return <div className = "row" >
                < div className = "col-md-4" >
                     < span > < img src = "images/me.PNG" / > < /span>
                < /div >
                < div className = "col-md-8" >
                    < h2 > Sanjay Krishna < /h2>
                 </div >
            < /div > ;
    }
}

module.exports = Home;
