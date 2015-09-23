import Portfolio from 'Portfolio';

var Navigation = Portfolio.Navigation;
var Content = Portfolio.Content;

WeaveAPI.globalHashMap.requestObject("academicsData", weavecore.LinkableVariable);
var activePage = WeaveAPI.globalHashMap.requestObject("activePage", weavecore.LinkableString);
d3.json("academics.json", function (json) {
    WeaveAPI.globalHashMap.getObject("academicsData").setSessionState(JSON.stringify(json));
});

locationHashChanged();



window.addEventListener("hashchange", locationHashChanged, false);

function locationHashChanged() {
    try {
        activePage.value = window.location.hash.substr(1) || '/';
    } catch (err) {
        console.log("LocationHashchange - error: ", err);
        activePage.value = 'error';
    }
}





React.render( < Navigation / > , document.getElementById('Menu'));
React.render( < Content / > , document.getElementById('Content'));
