// ==UserScript==
// @name         USAFE
// @description  Alloha + Collaps для LG webOS + Vimu
// @version      3.3
// @author       Ты
// ==/UserScript==

(function () {
    'use strict';

    var init = function() {
        if (!window.Lampa || !Lampa.Plugin) {
            setTimeout(init, 100);
            return;
        }
        register();
    };

    var BALANCERS = ['https://lampa-balancer.deno.dev', 'https://lampa-proxy.vercel.app'];
    var getBalancer = function() { return BALANCERS[Math.floor(Math.random() * BALANCERS.length)]; };

    function register() {
        function USAFE() {
            this.name = 'usafe';
            this.type = 'online';

            this.render = function(card, item) {
                return new Promise(function(resolve) {
                    var title = item.title_ru || item.title;
                    var year = item.year || '';

                    // Alloha (iframe)
                    fetch(getBalancer() + '/alloha?title=' + encodeURIComponent(title) + '&year=' + (year || ''), {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    })
                    .then(r => r.ok ? r.json() : null)
                    .then(d => {
                        if (d && d.data && d.data[0] && d.data[0].iframe_url) {
                            card.addSource({
                                title: 'Alloha • HD',
                                quality: '1080p',
                                onplay: function() {
                                    Lampa.PlayerVideo.play({
                                        url: d.data[0].iframe_url,
                                        type: 'iframe'
                                    });
                                }
                            });
                        }
                    });

                    // Collaps (iframe)
                    fetch('https://collaps.cc/search?q=' + encodeURIComponent(title))
                    .then(r => r.text())
                    .then(h => {
                        var m = h.match(/href="\/embed\/(\w+)"/);
                        if (m) {
                            card.addSource({
                                title: 'Collaps • HD',
                                quality: '1080p',
                                onplay: function() {
                                    Lampa.PlayerVideo.play({
                                        url: 'https://collaps.cc/embed/' + m[1],
                                        type: 'iframe'
                                    });
                                }
                            });
                        }
                    });

                    setTimeout(resolve, 100);
                });
            };
        }

        Lampa.Plugin.register(new USAFE());
    }

    init();
})();
