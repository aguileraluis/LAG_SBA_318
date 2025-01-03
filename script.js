let storedToken = localStorage.getItem("jwtToken");
let storedUsername = localStorage.getItem("username");

const usernameElement = document.getElementById("username");

if (usernameElement) {
  usernameElement.textContent = storedUsername;
}

document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = window.location.origin;
  fetchPosts(baseUrl);

  if (storedToken) {
    const storedRole = localStorage.getItem("userRole");
    if (storedRole == "admin") {
      showAdminFeatures();
    } else if (storedRole == "reader") {
      showReaderFeatures();
    }
  }

  const form = document.getElementById("new-post-form");
  if (form) {
    form.addEventListener("submit", (event) => createPost(event, baseUrl));
  }

  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => loginUser(event, baseUrl));
  }

  const registerForm = document.getElementById("register-form");

  if (registerForm) {
    registerForm.addEventListener("submit", (event) =>
      registerUser(event, baseUrl)
    );
  }

  const newCommentForm = document.getElementById("new-comment-form");

  if (newCommentForm) {
    newCommentForm.addEventListener("submit", (event) =>
      createComment(event, baseUrl)
    );
  }
});

const postDetailContainer = document.getElementById("post-detail-container");

window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("post");
  if (postId) {
    showPostDetail(postId);
    location.setItem("postId", postId);
  }
});

async function fetchPosts(baseUrl) {
  const res = await fetch(`${baseUrl}/posts`);
  const data = await res.json();
  const postsList = document.getElementById("posts-list");
  const isAdmin = localStorage.getItem("userRole") === "admin";

  if (postsList) {
    postsList.innerHTML = data
      .map((post, index) => {
        const deleteButtonStyle = isAdmin ? "" : "display: none";
        const updateButtonStyle = isAdmin ? "" : "display: none";

        let escapedId = escapeSpecialChars(post._id);
        let escapedTitle = escapeSpecialChars(post.title);
        let escapedContent = escapeSpecialChars(post.content);
        let escapedImageUrl = escapeSpecialChars(post.imageUrl);

        return `
      <div id="${post._id}" class="post">
          <img src="${post.imageUrl}" alt="Image" />
          <div class="post-title">
            ${
              index === 0
                ? `<h1><a href="/post/${post._id}">${post.title}</a></h1>`
                : `<h3><a href="/post/${post._id}">${post.title}</a></h3>`
            }
          </div>
          ${
            index === 0 || index == 6
              ? `<span><p>${post.author}</p><p>${post.timestamp}</p></span>`
              : ""
          }
          <div id="admin-buttons">
            <button class="btn" style="${deleteButtonStyle}" onclick="deletePost('${
          post._id
        }', '${baseUrl}')">Delete</button>
            <button class="btn" id="updateBtn" style="${updateButtonStyle}" onclick="showUpdateForm('${escapedId}','${escapedTitle}','${escapedContent}', '${escapedImageUrl}')">Update</button>
          </div>
          ${index === 0 ? "<hr>" : ""}
          ${index === 0 ? "<h2>All Articles</h2>" : ""}
        </div>
      `;
      })
      .join("");
  }

  fetchComments(baseUrl);
}

async function fetchComments(baseUrl) {
  const res = await fetch(`${baseUrl}/comments`);
  const data = await res.json();
  const commentsList = document.getElementById("comments-list");
  let storedUsername = localStorage.getItem("username");
  let url = window.location.pathname.split("/").pop();

  if (commentsList) {
    commentsList.innerHTML = data
      .map((comment, index) => {
        let isOwner = comment.author == storedUsername;
        let isPost = url == comment.postId;
        let escapedMessage = escapeSpecialChars(comment.comment);
        let escapedId = escapeSpecialChars(comment._id);

        const deleteButtonStyle = isOwner ? "" : "display: none";
        const updateButtonStyle = isOwner ? "" : "display: none";

        if (isPost) {
          return `

            <div id="${comment._id}" class="comment">
                 
                <div class="comment-title">

                  ${
                    index
                      ? `<p>${comment.comment}</p>
              <div id="update-div"></div>
                      `
                      : `<p>${comment.comment}</p>
              <div id="update-div"></div>

                      <span><p>${comment.author}</p><p>${comment.timestamp}</p></span>
                      `
                  }
                </div>
                <div id="admin-buttons">
        <div id="update-div"></div>

                  <button class="btn" style="${deleteButtonStyle}" onclick="deleteComment('${
            comment._id
          }', '${baseUrl}')">Delete</button>
                  <button class="btn" style="${updateButtonStyle}" onclick="showUpdateCommentForm('${escapedId}', '${escapedMessage}')">Update</button>
                  
                  </div>

              </div>
              `;
        }
      })
      .join("");
  }
}

