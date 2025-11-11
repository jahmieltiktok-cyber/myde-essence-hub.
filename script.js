document.addEventListener("DOMContentLoaded", () => {
    try {
        // --- Firebase Configuration ---
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        // --- Check for Placeholder Credentials ---
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            throw new Error("Firebase configuration is not set. Please update script.js with your credentials.");
        }

        // --- Initialize Firebase ---
        const app = firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const auth = firebase.auth();

        // --- Global Variables ---
        const productList = document.getElementById("productList");
        const loginPage = document.getElementById("loginPage");
        const adminPanel = document.getElementById("adminPanel");
        let currentUser = null;

        // --- Authentication ---
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                loginPage.style.display = "none";
                adminPanel.style.display = "block";
            } else {
                currentUser = null;
                loginPage.style.display = "block";
                adminPanel.style.display = "none";
            }
            getProducts();
        });

        document.getElementById("loginBtn").onclick = async () => {
            const email = document.getElementById("adminUser").value;
            const password = document.getElementById("adminPass").value;
            if (!email || !password) {
                alert("Please enter an email and password.");
                return;
            }
            try {
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                console.error("Login Error: ", error);
                alert("Login failed: " + error.message);
            }
        };

        document.getElementById("logoutBtn").onclick = async () => {
            try {
                await auth.signOut();
            } catch (error) {
                console.error("Logout Error: ", error);
                alert("Logout failed. Check console.");
            }
        };

        // --- Product Functions ---
        async function getProducts() {
            productList.innerHTML = "<p>Loading products...</p>";
            try {
                const snapshot = await db.collection("products").get();
                productList.innerHTML = ""; // Clear loading message

                if (snapshot.empty) {
                    productList.innerHTML = "<p>No products available right now.</p>";
                    return;
                }

                snapshot.forEach(doc => {
                    const p = doc.data();
                    const id = doc.id;
                    const isAdmin = (currentUser != null);

                    const card = document.createElement("div");
                    card.className = "card";
                    card.innerHTML = `
                        <img src="${p.img}" alt="${p.name}">
                        <h3>${p.name}</h3>
                        <p>${p.price}</p>
                        ${isAdmin ? `
                        <button onclick="deleteProduct('${id}')">Delete</button>
                        <button onclick="editProduct('${id}', '${p.name}', '${p.price}', '${p.img}')">Edit</button>` : ""}
                    `;
                    productList.appendChild(card);
                });
            } catch (error) {
                console.error("Error fetching products: ", error);
                productList.innerHTML = "<p>Could not load products. Please ensure Firebase is configured correctly.</p>";
            }
        }

        document.getElementById("addProductBtn").onclick = async () => {
            const name = document.getElementById("newName").value;
            const price = document.getElementById("newPrice").value;
            const img = document.getElementById("newImg").value;

            if (name && price && img) {
                try {
                    await db.collection("products").add({ name, price, img });
                    getProducts();
                    alert("Product added!");
                    document.getElementById("newName").value = "";
                    document.getElementById("newPrice").value = "";
                    document.getElementById("newImg").value = "";
                } catch (error) {
                    console.error("Error adding product: ", error);
                    alert("Error: Only logged-in admins can add products.");
                }
            } else {
                alert("Please fill all fields.");
            }
        };

        async function deleteProduct(id) {
            if (confirm("Are you sure you want to delete this product?")) {
                try {
                    await db.collection("products").doc(id).delete();
                    getProducts();
                    alert("Product deleted.");
                } catch (error) {
                    console.error("Error deleting product: ", error);
                    alert("Error: Only logged-in admins can delete products.");
                }
            }
        }

        // --- Modal & Loading ---
        const modal = document.getElementById("editModal");
        const closeBtn = document.querySelector(".close-btn");

        function showLoader() {
            const loader = document.createElement("div");
            loader.className = "loading-overlay";
            loader.innerHTML = '<div class="loader"></div>';
            document.body.appendChild(loader);
        }

        function hideLoader() {
            const loader = document.querySelector(".loading-overlay");
            if (loader) {
                loader.remove();
            }
        }

        function openEditModal(id, name, price, img) {
            document.getElementById("editId").value = id;
            document.getElementById("editName").value = name;
            document.getElementById("editPrice").value = price;
            document.getElementById("editImg").value = img;
            modal.style.display = "block";
        }

        closeBtn.onclick = () => {
            modal.style.display = "none";
        };

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };

        document.getElementById("updateProductBtn").onclick = async () => {
            const id = document.getElementById("editId").value;
            const name = document.getElementById("editName").value;
            const price = document.getElementById("editPrice").value;
            const img = document.getElementById("editImg").value;

            if (id && name && price && img) {
                showLoader();
                try {
                    await db.collection("products").doc(id).update({ name, price, img });
                    modal.style.display = "none";
                    getProducts();
                } catch (error) {
                    console.error("Error updating product: ", error);
                    alert("Failed to update product.");
                } finally {
                    hideLoader();
                }
            }
        };

        // Modified editProduct to call the modal
        function editProduct(id, name, price, img) {
            openEditModal(id, name, price, img);
        }

        // --- Splash Screen & Theme Toggle ---
        const splash = document.getElementById("splash");
        window.addEventListener("load", () => {
            setTimeout(() => { splash.style.opacity = 0; }, 500);
            setTimeout(() => { splash.style.display = "none"; }, 1500);
        });

        const themeToggle = document.getElementById("themeToggle");
        const currentTheme = localStorage.getItem("theme");

        if (currentTheme === "dark") {
            document.body.classList.add("dark");
            themeToggle.innerText = "☀️";
        }

        themeToggle.onclick = () => {
            document.body.classList.toggle("dark");
            let theme = "light";
            if (document.body.classList.contains("dark")) {
                theme = "dark";
                themeToggle.innerText = "☀️";
            } else {
                themeToggle.innerText = "🌙";
            }
            localStorage.setItem("theme", theme);
        };

        // --- Enhanced Chatbot ---
        const chatInput = document.getElementById("chatInput");
        const chatResponse = document.getElementById("chatResponse");

        chatInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                sendMessage();
            }
        });

        async function sendMessage() {
            const query = chatInput.value.trim();
            if (!query) return;

            // Display user message
            const userMessageElem = document.createElement("div");
            userMessageElem.className = "chat-bubble user";
            userMessageElem.innerText = query;
            chatResponse.appendChild(userMessageElem);
            chatInput.value = "";
            chatResponse.scrollTop = chatResponse.scrollHeight;

            // Display typing indicator
            const typingIndicator = document.createElement("div");
            typingIndicator.className = "chat-bubble bot typing";
            typingIndicator.innerHTML = "<span></span><span></span><span></span>";
            chatResponse.appendChild(typingIndicator);
            chatResponse.scrollTop = chatResponse.scrollHeight;

            try {
                const lowerCaseQuery = query.toLowerCase();
                let botReply = "";

                if (lowerCaseQuery.includes("hello") || lowerCaseQuery.includes("hi")) {
                    botReply = "Hello! Ask me about our perfumes, and I'll do my best to find what you're looking for.";
                } else if (lowerCaseQuery.includes("how are you")) {
                    botReply = "I'm just a bot, but I'm ready to help you discover some amazing scents!";
                } else if (lowerCaseQuery.includes("help")) {
                    botReply = "You can ask me to find a perfume by its name. For example, try asking for 'Ocean Breeze'.";
                } else {
                    const snapshot = await db.collection("products").get();
                    let results = [];
                    snapshot.forEach(doc => {
                        if (doc.data().name.toLowerCase().includes(lowerCaseQuery)) {
                            results.push(doc.data());
                        }
                    });

                    if (results.length > 0) {
                        botReply = `I found ${results.length} matching product(s):<br>`;
                        results.forEach(p => {
                            botReply += `<div class="product-result"><strong>${p.name}</strong> - ${p.price}</div>`;
                        });
                    } else {
                        botReply = `I'm sorry, I couldn't find any products matching "${query}". Please try a different name.`;
                    }
                }

                // Simulate thinking and show response
                setTimeout(() => {
                    typingIndicator.remove();
                    const botMessageElem = document.createElement("div");
                    botMessageElem.className = "chat-bubble bot";
                    botMessageElem.innerHTML = botReply;
                    chatResponse.appendChild(botMessageElem);
                    chatResponse.scrollTop = chatResponse.scrollHeight;
                }, 1500);

            } catch (error) {
                console.error("Chatbot error: ", error);
                typingIndicator.remove();
                const errorMessageElem = document.createElement("div");
                errorMessageElem.className = "chat-bubble bot";
                errorMessageElem.innerText = "Oops! Something went wrong. Please try again in a moment.";
                chatResponse.appendChild(errorMessageElem);
                chatResponse.scrollTop = chatResponse.scrollHeight;
            }
        }
    } catch (error) {
        console.error("Initialization Error: ", error.message);
        const productList = document.getElementById("productList");
        if (productList) {
            productList.innerHTML = `<p style="color: red; font-weight: bold;">${error.message}</p>`;
        }
    }
});
