import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

{/* //Generate random stars */}
// document.addEventListener("DOMContentLoaded", () =>{
//   const starContainer = document.querySelector(".stars");
//   for (let i = 0; i < 50; i++){
//       let star = document.createElement("div");
//       star.classList.add("star");
//       let size = Math.random() * 6 + 4 + "px";
//       star.style.width = size;
//       star.style.height = size;
//       star.style.top = Math.random() * 100 + "vh";
//       star.style.left = Math.random() * 100 + "vw";
//       star.style.animationDuration = Math.random() * 3 + 2 + "s";
//       starContainer.appendChild(star);

//   }
// })

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