function escapeSpecialChars(str) {
  str = str.toString();
  return str
    .replace(/\\/g, "\\\\") 
    .replace(/"/g, '\\"') 
    .replace(/'/g, "\\'") 
    .replace(/\(/g, "\\(") 
    .replace(/\)/g, "\\)") 
    .replace(/,/g, "\\,"); 
}

async function createPost(event, baseUrl) {
  event.preventDefault();
  const titleInput = document.getElementById("title");
  const contentInput = document.getElementById("content");
  const imageUrlInput = document.getElementById("image-url");

  const title = titleInput.value;
  const content = contentInput.value;
  const imageUrl = imageUrlInput.value;

  if (!title || !content || !imageUrl) {
    alert("Please fill in all fields 1.");
    return;
  }

  const newPost = {
    title,
    content,
    imageUrl,
    author: storedUsername,
    timestamp: new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  const headers = new Headers({
    "Content-Type": "application/json",
    Authorization: `Bearer ${storedToken}`,
  });
  const requestOptions = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(newPost),
  };

  try {
    const response = await fetch(`${baseUrl}/posts`, requestOptions);
    if (!response.ok) {
      const storedRole = localStorage.getItem("userRole");
      console.error(`Error creating the post: HTTP Status ${response.status}`);
    } else {
      titleInput.value = "";
      contentInput.value = "";
      imageUrlInput.value = "";
      alert("Create post successful!");
    }
  } catch (error) {
    console.error("An errro occured during the fetch:", error);
    alert("Create post failed.");
  }
  fetchPosts(baseUrl);
}

async function createComment(event, baseUrl) {
  event.preventDefault();
  const isReader = localStorage.getItem("userRole") === "reader";
  const isAdmin = localStorage.getItem("userRole") == "admin";

  if (isReader || isAdmin) {
    console.log('yes'); 
  } else {
    console.log('no') 
  }
  const commentInput = document.getElementById("comment");
  const url = window.location;
  let postId = url.pathname.split("/").pop();

  const comment = commentInput.value;

  if (!comment) {
    alert("Please type your comment.");
    return;
  }

  const newComment = {
    author: storedUsername,
    comment: comment,
    postId: postId,
    timestamp: new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      mongth: "long",
      day: "numeric",
    }),
  };

  const headers = new Headers({
    "Content-Type": "application/json",
    Authorization: `Bearer ${storedToken}`,
  });

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(newComment),
  };

  try {
    const response = await fetch(`${baseUrl}/comments`, requestOptions);
    if (!response.ok) {
      const storedRole = localStorage.getItem("userRole");
      console.error(`Error creating the post: HTTP Status ${response.status}`);
    } else {
      comment.value = "";
      alert("Comment added successfully!");
    }
  } catch (error) {
    console.error("An error occured during the fetch: ", error);
    alert("Add comment failed.");
  }

  fetchComments(baseUrl);
}

async function deletePost(postId, baseUrl) {
  const deleteUrl = `${baseUrl}/posts/${postId}`;
  try {
    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      alert("Delete post successful!");
      fetchPosts(baseUrl);
    } else {
      alert("Delete post failed.");
    }
  } catch (error) {
    console.error(`Error while deleting post: ${error}`);
    alert("Delete post failed.");
  }
}

async function deleteComment(postId, baseUrl) {
  console.log(baseUrl); 
  console.log(postId); 
  const deleteUrl = `${baseUrl}/comments/${postId}`;
  try {
    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      alert("Delete comment successful!");
      fetchComments(baseUrl);
    } else {
      alert("Delete comment failed.");
    }
  } catch (error) {
    console.error(`Error while deleting post: ${error}`);
    alert("Delete post failed.");
  }
}

function showUpdateForm(postId, title, content, imageUrl) {
  const updateForm = `
    <form id="update-form">
        <input type="text" id="update-title" value="${title}" />
        <textarea id="update-message">${content}</textarea>
        <input type="text" id="update-image" value="${imageUrl}" />
        <button type="submit">Update post</button>
    </form>
    `;

  const postElement = document.getElementById(postId);

  const length = postElement.children.length;
  console.log(length);

  if (length === 3 || length === 6) {
    postElement.innerHTML += updateForm;

    const form = document.getElementById("update-form");
    if (form) {
      form.addEventListener("submit", (event) => updatePost(event, postId));
    }
  }
}

function showUpdateCommentForm(postId, comment) {
  console.log(postId);
  const updateForm = `
    <form id="update-form">
        <textarea id="update-message">${comment}</textarea>
        <button type="submit">Update post</button>
    </form>
    `;

  const postElement = document.getElementById("update-div");

  postElement.innerHTML += updateForm;

  const form = document.getElementById("update-form");
  if (form) {
    form.addEventListener("submit", (event) => updateComment(event, postId));
  }
}

