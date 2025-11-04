// ==UserScript==
// @name         USAFE
// @description  Отдельный раздел USAFE (без "Онлайн")
// @version      7.0
// @author       Ты
// ==/UserScript==

(function () {
    'use strict';

    var init = function() {
        if (!window.Lampa || !Lampa.Plugin || !Lampa.Controller) {
            setTimeout(init, 100);
            return;
        }
        register();
    };

    var BALANCERS = ['https://lampa-balancer.deno.dev', 'https://lampa-proxy.vercel.app'];
    var getBalancer = function() { return BALANCERS[Math.floor(Math.random() * BALANCERS.length)]; };
    var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    function register() {
        function USAFE() {
            this.name = 'usafe';
            this.type = 'menu';  // ← Отдельный пункт в меню

            // === Иконка и название в главном меню ===
            this.menu = function() {
                return {
                    title: 'USAFE',
                    icon: '🎬',
                    view: 'grid'
                };
            };

            // === Загрузка списка фильмов (пример: популярные с TMDB) ===
            this.render = function(view, params) {
                Lampa.Loading.start();

                fetch('https://api.themoviedb.org/3/movie/popular?api_key=4e0e4b6f2b3c8d2f8a1c7d9e6f5a4b3c&language=ru-RU')
                    .then(r => r.json())
                    .then(data => {
                        var items = data.results.slice(0, 20).map(movie => {
                            return {
                                title: movie.title,
                                title_original: movie.original_title,
                                year: movie.release_date ? movie.release_date.split('-')[0] : '',
                                poster: 'https://image.tmdb.org/t/p/w500' + movie.poster_path,
                                onClick: () => this.playMovie(movie.title, movie.release_date ? movie.release_date.split('-')[0] : '')
                            };
                        });

                        view.html(Lampa.Template.get('grid', { items: items }));
                        Lampa.Loading.stop();
                    })
                    .catch(() => {
                        view.html('<div style="text-align:center;padding:50px;color:white;">Ошибка загрузки</div>');
                        Lampa.Loading.stop();
                    });
            };

            // === Воспроизведение ===
            this.playMovie = function(title, year) {
                Lampa.Modal.open({
                    title: 'USAFE • ' + title,
                    html: '<div style="padding:20px;color:white;">Ищем источник...</div>',
                    onClose: () => Lampa.Controller.toggle('content')
                });

                // Alloha
                fetch(getBalancer() + '/alloha?title=' + encodeURIComponent(title) + '&year=' + year, { headers: { 'User-Agent': UA } })
                    .then(r => r.ok ? r.json() : null)
                    .then(d => {
                        if (d && d.data && d.data[0] && d.data[0].iframe_url) {
                            Lampa.PlayerVideo.play({ url: d.data[0].iframe_url, type: 'iframe' });
                            Lampa.Modal.close();
                        }
                    });

                // Collaps (резерв)
                setTimeout(() => {
                    fetch('https://collaps.cc/search?q=' + encodeURIComponent(title))
                        .then(r => r.text())
                        .then(h => {
                            var m = h.match(/href="\/embed\/(\w+)"/);
                            if (m) {
                                Lampa.PlayerVideo.play({ url: 'https://collaps.cc/embed/' + m[1], type: 'iframe' });
                                Lampa.Modal.close();
                            }
                        });
                }, 1000);
            };
        }

        Lampa.Plugin.register(new USAFE());
    }

    init();
})();
