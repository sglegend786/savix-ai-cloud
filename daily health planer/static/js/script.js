// ===============================
// NOTIFICATION CONTROLS
// ===============================

const enableNotificationsBtn =
    document.getElementById("enableNotificationsBtn");

const disableNotificationsBtn =
    document.getElementById("disableNotificationsBtn");

const notificationStatus =
    document.getElementById("notificationStatus");


function updateNotificationButtons() {

    if (!("Notification" in window)) {

        notificationStatus.innerText =
            "❌ Your browser does not support notifications.";

        enableNotificationsBtn.style.display = "none";
        disableNotificationsBtn.style.display = "none";

        return;
    }

    if (Notification.permission === "granted") {

        enableNotificationsBtn.style.display = "none";
        disableNotificationsBtn.style.display = "inline-block";

        notificationStatus.innerText =
            "✅ Notifications are enabled.";

    } else {

        enableNotificationsBtn.style.display = "inline-block";
        disableNotificationsBtn.style.display = "none";

        if (Notification.permission === "denied") {

            notificationStatus.innerText =
                "❌ Notifications are blocked. Please allow them from browser settings.";

        } else {

            notificationStatus.innerText =
                "Notifications are currently disabled.";

        }
    }
}


// ENABLE NOTIFICATIONS

if (enableNotificationsBtn) {

    enableNotificationsBtn.addEventListener("click", async function () {

        if (!("Notification" in window)) {

            notificationStatus.innerText =
                "❌ Your browser does not support notifications.";

            return;
        }

        const permission =
            await Notification.requestPermission();

        if (permission === "granted") {

    notificationStatus.innerText =
        "✅ Notifications are enabled.";

    updateNotificationButtons();

    if ("serviceWorker" in navigator) {

        const registration =
            await navigator.serviceWorker.ready;

        const subscription =
            await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: null
            });

        await fetch("/save-subscription", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(subscription)
        });

    }

    new Notification("Daily Life Manager", {
        body: "Notifications are now enabled."
    });
}
        else {

            updateNotificationButtons();
        }
    });
}


// DISABLE NOTIFICATIONS

if (disableNotificationsBtn) {

    disableNotificationsBtn.addEventListener("click", function () {

        notificationStatus.innerText =
            "🔕 Notifications disabled for this app.";

        enableNotificationsBtn.style.display = "inline-block";
        disableNotificationsBtn.style.display = "none";
    });
}


// CHECK CURRENT STATUS

updateNotificationButtons();

// ==========================================
// REGISTER SERVICE WORKER
// ==========================================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", function () {

        navigator.serviceWorker
            .register("/static/js/service-worker.js")
            .then(function (registration) {

                console.log(
                    "Service Worker registered successfully:",
                    registration.scope
                );

            })
            .catch(function (error) {

                console.error(
                    "Service Worker registration failed:",
                    error
                );

            });

    });

}