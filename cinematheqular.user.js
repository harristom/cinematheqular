// ==UserScript==
// @name         Cinematheqular
// @namespace    https://github.com/harristom
// @version      2024-03-11
// @description  Adds movie plots and ratings to the Ville de Luxembourg Cinematheque website
// @author       https://github.com/harristom
// @match        https://www.vdl.lu/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // Paste your OMDB API key below inside the quote marks
    const OMDB_API_KEY = '';

    function formatRtRating(rating) {
        const FRESH_THRESHOLD = 60;
        return (parseInt(rating) >= FRESH_THRESHOLD ? '🍅 ' : '🍏 ') + rating;
    }

    function cleanTitle(title) {
        // Remove ending brackets from the title (often used to indicate the showing is part of a season)
        title = title.trim();
        return title.replaceAll(/ \(.*$/gi, '');
    }

    function agendaPage() {
        const RATINGS_CLASS_NAME = 'cinematheqular-ratings';

        GM_addStyle(`
            /* Hide the categories as it will be "Cinema" on all and the language tags are always wrong */
            .media-inner .media-category {
                display: none;
            }

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
            const titleEl = movieEl.querySelector('.media-title');
            if (!titleEl) continue;
            let title = titleEl.textContent;
            title = cleanTitle(title);
            fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&type=movie&t=${title}`)
                .then(response => response.json())
                .then(result => {
                    if (result.Error) return;
                    const tooltip = `${result.Title} (${result.Year}) ${result.Director}`;
                    // Add plot
                    const imgEl = movieEl.querySelector('.media-image figure');
                    if (imgEl) {
                        imgEl.dataset.content = result.Plot;
                        imgEl.title = tooltip;
                    }
                    // Add ratings
                    const rtRating = result.Ratings?.find(r => r.Source == 'Rotten Tomatoes')?.Value;
                    if (rtRating) {
                        const ratingEl = document.createElement('p');
                        ratingEl.className = RATINGS_CLASS_NAME;
                        ratingEl.textContent = formatRtRating(rtRating);
                        ratingEl.title = tooltip;
                        titleEl.append(ratingEl);
                    }
                })
                .catch(error => console.log('error', error));
        }
    }

    function detailPage() {
        const DETAILS_CLASS_NAME = 'cinematheqular-details';

        GM_addStyle(`
            .${DETAILS_CLASS_NAME} {
                border-radius: 7px;
                border: 2px solid #E4E4E4;
                padding: 10px 20px 20px 20px;
                margin-bottom: 20px;
            }

            .${DETAILS_CLASS_NAME}__disclaimer {
                text-transform: uppercase;
                margin-block: 0px 10px;
                font-size: 0.8rem;
                opacity: 0.8;
            }

            .${DETAILS_CLASS_NAME}__wrapper {
                display: flex;
                justify-content: center;
                align-items: start;
                flex-wrap: wrap;
                gap: 20px;
            }
        
            .${DETAILS_CLASS_NAME}__poster {
                display: block;
                object-fit: contain;
                overflow: hidden;
                flex: 1 100px;
                max-width: 200px;
                border-radius: 3px;
            }
        
            .${DETAILS_CLASS_NAME}__data {
                flex: 3 300px;
            }

            .${DETAILS_CLASS_NAME}__title {
                font-size: 1.8em;
                margin-bottom: 5px;
            }

            .${DETAILS_CLASS_NAME}__director {
                margin-top: 0px;
                margin-bottom: 5px;
                color: #b6b6b6;
                font-weight: 600;
            }

            .${DETAILS_CLASS_NAME}__ratings {
                margin-top: 0px;
                margin-bottom: 10px;
            }

            .${DETAILS_CLASS_NAME}__plot {
                margin: 0px;
            }
        `);
        
        let titleEl = document.querySelector('.block-page-title');
        if (!titleEl) return;
        const title = cleanTitle(titleEl.textContent);
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&type=movie&plot=full&t=${title}`)
            .then(response => response.json())
            .then(result => {
                if (result.Error) return;
                const detailsEl = document.createElement('div');
                detailsEl.className = DETAILS_CLASS_NAME;
                detailsEl.innerHTML = `
                    <p class="${DETAILS_CLASS_NAME}__disclaimer"><small>Added by <a href="https://github.com/harristom/cinematheqular">Cinematheqular</a> &mdash; please check the rest of the listing to ensure the information is correct</small></p>
                    <div class="${DETAILS_CLASS_NAME}__wrapper">
                        <img src="" alt="" class="${DETAILS_CLASS_NAME}__poster">
                        <div class="${DETAILS_CLASS_NAME}__data">
                            <h2 class="${DETAILS_CLASS_NAME}__title"></h2>
                            <p class="${DETAILS_CLASS_NAME}__director"></p>
                            <p class="${DETAILS_CLASS_NAME}__ratings"></p>
                            <p class="${DETAILS_CLASS_NAME}__plot"></p>
                        </div>
                    </div>
                `;
                detailsEl.querySelector(`.${DETAILS_CLASS_NAME}__poster`).src = result.Poster;
                detailsEl.querySelector(`.${DETAILS_CLASS_NAME}__title`).textContent = `${result.Title} (${result.Year})`;
                const rtRating = result.Ratings.find(r => r.Source == 'Rotten Tomatoes')?.Value;
                if (rtRating) detailsEl.querySelector(`.${DETAILS_CLASS_NAME}__ratings`).textContent = formatRtRating(rtRating);
                detailsEl.querySelector(`.${DETAILS_CLASS_NAME}__plot`).textContent = result.Plot;
                detailsEl.querySelector(`.${DETAILS_CLASS_NAME}__director`).textContent = result.Director;
                document.querySelector('.event-full .node-content .container')?.prepend(detailsEl);
            })
            .catch(error => console.log('error', error));
    }

    function isAgendaPage() {
        return /cinematheque\/(?:film-programme|programm|agenda)$/.test(location.href);
    }

    function isDetailPage() {
        return true &&
            // Matches the URL pattern for an event page
            /^https:\/\/www\.vdl\.lu\/.*?\/(?:kalender|agenda|whats-on)\//.test(location.href) &&
            // Event location is Cinematheque
            document.querySelector('.media-place-content')?.textContent.trim().startsWith('Cinémathèque');
    }

    if (isAgendaPage()) {
        console.log('agenda');
        agendaPage();
    } else if (isDetailPage()) {
        console.log('detail');
        detailPage();
    }

})();