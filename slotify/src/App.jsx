import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState, useMemo } from 'react';
import { Buffer } from 'buffer';
import SpotifyWebApi from 'spotify-web-api-js';
import "https://sdk.scdn.co/spotify-player.js";

let deviceID = "";
let deviedReady = false
let theToken = "";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*************************************************************/
// AUTHORIZE
/*************************************************************/

async function authorize() {
  const authEndpoint = 'https://accounts.spotify.com/authorize';
  const client_id = "994cffe4b0fc49d7817a16eece086ddc";

  const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }
  
  const codeVerifier  = generateRandomString(64);

  const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  }

  const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  var redirect_uri = "http://localhost:5173";
  var scope = ["user-library-read", "user-read-playback-state", "user-modify-playback-state", "user-read-currently-playing", "app-remote-control", "streaming", "user-read-playback-position"];

  const params = {
    response_type: 'token',
    client_id: client_id,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirect_uri,
  };
  
  const authURL = new URL(authEndpoint);

  authURL.search = new URLSearchParams(params).toString();
  window.location.href = authURL.toString();
  return;
}

function getTokenFromURL() {
  return window.location.hash
    .substring(1)
    .split('&')
    .reduce((initial, item) => {
      let parts = item.split('=');
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {})
}

function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

/*************************************************************/
// APP
/*************************************************************/

function App() {
  const [spotifyToken, setSpotifyToken] = useState("");

  const spotify = new SpotifyWebApi();

  const [user_id, setUser] = useState("");

  const [stars, setStars] = useState([]);

  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [filteredTracks, setFilteredTracks] = useState([]);

  const [randomSong, setRandomSong] = useState("");

  // function to make the stars spawn and twinkle
  useEffect(() => {
      const generatedStars = Array.from({ length: 90 }).map((_, i) => ({
          id: i,
          size: Math.random() * 6 + 4 + "px",
          top: Math.random() * 100 + "vh",
          left: Math.random() * 100 + "vw",
          animationDuration: Math.random() * 3 + 2 + "s"
      }));
      setStars(generatedStars);
  }, []);

  //authorization fun
  useEffect(() => {
    const result = getTokenFromURL();
    // console.log(result);
    if (result.access_token) {
      // spotify.setAccessToken(result.access_token);
      console.log(result.access_token);
      document.cookie = `access_token=${result.access_token}=;expires=${result.expires_in}`;
    }

    if (document.cookie.length > 2) {
      console.log(document.cookie);
      var keys = document.cookie.split('; ');
      // console.log(keys);
      var items = keys.reduce((initial, item) => {
        // console.log(item)
        let parts = item.split('=');
        if (parts.length > 1) {
          initial[parts[0]] = parts[1];
        }
        // console.log(initial);
        return initial;
      }, {})
      spotify.setAccessToken(items.access_token);
      theToken = items.access_token;
      // console.log("Access token", spotify.getAccessToken());
      if (user_id == "") {
        spotify.getMe().then((u) => {
          setUser(u.id);
          console.log("user", u);
        })
      }
      setupPlayer(items.access_token);
    } else {
      authorize();
    }
    switchOutput();
  })


  //making fuction to handle getting the playlist link
  const [playlistLink, setPlaylistLink] = useState([]);
  const [playlistSubmitted, setPlaylistSubmitted] = useState(false);

  const handlePlaylistChange = (event) => {
    setPlaylistLink(event.target.value);
  };

  //Function to handle playlist submission
  const handlePlaylistSumbit = () => {
    console.log("Playlist Submitted:", playlistLink);
    //add logic to process the playlist
    //if the playlist is valid and loads properly:
    if(!(playlistLink == "")){
      setPlaylistSubmitted(true); //hides input & button
    }
    const parts = playlistLink.split("/");
    const section = parts[parts.length - 1];
    const id = section.split("?")[0];
    var tracks = [];
    spotify.getPlaylistTracks(id).then((result) => {
      setPlaylistTracks(result.items);
      console.log(result.items);
      const rand = randomIntInRange(0, result.items.length);
      setRandomSong(result.items[rand]);
      playSong(result.items[rand].track.id);
    });
    
  };
  
  async function switchOutput() {
    let data = {device_ids: [deviceID]};
    await fetch("https://api.spotify.com/v1/me/player", {method: "PUT", headers: {"Authorization": "Bearer " + spotify.getAccessToken()}, body: JSON.stringify(data)});
  }

  async function playSong(id) {
    // sleep(3000);
    // queue song and skip to (working)

    console.log(id);
    await fetch(`https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%${id}`, {method: "POST", headers: {"Authorization": "Bearer " + spotify.getAccessToken()}});
    await fetch("https://api.spotify.com/v1/me/player/next", {method: "POST", headers: {"Authorization": "Bearer " + spotify.getAccessToken()}});


    // await sleep(3000);
  }


  async function handleGiveUp() {
    console.log("transfering to: ", deviceID, typeof deviceID);
    console.log("with token: ", theToken);
    // transfer playback
    let data = {device_ids: [deviceID]};
    await fetch("https://api.spotify.com/v1/me/player", {method: "PUT", headers: {"Authorization": "Bearer " + spotify.getAccessToken()}, body: JSON.stringify(data)});
    // sleep(3000);
    // queue song and skip to (working)
    await fetch("https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3A4iV5W9uYEdYUVa79Axb7Rh", {method: "POST", headers: {"Authorization": "Bearer " + spotify.getAccessToken()}});
    await fetch("https://api.spotify.com/v1/me/player/next", {method: "POST", headers: {"Authorization": "Bearer " + spotify.getAccessToken()}});

  };

  const [guess, setGuess] = useState("");
  //Function to handle guess input changes
  const handleGuessChange = (event) =>{
    setGuess(event.target.value);
  };

  //make a state variable to track whether the dropdown menu is visible
  const [showDropdown, setShowDropdoown] = useState(false);

  //Function to handle guess submission
  const handleGuessSubmit = () => {
    console.log("Guess Submitted:", guess);
    //Add logic to process the guess
    //make the options area appear and fill with options
    //make it appear:
    const list = playlistTracks.filter((item) => { return item.track.name.includes(guess) })
    setFilteredTracks(list);
    console.log(list);
    setShowDropdoown(true);
    // console.log("rand", randomSong);
  };
  //erase this when okay
  const [showResultBoxes, setShowResultBoxes] = useState(false); //T/F show result boxes
  
  //new
  const [resultBoxSets, setResultBoxSets] = useState([]);
  const [selectedOption, setSelectedOption] = useState(""); //holds the selected song from user
  const [boxColors, setBoxColors] = useState({ //holds color values for the result boxes
    songName: "#bbb",
    artist: "#bbb",
    album: "#bbb",
    year: "#bbb",
    genre: "#bbb"
  });

  const [boxValues, setBoxValues] = useState([]);

  //handles dropdown selection
  const handleDropdownChange = (event) => {
    setSelectedOption(event.target.value);
  };

  //function to reveal result boxes when an option is submitted
  const handleSubmitSelection = () => {
    if(selectedOption) {
      setShowResultBoxes(true);
      setResultBoxSets(prevSets => [
        ...prevSets,
        {
          songName: "#bbb",
          artist: '#bbb',
          album: '#bbb',
          year: '#bbb',
          genre: '#bbb'
        }
      ]);
      const artist = filteredTracks[selectedOption].track.artists.reduce((a, b) => { return a + ", " + b})
      setBoxValues(prev => [
        ...prev,
        {
          songName: filteredTracks[selectedOption].track.name,
          artist: "AA",
          album: filteredTracks[selectedOption].track.album.name,
          year: filteredTracks[selectedOption].track.album.release_date,
          genre: filteredTracks[selectedOption].track.name
        }
      ]);
    }
  };

  //Function to update the box colors
  const updateBoxColor = (box, color) => {
    setBoxColors((prevColors) =>({
      ...prevColors,
      [box]: color
    }));
  };

  //html content that is being rendered in index.html
  return (
    <div className="body">
      
      <div className="stars" aria-hidden="true">
                {stars.map(star => (
                    <div
                        key={star.id}
                        className="star"
                        style={{
                            width: star.size,
                            height: star.size,
                            top: star.top,
                            left: star.left,
                            animationDuration: star.animationDuration
                        }}
                    ></div>
                ))}
            </div>
      <h1>Slotify - Guess the Song!</h1>
      
      
      {!playlistSubmitted && (
        <>
        {/* playlist button */}
        <div>
            <input type="text" id="playlistInput" value={playlistLink} onChange={handlePlaylistChange} placeholder="Enter Spotify Playlist Link..."></input>
            <button id="submitPlaylist" onClick={handlePlaylistSumbit}>Enter</button>
        </div>
        </>
      )}
      {/* <!-- Score Display --> */}
      <div>Score: <span id="score">0</span>/<span id="totalSongs">0</span></div>
      
      {/* <!-- Song Guess Input --> */}
      <div>
          <input type="text" id="guessInput" value={guess} onChange={handleGuessChange} placeholder="Guess the song..."></input>
          <button id="submitGuess" onClick={handleGuessSubmit} >Submit</button>
      </div>
      
      {/* <!-- Dropdown for Guess Selection --> */}
      {showDropdown && (
        <select id="guessOptions" style={{display: showDropdown ? "block" : "none"}} onChange={handleDropdownChange} >
        <option value="">Select your guess</option>
        {
          filteredTracks.map((item, index) => {
            return <option value={index}>
              {item.track.name}
            </option>
          })
        }
        </select>
      )}

      {/* Submit Selected Option */}
      {showDropdown && (
        <button onClick={handleSubmitSelection} style={{backgroundColor: "#666699"}}> Submit </button>
      )}

      {/* <!-- Wordle-style Guess History --> */}
      <div id="guessHistory"></div>
      
      {/* <!-- Give Up Button --> */}
      <button id="giveUp" onClick={handleGiveUp}>Give Up</button>

      {/* Result Boxes */}
      <div className="result-boxes-container">
        {boxValues.map((value, index) => (
          <div key={index} className="result-boxes">
          <div className="box" style={{ backgroundColor: {/* function to get color */} }}> {value.songName} </div>
          <div className="box" style={{ backgroundColor: {/* function to get color */} }}> {value.artist} </div>
          <div className="box" style={{ backgroundColor: {/* function to get color */} }}> {value.album} </div>
          <div className="box" style={{ backgroundColor: {/* function to get color */} }}> {value.year} </div>
          <div className="box" style={{ backgroundColor: {/* function to get color */} }}> {value.genre} </div>
        </div>
        ))}
      </div>
        
      

    </div>
  );
}

/*************************************************************/
// PLAYER
/*************************************************************/

function setupPlayer(tokenArg) {
    window.onSpotifyWebPlaybackSDKReady = () => {
        const token = tokenArg;
        const player = new Spotify.Player({
            name: 'Web Playback SDK Quick Start Player',
            getOAuthToken: cb => { cb(token); },
            volume: 0.5
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            deviceID = device_id;
            deviedReady = true;
        });

        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
            devicReady = false;
        });

        player.addListener('initialization_error', ({ message }) => {
            console.error(message);
        });

        player.addListener('authentication_error', ({ message }) => {
            console.error(message);
        });

        player.addListener('account_error', ({ message }) => {
            console.error(message);
        });
/*
        document.getElementById('togglePlay').onclick = function() {
          player.togglePlay();
        };
*/
        player.connect();
    }
  }

export default App;

// https://accounts.spotify.com/en/login?continue=https%3A%2F%2Faccounts.spotify.com%2Fauthorize%3Fscope%3Duser-library-read%26response_type%3Dcode%26redirect_uri%3Dhttps%253A%252F%252Fwww.spotify.com%252F%26client_id%3D0c82f99988594536ac3c77bb81d9dcc9




