document.addEventListener('DOMContentLoaded', function() {
    // ====================== DOM Elements ======================
    const authContainer = document.getElementById('auth-container');
    const mainContainer = document.getElementById('main-container');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const passwordInput = document.getElementById('password');
    const authError = document.getElementById('auth-error');
    const createBtn = document.getElementById('create-btn');
    const newServerBtn = document.getElementById('new-server-btn');
    const loadingContainer = document.getElementById('loading-container');
    const resultContainer = document.getElementById('result-container');
    const serverForm = document.querySelector('.server-form');
    const planBtns = document.querySelectorAll('.plan-btn');
    const usernameInput = document.getElementById('username');
    
    // Server info elements
    const serverIdEl = document.getElementById('server-id');
    const serverUsernameEl = document.getElementById('server-username');
    const serverPasswordEl = document.getElementById('server-password');
    const serverRamEl = document.getElementById('server-ram');
    const serverCpuEl = document.getElementById('server-cpu');
    const serverDiskEl = document.getElementById('server-disk');
    const serverWebEl = document.getElementById('server-web');
    const serverCreatedEl = document.getElementById('server-created');
    const serverNotesEl = document.querySelector('.notes ul');
    
    // ====================== Configuration ======================
    const correctPassword = "fukushima"; // CHANGE THIS PASSWORD!
    let selectedPlan = null;
    
    // ====================== Initial Check ======================
    if (localStorage.getItem('isAuthenticated') === 'true') {
        authContainer.style.display = 'none';
        mainContainer.style.display = 'block';
    }
    
    // ====================== Event Listeners ======================
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    createBtn.addEventListener('click', handleCreateServer);
    newServerBtn.addEventListener('click', resetForm);
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && selectedPlan) handleCreateServer();
    });

    // Plan selection
    planBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            planBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedPlan = this.dataset.plan;
            
            // Animate button selection
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Show copied feedback
                const originalIcon = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                this.style.color = '#28a745';
                
                setTimeout(() => {
                    this.innerHTML = originalIcon;
                    this.style.color = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        });
    });
    
    // ====================== Main Functions ======================
    function handleLogin() {
        const password = passwordInput.value.trim();
        
        if (password === '') {
            showAuthError('Password tidak boleh kosong');
            return;
        }
        
        if (password === correctPassword) {
            // Success animation
            loginBtn.innerHTML = '<i class="fas fa-check"></i>';
            loginBtn.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                localStorage.setItem('isAuthenticated', 'true');
                authContainer.style.display = 'none';
                mainContainer.style.display = 'block';
                
                // Reset login button
                loginBtn.innerHTML = 'Masuk';
                loginBtn.style.backgroundColor = '';
            }, 800);
        } else {
            showAuthError('Password salah');
            // Shake animation
            authContainer.style.animation = 'shake 0.5s';
            setTimeout(() => {
                authContainer.style.animation = '';
            }, 500);
        }
    }
    
    function handleLogout() {
        // Fade out animation
        mainContainer.style.opacity = '0';
        mainContainer.style.transition = 'opacity 0.5s';
        
        setTimeout(() => {
            localStorage.removeItem('isAuthenticated');
            authContainer.style.display = 'flex';
            mainContainer.style.display = 'none';
            mainContainer.style.opacity = '1';
            
            // Reset form
            passwordInput.value = '';
            authError.textContent = '';
            resetForm();
        }, 500);
    }
    
    async function handleCreateServer() {
        const username = usernameInput.value.trim();
        
        if (!username) {
            showError('Username tidak boleh kosong');
            return;
        }
        
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
            showError('Username hanya boleh huruf dan angka');
            return;
        }
        
        if (!selectedPlan) {
            showError('Pilih plan terlebih dahulu');
            return;
        }
        
        // Show loading with animation
        serverForm.style.display = 'none';
        loadingContainer.style.display = 'block';
        loadingContainer.style.opacity = '0';
        
        // Animate loading container
        setTimeout(() => {
            loadingContainer.style.opacity = '1';
        }, 50);
        
        try {
            // Call Fukushima API
            const response = await fetch('/api/create-server', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    plan: selectedPlan
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Gagal membuat server');
            }
            
            // Simulate loading delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Display server info
            displayServerInfo(data);
            
        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
            resetForm();
        }
    }
    
    function displayServerInfo(serverData) {
        // Hide loading, show result
        loadingContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        resultContainer.style.opacity = '0';
        
        // Fill server information
        serverIdEl.textContent = serverData.id || 'N/A';
        serverUsernameEl.textContent = serverData.username || 'N/A';
        serverPasswordEl.textContent = serverData.password || 'N/A';
        serverRamEl.textContent = serverData.ram || 'N/A';
        serverCpuEl.textContent = serverData.cpu || 'N/A';
        serverDiskEl.textContent = serverData.disk || 'N/A';
        serverWebEl.textContent = serverData.web || 'N/A';
        serverCreatedEl.textContent = serverData.created || new Date().toLocaleString();
        
        // Add notes if available
        if (serverData.notes && Array.isArray(serverData.notes)) {
            serverNotesEl.innerHTML = '';
            serverData.notes.forEach(note => {
                const li = document.createElement('li');
                li.textContent = note;
                serverNotesEl.appendChild(li);
            });
        }
        
        // Animate result appearance
        setTimeout(() => {
            resultContainer.style.opacity = '1';
            
            // Add confetti effect on success
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }, 50);
    }
    
    function resetForm() {
        // Animate hide result
        if (resultContainer.style.display === 'block') {
            resultContainer.style.opacity = '0';
            setTimeout(() => {
                resultContainer.style.display = 'none';
            }, 300);
        }
        
        // Reset form values
        usernameInput.value = '';
        planBtns.forEach(btn => btn.classList.remove('active'));
        selectedPlan = null;
        
        // Show form with animation
        serverForm.style.display = 'block';
        serverForm.style.opacity = '0';
        setTimeout(() => {
            serverForm.style.opacity = '1';
        }, 50);
    }
    
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        errorEl.style.position = 'fixed';
        errorEl.style.top = '20px';
        errorEl.style.left = '50%';
        errorEl.style.transform = 'translateX(-50%)';
        errorEl.style.backgroundColor = '#dc3545';
        errorEl.style.color = 'white';
        errorEl.style.padding = '10px 20px';
        errorEl.style.borderRadius = '5px';
        errorEl.style.zIndex = '1000';
        errorEl.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        
        document.body.appendChild(errorEl);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            errorEl.style.opacity = '0';
            errorEl.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(errorEl);
            }, 500);
        }, 3000);
    }
    
    function showAuthError(message) {
        authError.textContent = message;
        authError.style.opacity = '1';
        
        // Auto fade out after 3 seconds
        setTimeout(() => {
            authError.style.opacity = '0';
            authError.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                authError.textContent = '';
                authError.style.opacity = '1';
            }, 500);
        }, 3000);
    }
    
    // ====================== Animation Helpers ======================
    // Add shake animation to CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .plan-btn {
            transition: transform 0.2s, background-color 0.3s;
        }
        
        .error-message {
            animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from { transform: translate(-50%, -30px); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // ====================== Confetti Setup ======================
    // Load confetti library dynamically
    if (typeof confetti !== 'function') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
        script.onload = () => console.log('Confetti loaded!');
        document.head.appendChild(script);
    }
});