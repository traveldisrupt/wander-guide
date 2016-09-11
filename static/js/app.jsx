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
            status: "idle",
            tripID: null,
            currentLocation: null,
            startTime: null,
            traveller: null,
            startLocation: null,
            online: false,
            facts: []
        };
    },
    componentDidMount: function() {
        this.poll();
    },
    poll: function() {
        API.getWorld(function(data) {
            this.handleTripData(data.data.trip, function() {
                this.poll();
            }.bind(this));
        }.bind(this), function(error) {
            this.poll()
        }.bind(this));
    },
    handleTripData: function(trip, onCompletion) {
        this.setState({
            status: "live",
            tripID: trip.id,
            currentLocation: trip.current_location,
            startTime: trip.start_time,
            traveller: trip.traveller,
            startLocation: trip.start_location,
            facts: trip.facts
        }, onCompletion);
    },
    handleToggleOnlineStatus: function() {
        this.setState({
            online: !this.state.online
        });
    },
    render: function() {

        var live = this.state.status == "live" && this.state.online;
        var overlayShown = ((this.state.status == "waiting" || this.state.status == "no_trips") && this.state.online);
        var icon = L.icon({
            iconUrl: '/static/images/profile-pic.png',
            iconRetinaUrl: '/static/images/profile-pic@2x.png',
            iconSize: [40, 64],
            iconAnchor: [19, 64]
        });

        return (
            <div className="appContainer">
                <NavigationBar online={this.state.online} onToggleOnlineStatus={this.handleToggleOnlineStatus} />
                <ReactLeaflet.Map id="map" center={[37.7889997, -122.4315116]} zoom={14}>
                    <ReactLeaflet.TileLayer
                        url='https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoibm9ydG9ucnlhbjEiLCJhIjoiY2lzMWs4eG5iMDd2NDJubXoweXMzdmY0OSJ9.tzK9XEGav_T36H_wYM4isg'
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        detectRetina="true"
                    />
                    <ReactLeaflet.Marker 
                        position={[37.7889997, -122.4315116]}
                        icon={icon}
                    />


                </ReactLeaflet.Map>
                <MapOverlay state={this.state} shown={overlayShown} />
                <RightTray state={this.state} />
                <CallController state={this.state} />
            </div>
        )
    }
});

var RightTray = React.createClass({
    render: function() {
        var _class = "rightTray" + (this.props.state.status == "live" && this.props.state.online ? " shown" : "");
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
        if (this.props.state.status == "no_trips") { // waiting, live, cancelled, no_trips
            content = <div>
                <img className="waitingImg" src="/static/images/ring.svg"></img>
                <p className="waitingText">Waiting for tour requests...</p>
            </div>
        } else if (this.props.state.status == "waiting") {
            content = <div className="requestContainer">
                <img className="requestImg" src=""></img>
                <p className="requestName"></p>
                <p className="requestDescription"></p>
                <button className="requestButton requestButtonDecline">DECLINE</button>
                <button className="requestButton requestButtonAccept">START TOUR</button>
            </div>
        } else if (this.props.state.status == "live") {
            content = null;
        }
        return (
            <div className={_class}>
                {content}
            </div>
        )
    }
});

var Loader = React.createClass({
    render: function() {
        var _class = "callIndicator cssload-loader";
        return (
            <div className={_class}>
                <ul>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                </ul>
            </div>
        )
    }
});

var CallController = React.createClass({
    getInitialState: function() {
        return {
            secondsElapsed: 0
        };
    },
    componentDidMount: function() {
        this.start();
    },
    start: function() {
        setInterval(function() {
            var seconds = this.state.secondsElapsed;
            this.setState({secondsElapsed: seconds + 1})
        }.bind(this), 1000)
    },
    render: function() {
        var seconds = this.state.secondsElapsed % 60;
        var minutes = (this.state.secondsElapsed - seconds) / 60;
        var timeStr = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        return (
            <div className="callController">
                <div className="callControllerLeft">
                    <Loader />
                    <div className="callTime">
                        {timeStr}
                    </div>
                </div>
                <div className="callControllerRight">
                    <button className="endTourButton">END TOUR</button>
                </div> 
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
