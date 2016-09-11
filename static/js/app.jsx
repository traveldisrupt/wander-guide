var API = {
    baseURL: "http://api.wander.host/api/1/",
    request: function(relative_url, method, success_callback, error_callback, data) {
        $.ajax({
            url: this.baseURL + relative_url,
            data: data,
            method: method,
            success: function(data) {
                success_callback(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                error_callback(jqXHR, textStatus, errorThrown);
            }
        });
    },
    get: function(relative_url, success_callback, error_callback) {
        this.request(relative_url, "GET", success_callback, error_callback, null);
    },
    put: function(relative_url, data, success_callback, error_callback) {
        this.request(relative_url, "PUT", success_callback, error_callback, data);
    },
    post: function(relative_url, data, success_callback, error_callback) {
        this.request(relative_url, "POST", success_callback, error_callback, data);
    },
    delete: function(relative_url, success_callback, error_callback) {
        this.request(relative_url, "DELETE", success_callback, error_callback, null);
    },
    getWorld: function(success_callback, error_callback) {
        this.get("trips", success_callback, error_callback);
    }
}

var AppContainer = React.createClass({
    getInitialState: function() {
        return {
            status: "tour",
            online: false,
            facts: [
                {
                    category: "LANDMARK",
                    distance: "0.2 MI",
                    text: "This is some cool shit right here. And heres an interesting fact about it."
                },
                {
                    category: "LANDMARK",
                    distance: "0.2 MI",
                    text: "This is some cool shit right here. And heres an interesting fact about it."
                }
            ]
        };
    },
    componentDidMount: function() {
        this.poll();
    },
    poll: function() {
        API.getWorld(function(data) {
            console.log(data);

            this.poll();
        }.bind(this), function(error) {
            this.poll()
        }.bind(this));
    },
    handleToggleOnlineStatus: function() {
        this.setState({
            online: !this.state.online
        });
    },
    render: function() {

        var overlayShown = (this.state.status == "waiting" && this.state.online);

        return (
            <div className="appContainer">
                <NavigationBar online={this.state.online} onToggleOnlineStatus={this.handleToggleOnlineStatus} />
                <ReactLeaflet.Map id="map" center={[37.7889997, -122.4315116]} zoom={14}>
                    <ReactLeaflet.TileLayer
                        url='https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoibm9ydG9ucnlhbjEiLCJhIjoiY2lzMWs4eG5iMDd2NDJubXoweXMzdmY0OSJ9.tzK9XEGav_T36H_wYM4isg'
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        detectRetina="true"
                    />
                </ReactLeaflet.Map>
                <MapOverlay shown={overlayShown} status={this.state.status} />
                <RightTray state={this.state} />
            </div>
        )
    }
});

var RightTray = React.createClass({
    render: function() {
        var _class = "rightTray" + (this.props.state.status == "tour" && this.props.state.online ? " shown" : "");
        return (
            <div className={_class}>
                {this.props.state.facts.map(function(fact, i){
                    return <InfoCard fact={fact} />;
                })}
            </div>
        )
    }
});

var InfoCard = React.createClass({
    render: function() {
        return (
            <div className="infoCard">
                <div className="infoCardLabel">
                    <div className="infoCardLabelPrimary">
                        {this.props.fact.category}
                    </div>
                    <div className="infoCardLabelSecondary">
                        {this.props.fact.distance}
                    </div>
                </div>
                <div className="infoCardContent">
                    {this.props.fact.text}
                </div>
            </div>
        );
    }
});

var MapOverlay = React.createClass({
    render: function() {
        var _class = "mapOverlay" + (this.props.shown ? " shown" : "");
        var content = null;
        if (this.props.status == "waiting") {
            content = <div>
                <img className="waitingImg" src="/static/images/ring.svg"></img>
                <p className="waitingText">Waiting for tour requests...</p>
            </div>
        } else if (this.props.status == "requesting") {
            content = <div>
                <p className="waitingText">test</p>
            </div>
        }
        return (
            <div className={_class}>
                {content}
            </div>
        )
    }
});

var NavigationBar = React.createClass({
    handleToggleOnlineStatus: function() {
        this.props.onToggleOnlineStatus();
    },
    render: function() {
        return (
            <div className="navigationBar">
                <div className="navLeft">
                    <img src="/static/images/logo.png" className="logo"></img>
                    <div id="navTitle">wander</div>
                </div>
                <div className="navRight">
                    <Toggle on={this.props.online} onToggle={this.handleToggleOnlineStatus} />
                </div>
            </div>
        )
    }
});

var Toggle = React.createClass({
    handleToggle: function() {
        this.props.onToggle();
    },
    render: function() {
        var input = <input type="checkbox" name="toggle" className="toggle-checkbox" id="mytoggle"></input>
        if (this.props.on) {
            input = <input type="checkbox" name="toggle" className="toggle-checkbox" id="mytoggle" checked></input>
        }
        return (
            <div className="toggle" onClick={this.handleToggle}>
                {input}
                <label className="toggle-label" for="mytoggle"></label>
            </div>
        )
    }
})

ReactDOM.render(
    React.createElement(AppContainer, null),
    document.getElementById('app')
);
