// ==UserScript==
// @name         Cinematheqular
// @namespace    https://github.com/harristom
// @version      2024-03-10
// @description  Adds movie plots and ratings to the Ville de Luxembourg Cinematheque website
// @author       https://github.com/harristom
// @match        https://www.vdl.lu/en/visiting/art-and-culture/film/cinematheque/film-programme
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // Paste your OMDB API key here
    const OMDB_API_KEY = '';
    
    const RATINGS_CLASS_NAME = 'cinematheqular-ratings';
    const PLOT_CLASS_NAME = 'cinematheqular-plot';

    GM_addStyle(`
        .${RATINGS_CLASS_NAME} {
            color: #4A4A4A;
            font-weight: 400;
        }

        .media-image figure[data-content] {
            position: relative;
            &::after {
                position: absolute;
                inset: 0px;
                color: white;
                background: linear-gradient(black, transparent);
                padding: 3px;
                content: attr(data-content);
                font-size: 0.85em;
                line-height: 1.2;
                transition: 0.2s;
                opacity: 0;
                mask: linear-gradient(black 80%, transparent);
            }
            .media-link:hover &::after {
                opacity: 1;
            }
        }

    `);

    const movieEls = document.querySelectorAll('.media-inner');
    for (const movieEl of movieEls) {
        movieEl.querySelector('.media-category').style.display = 'none';
        const titleEl = movieEl.querySelector('.media-title');
        let title = titleEl.querySelector('p').textContent;
        title = title.replaceAll(/ \(.*$/gi, '');
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&type=movie&t=${title}`)
            .then(response => response.json())
            .then(result => {
                if (result.Plot) movieEl.querySelector('.media-image figure').dataset.content = result.Plot;
                const ratingEl = document.createElement('p');
                ratingEl.className = RATINGS_CLASS_NAME;
                ratingEl.textContent = (parseInt(result.Ratings[1].Value) >= 60 ? ' 🍅 ' : '🍏') + result.Ratings[1].Value;
                ratingEl.title = `${result.Title} (${result.Year}) ${result.Director}`;
                titleEl.append(ratingEl);
            })
            .catch(error => console.log('error', error));
    }

})();