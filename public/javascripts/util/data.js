define(['jquery', 'lib/socket.io/socket.io.min'], function($){
    var socket = io.connect(document.domain, {
        reconnect: true,
        transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'] //websocket is not working with joyent hosting
    });
    
    var storage = sessionStorage || localStorage;

    return {
        socket: socket,
        storage: storage
    };
});