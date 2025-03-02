# Slotify: Pickhacks 2025 Project
Developers: Eli Wolf, Lucas Gehner, and Logan Gray
## Local Installation Instructions
1. Install Node.js [here](https://nodejs.org/en/download)
2. Inside the slotify directory, run `$ npm install` to install all dependencies for the project
3. Start the server with `$ npm start` in the slotify directory
4. The site is now up and can now be accessed at the address in the terminal output. It can be stopped with CTRL+C.
## Application Usage
## NOTE FOR RUNNING THIS PROJECT FOR THE FIRST TIME
This project was made in connection with the Spotify Web API. To receive full access to this API, Spotify users looking to run this website application on their own will need to either:
1. Create a new project on the [Spotify Web API](https://developer.spotify.com/dashboard) and in dashboard, copy and paste your client ID and put it on line 23 in App.jsx
2. Send Lucas Gehner an email at lmggxf@umsystem.edu with the full name and email associated with your spotify account. You will be added to the project and should have access to the Spotify Web Player SDK with the already used client_id. 

This project is compliant with the Spotify Web API Terms of Service, but requires at least 6 weeks to verify the source code to let anyone receive full access with their spotify account. We do apologize for this inconvienence. 

We **strongly** encourage you to run the website on a FireFox Browser, as that has the strongest support with the Spotify Web Player SDK

**Note: This application relies on Spotify integrations that are exclusive to Spotify Premium members. The app is not usable without Spotify Premium.**
1. Upon visiting the site, you will first be met with a Spotify login page. You must login and grant the Slotify application access to the listed permissions for the app to function.
2. Enter the link to any public playlist with the songs you want in your song bank during the guessing game.
3. Press the listen button to hear your first snippet of the song to guess. It will play for about 3 seconds, and the duration will double after each guess is submitted. You can listen multiple times before submitting a guess.
4. Search for the song you want to guess in the "Guess the song..." box. It will populate the drop down menu with the results. To populate the dropdown with all songs in the playlist, make a search with the textbox empty.
5. After selecting a song from the dropdown menu, press the gray submit button to enter the guess. A row will appear in the guesses table with the data of the song you guessed. For each category, a green box means the value of your guess was the same as the target song, a yellow box means the value was close, and a gray box means it was not close.
6. Repeat steps 4 and 5 until you are able to guess the song. Remember, the duration of the snippet you get to listen to doubles after each guess.
7. After guessing, you can either play again to use the same song bank and keep incrementing your score, or you can start over to use a different playlist.

