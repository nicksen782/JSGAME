_JSG.lobby.login = {
    parent:null,
    DOM:{},
    loginData: {},

    showFormView: function(view){
        // EXAMPLE USAGE:
        // this.showFormView("logout");
        // this.showFormView("login");
        // this.showFormView("checking");

        // Reset to hidden.
        this.DOM.showLogin   .classList.add("hide");
        this.DOM.showLogout  .classList.add("hide");
        this.DOM.showChecking.classList.add("hide");
        this.DOM.mode.innerText = "";

        // Show the specified part of the login form. 
        switch(view){
            case "logout"  : { this.DOM.showLogout  .classList.remove("hide"); this.DOM.mode.innerText = "Logout";      break; }
            case "login"   : { this.DOM.showLogin   .classList.remove("hide"); this.DOM.mode.innerText = "Login";       break; }
            case "checking": { this.DOM.showChecking.classList.remove("hide"); this.DOM.mode.innerText = "Login check"; break; }
            default: { break; }
        };
    },
    afterLogin: async function(loginObj){
        return new Promise(async (resolve,reject)=>{
            // console.log("loginObj:", loginObj);
            if(loginObj.success == true){
                this.loginData = loginObj.data.session;

                // DEBUG: This test is here while testing to see if it ever triggers.
                if(this.loginData.loadedAppKey != _JSG.loadedAppKey){
                    alert("loadedAppKey mismatch:", `${this.loginData.loadedAppKey} VS ${_JSG.loadedAppKey}`);
                }

                // Show the correct part of the login form.
                this.showFormView("logout");

                // Change tab view.
                // this.parent.nav.showOneView("profile");
                // this.parent.nav.showOneView("lobby");
                // this.parent.nav.showOneView("room");
                // this.parent.nav.showOneView("dm");
                // this.parent.nav.showOneView("settings");
                // this.parent.nav.showOneView("debug");

                // Populate with some of the returned data.
                _JSG.DOM["header_user"].innerText = this.loginData.username;
                this.DOM.showLogout_username.innerText = this.loginData.username;
                this.DOM.showLogout_name    .innerText = this.loginData.name;

                // Start WebSockets.
                _JSG.net.ws.ws_utilities.initWss();

                resolve();
            }
            else{
                console.log("FALSE", loginObj.resultType, loginObj.data);
                this.loginData = {};

                // Show the correct part of the login form.
                this.showFormView("login");

                // Show an error?
                let errors = [
                    "ERROR_UNKNOWN_USER",
                    "ERROR_LOGIN_MISSING_VALUES",
                    "ERROR_SESSION_GENERATION",
                    "ERROR_LOGIN_NO_MATCH",
                    "ERROR_ACCOUNT_DISABLED",
                ];
                if(errors.indexOf(loginObj.resultType) != -1){
                    alert(
                        `LOGIN ERROR: ${loginObj.data}\n\n` +
                        `(${loginObj.resultType})`
                    );
                }

                resolve();
            }
        });
    },
    login     : async function(){
        return new Promise(async (resolve,reject)=>{
            let loginResp = await _JSG.net.http.send("login", { 
                type:"json", 
                method:"POST", 
                body:{
                    username    : this.DOM.username.value,
                    passwordHash: sha256(this.DOM.password.value),
                    loadedAppKey: _JSG.loadedAppKey,
                } 
            }, 5000);

            await this.afterLogin(loginResp);

            resolve();
        });
    },
    loginCheck: async function(){
        return new Promise(async (resolve,reject)=>{
            // Show the correct part of the login form.
            this.showFormView("checking");

            // Check for an active login.
            let loginCheckResp = await _JSG.net.http.send("loginCheck", { type:"json", method:"POST", body:{ loadedAppKey: _JSG.loadedAppKey } }, 5000);
            await this.afterLogin(loginCheckResp);

            resolve();
        });
    },
    logout    : async function(){
        return new Promise(async (resolve,reject)=>{
            let logoutResp = await _JSG.net.http.send("logout", { type:"json", method:"POST" }, 5000);
            if(logoutResp.success == true){
                // Show the correct part of the login form.
                this.showFormView("login");

                // Reset displayed values.
                _JSG.DOM["header_user"].innerText = "";
                this.DOM.showLogout_username.innerText = "";
                this.DOM.showLogout_name    .innerText = "";

                // Close the ws connection.
                _JSG.net.ws.ws_utilities.wsCloseAll();
                
                resolve();
            }
            else{
                // Show the correct part of the login form.
                this.showFormView("logout");

                // Close the ws connection.
                _JSG.net.ws.ws_utilities.wsCloseAll();

                resolve();
            }
        });
    },

    _ws: {
    },
    init: async function(configObj){
        return new Promise(async (resolve,reject)=>{
            // Save the DOM strings. 
            this.DOM = configObj.DOM;
            
            // Parse the DOM strings into elements. 
            this.parent.parent.shared.parseObjectStringDOM(this.DOM, true);

            // Add event listeners. 
            this.DOM.login.addEventListener ("click", async ()=>{ await this.login(); }, false);
            this.DOM.logout.addEventListener("click", async ()=>{ await this.logout(); }, false);

            // Config Websockets modes.
            //

            resolve();
        });
    },
};