async function updatePost(event, postId) {
  event.preventDefault();
  const title = document.getElementById("update-title").value;
  const content = document.getElementById("update-message").value;
  const baseUrl = window.location.origin;

  if (!title || !content) {
    alert("Please fill in all fields 2.");
    return;
  }

  const updatedPost = {
    title,
    content,
  };

  try {
    const response = await fetch(`${baseUrl}/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(updatedPost),
    });

    if (response.ok) {
      alert("Update post successful!");
      fetchPosts(baseUrl);
    } else {
      alert("Update post failed.");
    }
  } catch (error) {
    console.error("An error occured during the fetch", error);
    alert("Update post failed.");
  }
}

async function updateComment(event, postId) {
  event.preventDefault();
  const message = document.getElementById("update-message").value;
  const updateDiv = document.getElementById("update-form");
  const baseUrl = window.location.origin;

  if (!message) {
    alert("Please fill in all fields 2.");
    return;
  }

  const updateComment = {
    message,
  };

  try {
    const response = await fetch(`${baseUrl}/comments/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(updateComment),
    });

    if (response.ok) {
      setTimeout(() => {
        alert("Update Comment successful!");
      }, 1000);
      updateDiv.innerHTML = "";
      fetchPosts(baseUrl);
    } else {
      setTimeout(() => {
        alert("Update Comment failed.");
      }, 1000);
    }
  } catch (error) {
    console.error("An error occured during the fetch", error);
    alert("Update comment failed.");
  }
}

async function registerUser(event, baseUrl) {
  event.preventDefault();
  const usernameInput = document.getElementById("register-username");
  const passwordInput = document.getElementById("register-password");
  const roleInput = document.getElementById("register-role");

  const username = usernameInput.value;
  const password = passwordInput.value;
  const role = roleInput.value;

  if (!username || !password || !role) {
    alert("Please fill in all fields 3.");
    return;
  }

  const newUser = {
    username,
    password,
    role,
  };

  const res = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newUser),
  });

  const data = await res.json();

  if (data.success) {
    alert("Registered successful!");
    usernameInput.value = "";
    passwordInput.value = "";
    roleInput.value = "";
  } else {
    alert("Registration failed.");
  }
}

async function loginUser(event, baseUrl) {
  event.preventDefault();
  const usernameInput = document.getElementById("login-username");
  const passwordInput = document.getElementById("login-password");
  const username = usernameInput.value;
  const password = passwordInput.value;

  if (!username || !password) {
    alert("Please fill in all fields 4.");
    return;
  }

  const user = {
    username,
    password,
  };

  const res = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  const data = await res.json();

  if (data.success) {
    let comments = document.getElementById('new-comment-div'); 
    if (comments) {
      comments.style.display = 'flex'; 

    }
    localStorage.setItem("jwtToken", data.token);
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("username", username);

    linksContainer.classList.toggle("active");
    hamburger.classList.toggle("active");

    usernameInput.value = "";
    passwordInput.value = "";

    location.reload();

    if (data.role === "admin") {
      showAdminFeatures();
    } else if (data.role == "reader") {
      showReaderFeatures();
    }
  } else {
    alert("Login failed.");
  }
}

function showAdminFeatures() {
  const newPostDiv = document.getElementById("new-post-div");
  const newCommentDiv = document.getElementById("new-comment-div"); 
  const signIn = document.getElementById("signInMessage"); 

  if (newCommentDiv) {
    newCommentDiv.style.display = "flex"; 
  }

    if (newPostDiv) {
      newPostDiv.style.display = "flex";
    }

    if (signIn) {
      signIn.style.display = "none"; 
      
      if (newPostDiv) {
        newPostDiv.style.display = "flex"; 

      }
    }

  const allBtns = document.querySelectorAll(".btn");
  allBtns.forEach((btn) => {
    if (btn) {
      btn.style.display = "block";
    }
  });
}

function showReaderFeatures() {
  const newCommentDiv = document.getElementById("new-comment-div"); 
  const signIn = document.getElementById("signInMessage"); 
  if (newPostDiv || newCommentDiv) {
    newPostDiv.style.display = "flex";
    if(signIn) {
      signIn.style.display = "none"; 

    }
  }
  const allBtns = document.querySelectorAll(".btn");

  allBtns.forEach((btn) => {
    if (btn) {
      btn.style.display = "block";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = window.location.origin;
  const registerDiv = document.getElementById("register-div");
  const loginDiv = document.getElementById("login-div");
  const logoutDiv = document.getElementById("logout-div");
  const logoutButton = document.getElementById("logout-button");

  if (storedToken && registerDiv && loginDiv) {
    registerDiv.style.display = "none";
    loginDiv.style.display = "none";
    logoutDiv.style.display = "flex";
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      location.reload();
    });
  } else {
    if (registerDiv) {
      registerDiv.style.display = "flex";
    }
    if (loginDiv) {
      loginDiv.style.display = "flex";
    }
    if (logoutDiv) {
      logoutDiv.style.display = "none";
    }
  }
});
