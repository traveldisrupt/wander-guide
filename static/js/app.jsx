var API = {
    baseURL: "https://api.wander.host/api/1/",
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
    },
    startTour: function(tripID, success_callback, error_callback) {
        var data = {
            username: "ford_prefect",
            action: "accept",
            trip_id: tripID
        };

        this.post("trips/", data, success_callback, error_callback);
    },
    endTour: function(tripID, success_callback, error_callback) {
        var data = {
            username: "ford_prefect",
            action: "cancel",
            trip_id: tripID
        };

        this.post("trips/", data, success_callback, error_callback);
    },
    getTwilioToken: function(success_callback, error_callback) {
        this.get("twilio/token/?user=ryan", success_callback, error_callback);
    },
    callTraveller: function() {
            var params = {
                To: "arthur"
            };
            console.log('Calling ' + params.To + '...');
            Twilio.Device.connect(params);
    },
    endCall: function() {
        Twilio.Device.disconnectAll();
    }
}

var AppContainer = React.createClass({
    getInitialState: function() {
        return {
            status: "no_trips",
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
        API.getTwilioToken(function(data) {
            Twilio.Device.setup(data.token);
        }, function() {

        })
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
            status: trip.status,
            tripID: trip.id,
            currentLocation: [trip.current_location.lat, trip.current_location.lon],
            startTime: trip.start_time,
            traveller: trip.traveler,
            startLocation: trip.start_location,
            facts: trip.facts.list
        }, onCompletion);
    },
    handleToggleOnlineStatus: function() {
        this.setState({
            online: !this.state.online
        }, function() {
            if (!this.state.online && this.state.tripID) {
                API.endCall();
                API.endTour(this.state.tripID, function() {}, function() {});
            }
        });
    },
    render: function() {

        var live = this.state.status == "live" && this.state.online;
        var overlayShown = ((this.state.status == "waiting" || this.state.status == "no_trips") && this.state.online);
        var icon = L.icon({
            iconUrl: '/static/images/profile-pic.png',
            iconRetinaUrl: '/static/images/profile-pic@2x.png',
            iconSize: [40, 92],
            iconAnchor: [19, 92]
        });

        var marker = this.state.online && (this.state.status == "live" || this.state.status == "waiting") ? <ReactLeaflet.Marker 
            position={this.state.currentLocation}
            icon={icon}
        /> : null;

        var mapCenter = this.state.online && this.state.status != "no_trips" ? this.state.currentLocation : [37.793656, -122.43007];
        var zoom = this.state.online && this.state.status != "no_trips" ? 16 : 14;

        var loginSuggestion = this.state.online ? null : <div className="loginSuggestion">
            <div className="arrowUp"></div>
            Go online and start accepting tours.
        </div>;

        return (
            <div className="appContainer">
                <NavigationBar state={this.state} online={this.state.online} onToggleOnlineStatus={this.handleToggleOnlineStatus} />
                {loginSuggestion}
                <ReactLeaflet.Map id="map" center={mapCenter} zoom={zoom}>
                    <ReactLeaflet.TileLayer
                        url='https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoibm9ydG9ucnlhbjEiLCJhIjoiY2lzMWs4eG5iMDd2NDJubXoweXMzdmY0OSJ9.tzK9XEGav_T36H_wYM4isg'
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        detectRetina="true"
                    />
                    {marker}
                    {this.state.facts.map(function(fact, i) {
                        if (!this.state.online || this.state.status != "live") {
                            return null;
                        }
                        return <ReactLeaflet.Marker
                            position={[fact.lat, fact.lon]}
                            icon={new L.Icon.Default}
                        />;
                    }.bind(this))}


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
                <div className="headerCard">
                    <div className="headerCardTitle">SUGGESTIONS</div>
                    Nearby places to suggest to your wanderer.
                    <div className="arrowDown"></div>
                </div>
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
                    <span className="infoCardContentBold">{this.props.fact.title}</span>
                    {this.props.fact.text}
                </div>
            </div>
        );
    }
});

var MapOverlay = React.createClass({
    handleStartTour: function() {
        API.startTour(this.props.state.tripID, function() {
            API.callTraveller();
        }, function() {
            // error
        });
    },
    render: function() {
        var _class = "mapOverlay" + (this.props.shown ? " shown" : "");
        var content = null;
        if (this.props.state.status == "no_trips" && this.props.state.online) { // waiting, live, cancelled, no_trips
            content = <div>
                <img className="waitingImg" src="/static/images/ring.svg"></img>
                <p className="waitingText">Waiting for wanderers...</p>
            </div>
        } else if (this.props.state.status == "waiting" && this.props.state.online) {
            content = <div className="requestContainer">
                <img className="requestImg" src="https://scontent-sjc2-1.xx.fbcdn.net/v/t1.0-1/p320x320/225624_1029986543688308_5773908915984328127_n.jpg?oh=5eab2a19c130ef2b15e8d8d5fac69468&oe=5844F020"></img>
                <p className="requestName">{this.props.state.traveller.name}</p>
                <p className="requestDescription">is new to the city and would like a guided tour</p>
                <button className="requestButton requestButtonDecline">DECLINE</button>
                <button onClick={this.handleStartTour} className="requestButton requestButtonAccept">START TOUR</button>
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
    handleEndTour: function() {
        API.endCall();
        API.endTour(this.props.state.tripID, function() {}, function() {});
    },
    render: function() {
        if (this.props.state.status != "live" || !this.props.state.online) {
            return null;
        }

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
                    <button onClick={this.handleEndTour} className="endTourButton">END TOUR</button>
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
