function showPage(pageId) {
      document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
      });
      document.getElementById(pageId).classList.add('active');
    }
    const firebaseConfig = {
      apiKey: "AIzaSyBpYjMmOiSSoItRuS9guy2c5KSH9y5DBmc",
  authDomain: "network-my.firebaseapp.com",
  projectId: "network-my",
  storageBucket: "network-my.firebasestorage.app",
  messagingSenderId: "300961970076",
  appId: "1:300961970076:web:08142c2382a3fb8e38fa59"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    const authBox = document.getElementById("auth");
    const appBox = document.getElementById("app");
    const email = document.getElementById("email");
    const pass = document.getElementById("pass");
    const username = document.getElementById("username");
    const userEmail = document.getElementById("user-email");
    const channelList = document.getElementById("channel-list");
    const myChannelBtn = document.getElementById("my-channel-btn");
    const channelPage = document.getElementById("channel-page");
    const postForm = document.getElementById("post-form");
    const postList = document.getElementById("post-list");
    const deleteChannelBtn = document.getElementById("delete-channel-btn");

    let currentUserId = null;
    let myChannelId = null;
    let currentChannel = null;
    let currentChannelOwner = null;

    function register() {
      auth.createUserWithEmailAndPassword(email.value, pass.value)
        .then(cred => {
          db.collection("users").doc(cred.user.uid).set({
            email: email.value,
            username: username.value
          });
        }).catch(e => alert(e.message));
    }

    function login() {
      auth.signInWithEmailAndPassword(email.value, pass.value)
        .catch(e => alert(e.message));
    }
async function anonymousLogin() {
    const { user } = await auth.signInAnonymously();
    await db.collection('users').doc(user.uid).set({ username: 'Guest_' + user.uid.slice(-4), subscribers: 0 });
    init();
  }

    function logout() {
      auth.signOut();
    }

    auth.onAuthStateChanged(async user => {
      if (user) {
        currentUserId = user.uid;
        authBox.style.display = "none";
        appBox.style.display = "block";
        userEmail.textContent = user.email;
        
        const channelSnap = await db.collection("channels").where("owner", "==", currentUserId).get();
        if (!channelSnap.empty) {
          myChannelId = channelSnap.docs[0].id;
          myChannelBtn.style.display = "block";
}
loadChannels();
    loadSubscribedChannels();
    loadMyChannels();
      } else {
        authBox.style.display = "block";
        appBox.style.display = "none";
        channelPage.style.display = "none";
        myChannelId = null;
      }
    });
function loadMyChannels() {
  myChannelsList.innerHTML = "";
  db.collection("channels").where("owner", "==", currentUserId).get().then(snap => {
    snap.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "channel";
      div.onclick = () => enterChannel(doc.id);
      div.innerHTML = `<img src="${data.avatar || 'https://via.placeholder.com/40'}"><div>${data.name}</div>`;
      myChannelsList.appendChild(div);
    });
  });
}
function loadSubscribedChannels() {
  subscribedChannelsList.innerHTML = "";
  db.collection("channels").where("subscribers", "array-contains", currentUserId).get().then(snap => {
    snap.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "channel";
      div.onclick = () => enterChannel(doc.id);
      div.innerHTML = `<img src="${data.avatar || 'https://via.placeholder.com/40'}"><div>${data.name}</div>`;
      subscribedChannelsList.appendChild(div);
    });
  });
}

    function createChannelPrompt() {
      const name = prompt("Название канала:");
      const avatar = prompt("Ссылка на аватарку (необязательно):") || "";
      if (name) {
        db.collection("channels").add({
          name,
          avatar,
          owner: currentUserId,
          subscribers: []
        }).then(doc => {
          myChannelId = doc.id;
          myChannelBtn.style.display = "block";
          loadChannels();
        });
      }
    }

    function loadChannels() {
      channelList.innerHTML = "";
      db.collection("channels").get().then(snap => {
        snap.forEach(doc => {
          const data = doc.data();
          const div = document.createElement("div");
          div.className = "channel";
          div.onclick = () => enterChannel(doc.id);
          div.innerHTML = `<img src="${data.avatar || 'https://via.placeholder.com/40'}"><div>${data.name}</div>`;
          channelList.appendChild(div);
        });
      });
    }
