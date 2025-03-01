import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState, useMemo } from 'react';
import { Buffer } from 'buffer';
import SpotifyWebApi from 'spotify-web-api-js';
import "https://sdk.scdn.co/spotify-player.js";



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

function App() {
  const [spotifyToken, setSpotifyToken] = useState("");

  const spotify = new SpotifyWebApi();

  const [user_id, setUser] = useState("");

  const [stars, setStars] = useState([]);

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
  })

  


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
      
      
      
      {/* playlist button */}
      <div>
          <input type="text" id="playlistInput" placeholder="Enter Spotify Playlist Link..."></input>
          <button id="submitPlaylist">Enter</button>
      </div>
      
      {/* <!-- Score Display --> */}
      <div>Score: <span id="score">0</span>/<span id="totalSongs">0</span></div>
      
      {/* <!-- Song Guess Input --> */}
      <div>
          <input type="text" id="guessInput" placeholder="Guess the song..."></input>
          <button id="submitGuess">Submit</button>
      </div>
      
      {/* <!-- Dropdown for Guess Selection --> */}
      <select id="guessOptions" class="hidden"></select>
      
      {/* <!-- Wordle-style Guess History --> */}
      <div id="guessHistory"></div>
      
      {/* <!-- Give Up Button --> */}
      <button id="giveUp">Give Up</button>

    </div>
  );
}

function setupPlayer(tokenArg) {
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("boobs");
        const token = tokenArg;
        const player = new Spotify.Player({
            name: 'Web Playback SDK Quick Start Player',
            getOAuthToken: cb => { cb(token); },
            volume: 0.5
        });

        // Ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
        });

        // Not Ready
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
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
