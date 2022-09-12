/*
    Platform: Linux
    Requires: lsof installed (sudo apt install lsof)
    Notes   : Process should be owned by the runner of the script.
*/

const { exec } = require("child_process");

let findProcessIdByPort = function(port){
    return new Promise(async function(resolve, reject){
        let cmd = `lsof -b -t -i tcp:${port}`;
        // console.log("cmd: ", cmd);
        
        // console.log(`Looking for process using port: ${port}`);
        exec(cmd, async (error, stdout, stderr) => {
            if(stdout.length != 0){
                let pid = stdout.trim();
                let resp = await killProcessById(pid);
                resolve({ 
                    text: `Process ${pid} was using port ${port} and has been removed.`,  
                    removed: 1,
                    error : resp.error,
                    stdout: resp.stdout,
                    stderr: resp.stderr,
                } );
            }
            else{
                resolve({
                    text    : `No process found using port ${port}.`, 
                    removed : 0,
                    error   : "",
                    stdout  : "",
                    stderr  : "",
                }
                ) ;
            }
        });
    });
};

let killProcessById = function(pid){
    return new Promise(async function(resolve, reject){
        let cmd = `kill -9 ${pid}`;
        // console.log("cmd: ", cmd);
        
        // console.log(`Removing process: ${pid}`);
        exec(cmd, (error, stdout, stderr) => {
            if (error)  { console.log(`error: ${error}`); reject(); return; }
            if (stderr) { console.log(`stderr: ${stderr}`); reject(); return; }
            // console.log(`SUCCESS: ${stdout}`);
            resolve({
                error : error,
                stdout: stdout,
                stderr: stderr,
            });
        });
    });
}

let func = async function(port){
    return new Promise(async function(resolve,reject){
        try{
            if(port){
                // Make sure the port can be interpreted as a number. 
                if(isNaN(port)){
                    reject({
                        success: false, 
                        text   : "You must supply a port NUMBER.",
                        removed: 0,
                        error  : "",
                        stdout : "",
                        stderr : "",
                    });
                }
                else{
                    // Remove the process by port. 
                    let resp;
                    try{ resp = await findProcessIdByPort(port); } catch(e){ resp = e; }
                    resolve({
                        success: true, 
                        text   : resp.text,
                        removed: resp.removed,
                        error  : resp.error,
                        stdout : resp.stdout,
                        stderr : resp.stderr,
                    });
                }
            }
            else{
                reject({
                    success:false, 
                    text: "You must supply a port NUMBER.",
                    removed: 0,
                    error: "",
                    stdout: "",
                    stderr: "",
                });
            }
        }
        catch(e){
            console.log("CATCH");
            resolve(e);
        }
    });
};

module.exports = {
    run: func,
};