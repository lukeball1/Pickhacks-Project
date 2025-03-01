import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState, useMemo } from 'react';
import { Buffer } from 'buffer';
import SpotifyWebApi from 'spotify-web-api-js';
import "https://sdk.scdn.co/spotify-player.js";

async function authorize() {
  const authEndpoint = 'https://accounts.spotify.com/authorize';
  const client_id = "4cf0ce643f534f989f183b145dcbc95a";

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
  var scope = ["user-library-read", "user-read-playback-state", "user-modify-playback-state", "user-read-currently-playing", "app-remote-control", "streaming", "user-read-playback-position", ];

  const params =  {
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
          console.log("user", user_id);
        })
      }
    } else {
      authorize();
    }
  })


  return (
    <div className="App">
      <script module="type" src="index.jsx"></script>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.jsx</code> and save to test again.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p>{user_id != "" ? user_id : "No user id"}</p>
      </header>
    </div>
  );
}

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("boobs");
        const token = 'BQBhTZa6EORB0x5BKeeERCs_jcjm65he9N9VfP5HE5RZnzLqbxA41qlzgUbdM5lzrr4YISetA3TFSlf457XDz3GbuFlWt6IyLTnjMibFtf6DgSjj-SCOtV4V0_-iH7aJUR4d2oVfoBHw4TTeF3UkDjJZ5TW8gkYapBBrc7qhXF8TzbQ8yjw3YKhNP9Somdfjsl9d0VDqH3JOmoi9PGSRr6YjnXj3fetJLTwYltSI5DQiLbE77rjOba15youe';
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

export default App;

// https://accounts.spotify.com/en/login?continue=https%3A%2F%2Faccounts.spotify.com%2Fauthorize%3Fscope%3Duser-library-read%26response_type%3Dcode%26redirect_uri%3Dhttps%253A%252F%252Fwww.spotify.com%252F%26client_id%3D0c82f99988594536ac3c77bb81d9dcc9
