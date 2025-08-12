async function getFirebaseConfig() {
    return {
        apiKey: 'AIzaSyBHZoQ7LTwLSz7ErSn4AI-YrUFaB4eUKgc',
        authDomain: 'cheap-tow-australia.firebaseapp.com',
        databaseURL: 'https://cheap-tow-australia-default-rtdb.firebaseio.com',
        projectId: 'cheap-tow-australia',
        storageBucket: 'cheap-tow-australia.firebasestorage.app',
        messagingSenderId: '495374294718',
        appId: '1:495374294718:web:c4c88b813eb1e5bc29c8ef',
        measurementId: null
    };
}

async function initializeFirebase() {
    const firebaseConfig = await getFirebaseConfig();

    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
        console.error("Firebase configuration is missing or invalid.");
        return;
    }

    firebase.initializeApp(firebaseConfig);
}

async function authenticateFirebase() {
    try {

        await storeJsonFile();

        const firebaseToken = $.cookie('firebase_token');

        if (firebaseToken) {
            await firebase.auth().signInWithCustomToken(firebaseToken);
        } else {
            const response = await fetch('/get-firebase-token', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });
            if (!response.ok) throw new Error("Failed to fetch Firebase token");

            const data = await response.json();

            if (!data.firebase_token) throw new Error("Firebase token is missing");

            $.cookie('firebase_token', data.firebase_token, { expires: 1/24 });

            await firebase.auth().signInWithCustomToken(data.firebase_token);
        }

    } catch (error) {
        console.error("Authentication Error:", error.message);
    }
}

async function storeJsonFile() {
    return new Promise((resolve, reject) => {
        firebase.firestore().collection('settings').doc("notification_setting").get().then(async function (snapshots) {
            var data = snapshots.data();
            if (data != undefined && data.serviceJson != '' && data.serviceJson != null) {
                try {
                    await $.ajax({
                        type: 'POST',
                        data: {
                            serviceJson: btoa(data.serviceJson),
                        },
                        url: "/store-firebase-service",
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        },
                        success: function (response) {
                            resolve(response);
                        },
                        error: function (error) {
                            reject(error);
                        }
                    });
                } catch (error) {
                    reject(error);
                }
            } else {
                resolve();
            }
        }).catch((error) => {
            reject(error);
        });
    });
}

initializeFirebase().then(authenticateFirebase);
