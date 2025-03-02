import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState, useMemo } from 'react';
import { Buffer } from 'buffer';
import SpotifyWebApi from 'spotify-web-api-js';
import "https://sdk.scdn.co/spotify-player.js";

let deviceID = "";
let deviceReady = false
let theToken = "";
let player = null;

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
  var scope = ["user-library-read", "user-read-playback-state", "user-modify-playback-state", "user-read-currently-playing", "app-remote-control", "streaming", "user-read-playback-position", "playlist-read-private", "playlist-read-collaborative"];

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

  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const spotify = new SpotifyWebApi();

  const [user_id, setUser] = useState("");

  const [stars, setStars] = useState([]);

  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [filteredTracks, setFilteredTracks] = useState([]);

  const [randomSong, setRandomSong] = useState("");

  //for end game scenario
  const [gameOver, setGameOver] = useState(false);
  const [correctSong, setCorrectSong] = useState("Song Title - Artist");
  const [isWin, setIsWin] = useState(false);


  const handleEndGame = () => {
    setAttempts(attempts + 1);
    //handle the endgame here -> when user selects start over
    setBoxValues([]);
    window.location.reload();
  };

   const handlePlayAgain = () => {
      handlePlaylistSumbit();
      setGuess("");
      //setShowDropdoown(false);
      setGameOver(false);
      setIsWin(false);
      setBoxValues([]);
      {
        showDropdown && (
          <button id="listen" onClick={() => playCurrentSongStart()}>Listen</button>
        )
      }
      //setShowDropdoown(false);
    //Reset the game state here as needed
   }

  const handleRestart = () => {
    setPlaylistSubmitted(false);
    setPlaylistLink("");
    handlePlayAgain();
    //Reset the game state here as needed
  }

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
  async function authorizeUser() {
    const result = getTokenFromURL();
    // console.log(result);
    if (result.access_token) {
      // spotify.setAccessToken(result.access_token);
      console.log(result.access_token);
      var date = new Date();
      date.setUTCHours(date.getUTCHours() + 1);
      document.cookie = `access_token=${result.access_token}; expires=${date.toUTCString()}`;
      // console.log(date.toUTCString());
      // console.log(document.cookie);
      document.location.hash = "";
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
      // console.log(items.expires);
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
  }

  authorizeUser();


  //making fuction to handle getting the playlist link
  const [playlistLink, setPlaylistLink] = useState([]);
  const [playlistSubmitted, setPlaylistSubmitted] = useState(false);

  const handlePlaylistChange = (event) => {
    setPlaylistLink(event.target.value);
  };

  const generateSong = () => {
    const parts = playlistLink.split("/");
    const section = parts[parts.length - 1];
    const id = section.split("?")[0];
    var tracks = [];
    spotify.getPlaylistTracks(id).then((result) => {
      setPlaylistTracks(result.items);
      console.log(result.items);
      const rand = randomIntInRange(0, result.items.length);
      setRandomSong(result.items[rand]);
    });
    setShowDropdoown(true);
  }

  //Function to handle playlist submission
  const handlePlaylistSumbit = () => {
    switchOutput();
    console.log("Playlist Submitted:", playlistLink);
    //add logic to process the playlist
    //if the playlist is valid and loads properly:
    if(!(playlistLink == "")){
      setPlaylistSubmitted(true); //hides input & button
    }
    generateSong();
  };

  async function playCurrentSongStart() {
    await playSong(randomSong.track.id);
    // spotify.seek(0);
  }
  
  async function switchOutput() {
    let data = {device_ids: [deviceID]};
    await fetch("https://api.spotify.com/v1/me/player", {method: "PUT", headers: {"Authorization": "Bearer " + spotify.getAccessToken()}, body: JSON.stringify(data)});
  }

  async function playSong(id) {
    // sleep(3000);
    // queue song and skip to (working)

    console.log(id);
    await fetch(`https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3A${id}`, {method: "POST", headers: {"Authorization": "Bearer " + spotify.getAccessToken()}});
    await fetch("https://api.spotify.com/v1/me/player/next", {method: "POST", headers: {"Authorization": "Bearer " + spotify.getAccessToken()}});


    console.log("boxValues: ", boxValues.length, "; sleeping for:", 3000 * Math.pow(2, boxValues));
    await sleep(3000 * Math.pow(2, boxValues.length));
    await spotify.pause();
  }

  function albumCover(album) {
    return album.images[0].url;
  }


  function handleGiveUp() {
    setIsWin(true);
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
    const list = playlistTracks.filter((item) => { return item.track.name.toLowerCase().includes(guess.toLowerCase()) })
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

      const selectedTrack = filteredTracks[selectedOption].track;
      const artist = filteredTracks[selectedOption].track.artists.reduce((a, b) => { return a + ", " + b})
      
      // Check if the selected song matches the random song
    if (selectedTrack.id === randomSong.track.id) {
      setScore(score + 1); // Increment score for correct guess
      setIsWin(true); 
      //handleEndGame();
      console.log("Correct guess!");
    }

      setBoxValues(prev => [
        ...prev,
        {
          songName: filteredTracks[selectedOption].track.name,
          artist: filteredTracks[selectedOption].track.artists[0].name,
          album: filteredTracks[selectedOption].track.album.name,
          year: filteredTracks[selectedOption].track.album.release_date.split("-")[0],
          genre: filteredTracks[selectedOption].track.explicit //is explicit?
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
      <div>Score: <span id="score">{score}</span>/<span id="totalSongs">0</span></div>

      
      {/* <!-- Song Guess Input --> */}
      { playlistSubmitted &&
        (<div>
          <input type="text" id="guessInput" value={guess} onChange={handleGuessChange} placeholder="Guess the song..."></input>
          <button id="submitGuess" onClick={handleGuessSubmit} >Search</button>
        </div>)
      }
      
      {/* <!-- Dropdown for Guess Selection --> */}
      {showDropdown && (
        <select id="guessOptions" style={{display: showDropdown ? "block" : "none"}} onChange={handleDropdownChange} >
        <option value="">Select your guess</option>
        {
          filteredTracks.map((item, index) => {
            return <option value={index}>
              {item.track.name} - {item.track.artists[0].name}
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
      { showDropdown && (
        <button id="giveUp" onClick={handleGiveUp}>Give Up</button> &&
        <button id="listen" onClick={() => playCurrentSongStart()}>Listen</button>
        )
      }

      {/* Result Boxes */}
      <table>
        <tbody>
          <tr>
            <th className="result_box_header">Song Name</th>
            <th className="result_box_header">Artist</th>
            <th className="result_box_header">Album</th>
            <th className="result_box_header">Year</th>
            <th className="result_box_header">Explicit</th>
          </tr>
          {
            boxValues.map((value, index) => (
              <tr>
                <td className="result_box" style={{ backgroundColor: (value.songName == randomSong.track.name)? "#1ED760" : "#bbb" }}> {value.songName} </td>
                <td className="result_box" style={{ backgroundColor: (value.artist == randomSong.track.artists[0].name)? "#1ED760" : "#bbb" }}> {value.artist} </td>
                <td className="result_box" style={{ backgroundColor: (value.album == randomSong.track.album.name)? "#1ED760" : "#bbb" }}> {value.album} </td>
                <td className="result_box" style={{ backgroundColor: (value.year == randomSong.track.album.release_date.split("-")[0])? "#1ED760" : 
                  ((Math.abs(value.year - randomSong.track.album.release_date.split("-")[0])) <= 1) ? "#FFCC60" : "#bbb"
                }}> {value.year} </td>
                {/* note here, value.genre really tells if the song is explicit or not */}
                <td className="result_box" style={{ backgroundColor: (value.genre == randomSong.track.explicit)? "#1ED760" : "#bbb" }}> {(value.genre == true) ? "Yes" : "No"} </td>
              </tr>
          ))}
        </tbody>
      </table>
        
      {isWin && (
          <div className={`endGame ${(gameOver) ? "display: block" : "display: none"}`}> 
            <h2 className="endGame-title" >Game Over!</h2>
              <p className="endGame-subtitle">The correct song was:</p>
              <p className="endgame-song">{randomSong.track.name} by {randomSong.track.artists[0].name} on the {randomSong.track.album.name} album</p>
              <button className="endGame-button-startOver" 
                onClick={() => handleEndGame()} 
                >

                Start Over
              </button>
              <button
                className="endGame-button"
                onClick={() => handlePlayAgain()}
              >
                
                Play Again
              </button>
        

          </div>
        )
      }

    </div>
  );
}

/*************************************************************/
// PLAYER
/*************************************************************/

function setupPlayer(tokenArg) {
    window.onSpotifyWebPlaybackSDKReady = () => {
        const token = tokenArg;
        player = new Spotify.Player({
            name: 'Web Playback SDK Quick Start Player',
            getOAuthToken: cb => { cb(token); },
            volume: 0.5
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            deviceID = device_id;
            deviceReady = true;
        });

        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
            deviceReady = false;
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