function searchChannels() {
      const query = document.getElementById("search").value.toLowerCase();
      channelList.innerHTML = "";
      db.collection("channels").get().then(snap => {
        snap.forEach(doc => {
          const data = doc.data();
          if (data.name.toLowerCase().includes(query)) {
            const div = document.createElement("div");
            div.className = "channel";
            div.onclick = () => enterChannel(doc.id);
            div.innerHTML = `<img src="${data.avatar || 'https://via.placeholder.com/40'}"><div>${data.name}</div>`;
            channelList.appendChild(div);
          }
        });
      });
    }

    function enterChannel(id) {
      appBox.style.display = "none";
      channelPage.style.display = "block";
      currentChannel = id;

      db.collection("channels").doc(id).get().then(doc => {
        const data = doc.data();
        document.getElementById("channel-avatar").src = data.avatar || 'https://via.placeholder.com/100';
        document.getElementById("channel-title").textContent = data.name;
        document.getElementById("sub-count").textContent = data.subscribers.length;
        currentChannelOwner = data.owner;

        if (currentUserId === data.owner) {
          postForm.style.display = "block";
          deleteChannelBtn.style.display = "block";
          document.getElementById("sub-btn").style.display = "none";
        } else {
          postForm.style.display = "none";
          deleteChannelBtn.style.display = "none";
          document.getElementById("sub-btn").style.display = "block";
        }

        loadPosts();
      });
    }



    function subscribe() {
      db.collection("channels").doc(currentChannel).update({
        subscribers: firebase.firestore.FieldValue.arrayUnion(currentUserId)
      }).then(() => alert("Вы подписались!"));
    }

    function sendPost() {
      const text = document.getElementById("post-text").value;
      const img = document.getElementById("post-img").value;
      const video = document.getElementById("post-video").value;

      const videoEmbed = video && video.includes("drive.google.com") ? 
        `<iframe src="https://drive.google.com/file/d/${video.split("/d/")[1].split("/")[0]}/preview" frameborder="0" allowfullscreen></iframe>` 
        : '';

      if (text || img || video) {
        db.collection("channels").doc(currentChannel).collection("posts").add({
          text, img, videoEmbed, created: Date.now()
        }).then(() => {
          document.getElementById("post-text").value = "";
          document.getElementById("post-img").value = "";
          document.getElementById("post-video").value = "";
          loadPosts();
        });
      }
    }

    function loadPosts() {
      postList.innerHTML = "";
      db.collection("channels").doc(currentChannel).collection("posts").orderBy("created", "desc").get().then(snap => {
        snap.forEach(doc => {
          const data = doc.data();
          const div = document.createElement("div");
          div.className = "post";
          div.innerHTML = `<div>${data.text}</div>${data.img ? `<img src="${data.img}">` : ""}${data.videoEmbed || ""}`;
          if (currentUserId === currentChannelOwner) {
            const del = document.createElement("button");
            del.className = "delete-btn";
            del.textContent = "Удалить пост";
            del.onclick = () => {
              db.collection("channels").doc(currentChannel).collection("posts").doc(doc.id).delete().then(loadPosts);
            };
            div.appendChild(del);
          }
          postList.appendChild(div);
        });
      });
    }

    function deleteChannel() {
      if (confirm("Удалить канал и все посты?")) {
        db.collection("channels").doc(currentChannel).collection("posts").get().then(snap => {
          const batch = db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      batch.commit().then(() => {
        db.collection("channels").doc(currentChannel).delete().then(() => {
          alert("Канал удалён");
          loadChannels();
          channelPage.style.display = "none";
          appBox.style.display = "block";
        });
      });
    });
  }
}

function back() {
  channelPage.style.display = "none";
  appBox.style.display = "block";
}
