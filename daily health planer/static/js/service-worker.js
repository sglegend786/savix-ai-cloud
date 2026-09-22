// ==========================================
// DAILY LIFE MANAGER - SERVICE WORKER
// ==========================================

self.addEventListener("install", function (event) {
    console.log("Service Worker installed.");
    self.skipWaiting();
});


self.addEventListener("activate", function (event) {
    console.log("Service Worker activated.");
    event.waitUntil(self.clients.claim());
});


self.addEventListener("push", function (event) {

    let data = {
        title: "Daily Life Manager",
        body: "You have a task reminder.",
        icon: "/static/images/icon.png"
    };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(

        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.icon,
            data: {
                url: "/"
            }
        })

    );
});


self.addEventListener("notificationclick", function (event) {

    event.notification.close();

    event.waitUntil(

        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(function (clientList) {

            for (const client of clientList) {

                if ("focus" in client) {
                    return client.focus();
                }

            }

            if (clients.openWindow) {
                return clients.openWindow("/");
            }

        })

    );
});