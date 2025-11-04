// ==UserScript==
// @name         USAFE
// @description  USAFE (исправленный на основе online_mod)
// @version      8.0
// @author       Ты + Grok
// ==/UserScript==

(function () {
    'use strict';

    // === Инициализация (как в online_mod) ===
    Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') {
            if (Lampa.Storage.field('online_mod_use')) return; // Конфликт с mod

            var online = new USAFE();
            Lampa.Plugin.register(online);

            Lampa.Listener.send('online', { type: 'start', online: online });
        }
    });

    function USAFE() {
        this.name = 'usafe';
        this.type = 'online';  // ← Исправлено: 'online'

        this.start = function () {
            this.create();
        };

        this.create = function () {
            this.activity.loader = true;
            Lampa.Template.add('button', '<div class="full-start__button selector"><div class="full-start__button-t"><div class="full-start__button-text">{{text}}</div><div class="full-start__button-cont"></div></div><div class="full-start__button-b"><div class="full-start__button-b-line"></div></div></div>');
            Lampa.Template.add('online_mod', '<div class="online row section"><div class="online__title selector">{{title}}</div><div class="online__body"></div></div>');
            Lampa.Listener.send('online', { type: 'start', online: this });
        };

        this.render = function (card, item) {
            if (!item || !item.title) return Promise.reject('No item');

            var title = item.title_ru || item.title;
            var year = item.year || '';
            var season = item.season || 1;
            var episode = item.episode || 1;

            return Lampa.Api.search({ query: title + ' ' + year, year: year }).then(function (data) {
                if (data.movie && data.movie.results.length) {
                    var results = data.movie.results;
                    var promises = results.map(function (result) {
                        return fetch(getBalancer() + '/alloha?title=' + encodeURIComponent(result.title) + '&year=' + result.year, {
                            headers: { 'User-Agent': UA }
                        })
                        .then(r => r.ok ? r.json() : null)
                        .then(d => {
                            if (d && d.data && d.data[0] && d.data[0].iframe_url) {
                                return { url: d.data[0].iframe_url, quality: d.data[0].quality || '1080p' };
                            }
                            return null;
                        })
                        .catch(() => null);
                    });

                    return Promise.all(promises).then(function (sources) {
                        sources = sources.filter(Boolean);
                        sources.forEach(function (source) {
                            card.addSource({
                                title: 'USAFE • ' + source.quality,
                                quality: source.quality,
                                timeline: true,  // ← Для серий
                                onplay: function () {
                                    Lampa.PlayerVideo.play({
                                        url: source.url,
                                        headers: { 'Referer': 'https://google.com', 'User-Agent': UA },
                                        type: 'iframe'
                                    });
                                }
                            });
                        });
                        return Promise.resolve();
                    });
                }
                return Promise.reject('No results');
            }).catch(function (e) {
                console.warn('[USAFE] Search error:', e);
                return Promise.resolve();
            });
        };

        var getBalancer = function() {
            return ['https://lampa-balancer.deno.dev', 'https://lampa-proxy.vercel.app'][Math.floor(Math.random() * 2)];
        };
        var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    }

    // === Загрузка ===
    if (typeof Lampa !== 'undefined') {
        new USAFE().start();
    }
})();
