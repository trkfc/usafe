// ==UserScript==
// @name         USAFE
// @description  Alloha + Collaps | 1080p | Кэш
// @version      3.1
// @author       Ты
// ==/UserScript==

(function () {
    'use strict';

    // === Ждём инициализации Lampa (для версии 2.4.6+) ===
    var initPlugin = function() {
        if (window.Lampa && Lampa.Plugin && Lampa.Storage) {
            registerPlugin();
        } else {
            setTimeout(initPlugin, 100);
        }
    };

    // === Кэш ===
    var CACHE_TTL = 600000;
    var cache = {
        set: function(key, value) { Lampa.Storage.set('usafe_' + key, value, CACHE_TTL); },
        get: function(key) { return Lampa.Storage.get('usafe_' + key); }
    };

    // === Балансеры ===
    var BALANCERS = [
        'https://lampa-balancer.deno.dev',
        'https://lampa-proxy.vercel.app'
    ];
    var getBalancer = function() {
        return BALANCERS[Math.floor(Math.random() * BALANCERS.length)];
    };

    // === User-Agent ===
    var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    // === Источники ===
    var SOURCES = [
        {
            name: 'Alloha',
            search: function(title, year) {
                var key = 'alloha_' + title + '_' + year;
                var cached = cache.get(key);
                if (cached) return Promise.resolve(cached);

                return fetch(getBalancer() + '/alloha?title=' + encodeURIComponent(title) + '&year=' + (year || ''), {
                    headers: { 'User-Agent': UA }
                })
                .then(function(r) { return r.ok ? r.json() : null; })
                .then(function(data) {
                    if (data && data.data && data.data[0] && data.data[0].iframe_url) {
                        var url = data.data[0].iframe_url;
                        cache.set(key, url);
                        return url;
                    }
                    return null;
                })
                .catch(function() { return null; });
            }
        },
        {
            name: 'Collaps',
            search: function(title) {
                var key = 'collaps_' + title;
                var cached = cache.get(key);
                if (cached) return Promise.resolve(cached);

                return fetch('https://collaps.cc/search?q=' + encodeURIComponent(title))
                .then(function(r) { return r.text(); })
                .then(function(html) {
                    var match = html.match(/href="\/embed\/(\w+)"/);
                    if (match) {
                        var url = 'https://collaps.cc/embed/' + match[1];
                        cache.set(key, url);
                        return url;
                    }
                    return null;
                })
                .catch(function() { return null; });
            }
        }
    ];

    // === Регистрация плагина ===
    function registerPlugin() {
        function USAFE() {
            this.name = 'usafe';
            this.type = 'online';

            this.render = function(card, item) {
                var title = item.title_ru || item.title;
                var year = item.year || '';

                SOURCES.forEach(function(src) {
                    src.search(title, year).then(function(url) {
                        if (url) {
                            card.addSource({
                                title: src.name + ' • HD',
                                quality: '1080p',
                                onplay: function() {
                                    Lampa.PlayerVideo.play({
                                        url: url,
                                        headers: { 'User-Agent': UA, 'Referer': 'https://google.com' }
                                    });
                                }
                            });
                        }
                    });
                });
            };
        }

        Lampa.Plugin.register(new USAFE());
    }

    // === Запуск ===
    initPlugin();
})();
