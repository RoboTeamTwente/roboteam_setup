process.stdout.write('\033c');
l = console.log

// ==== Require all the needed libraries ==== //
const colors = require('colors');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const ask = require('readline-sync').question;
const commandExistsSync = require('command-exists').sync

// ==== Logging functions
const lInfo    = (...args) => console.log("[Info   ]".blue,   ...args);
const lError   = (...args) => console.log("[Error  ]".red,    ...args);
const lWarn    = (...args) => console.log("[Warning]".yellow, ...args);
const lSuccess = (...args) => console.log("[Success]".green,  ...args);
const lInquire = (...args) => console.log("[Inquire]".cyan,   ...args);
const len = (str, len=20, filler=" ") => { while(str.length < len) str += filler; return str.slice(0, len)}

// ==== Some useful constants
const rtt = "RoboTeam Twente".red
const dependencies = "libsdl2-2.0-0 libsdl2-dev libqt4-dev qt5-default libboost-all-dev ros-kinetic-uuid-msgs ros-kinetic-joy protobuf-c-compiler protobuf-compiler python-subprocess32 python-protobuf python3 python3-pip";
const settings = getDefaultSettings();
const user = (() => {let _user = process.env.USER; _user[0] = _user[0].toUpperCase(); return _user;})();
const isRoot = require('is-root')();
const confirmYes = () => ask("$ Answer: ").toLowerCase().includes('y');
const confirmNo  = () => ask("$ Answer: ").toLowerCase().includes('n');
const confirmYesDefault = () => {
	let answer = ask("$ Answer: ");
	return answer == "" || answer.toLowerCase().includes('y');
}
const confirmNoDefault = () => {
	let answer = ask("$ Answer: ");
	return answer == "" || answer.toLowerCase().includes('n');
}


// ============================================================================================== //
// ============================================================================================== //

printLogoColoured();
l();l();

if(isRoot){
	lError(`Don't run this script with sudo. It messes with the environmental variables, and ruins everything forever!`);
	process.exit(1);
}

lInfo(`Welcome ${user}, to this ${rtt} installation script. Before we continue, please make sure that you (and Emiel) have a cup of ${"coffee".yellow}.`);
lInfo(`(Other types of beverages are allowed but not recommended nor supported by this ${rtt} installation script)`);

lInfo(`During the next 37 seconds to 41 years, This script will : 
 * ask if you want to be spiritually guided by soothing music while running this installation script
 * check if you have internet access, which is needed for installing dependencies, cloning repositories etc
 * check if you have installed the required software (e.g ROS, git)
 * ask in which directory you want to install all the ${rtt} software, named ${"RTT_ROOT".yellow}
 * create the ${"RTT_ROOT".yellow} directory
 * create the ${"rtt_bashrc".yellow} file, which will source your workspace, give you useful functions, etc
 * ensure that the ${"rtt_bashrc".yellow} file is properly sourced by the ${".bashrc".yellow} file
 * clone all of the required ${rtt} repositories into ${"RTT_ROOT/workspace/src".yellow}
 * copy useful scripts and other files into ${"RTT_ROOT".yellow}
 * install all the dependencies needed for running the ${rtt} software and other software
 * install grSim
 * install ssl-vision
 * install ssl-refbox
 * Initialize your workspace by running ${"catkin_make".yellow} in ${"RTT_ROOT/workspace".yellow}
 * convince you to drink even more coffee
`)

lInquire('Are you ready to continue? (y/N)');
// Make sure that people are not just continually pressing enter during this installation
while(confirmNoDefault()){
	lInquire("How about now? (y/N)");
}


Promise.resolve()
.then(inquireSoothingMusic)
.then(checkInternetAccess)	// Check if we have internet
.then(ensureSoftware)		// Check if required software is installed
.then(inquireRTT_ROOT)		// Check for RTT_ROOT
.then(ensureRootDir)			// Make sure the folder exists
.then(ensureRttbashrc)		// Write the rtt_bashrc file
.then(ensureBashrc)			// add rtt_bashrc to ~/.bashrc
.then(ensureGitRepos)
.then(ensureFiles)
.then(ensureDependencies)
.then(() => ensureSSLrepo('grSim'))
.then(() => ensureSSLrepo('ssl-vision'))
.then(() => ensureSSLrepo('ssl-refbox', false))
.then(buildSSLRefbox)
.then(runCatkinMakeInWorkspace)

.then(() => {
	lError(`Please run manually ${"sudo apt remove modemmanager".yellow}`);
	l();
	lSuccess(`Congratulations! You have officially reached the end of this ${rtt} installation script. Pour yourself another cup or two, you deserved it!`);
	lInfo(`When you've done that, close this terminal, open a new one, and type ${"rtt".yellow}. This will lead you to your new everything.`);
	l();l();
	printLogoColoured();
})
.catch(err => {
	l();
	lError(`An error occured while running the ${rtt} installation script! sad.`);
	lError(err);
	process.exit(-1);
});

// ==== The install script has finished ==== //

// ==== Inquire soothing music ==== //
function inquireSoothingMusic(){
	return new Promise((resolve, reject) => {
		l('\n');

		lInquire(`Would you like some soothing music while running this ${rtt} installation script? (y/N)`);
		if(confirmYes()){
			lInfo(`Initializing soothing music...`);
			execSync("xdg-open https://www.youtube.com/watch?v=GIJRcnjZEe0 1>/dev/null 2>/dev/null");
		}
		return resolve();
	})
}

// ==== Get the directory RTT_ROOT for all of the RoboTeam Twente stuff ==== //
function inquireRTT_ROOT(){
	return new Promise((resolve, reject) => {
		l(); 

		const RTT_ROOT_ENV = process.env.RTT_ROOT;
		lInfo(`Alright, time to choose an RTT_ROOT directory to put all of the ${rtt} stuff in. We're talking about code, simulators, scripts, etc. Everything software-team related.`);
		lInfo(`The default RTT_ROOT directory is ${settings.RTT_ROOT.yellow}`);
		
		let changeRTT_ROOT = newRoot => {
			settings.setRTT_ROOT(newRoot);    // set the new RTT_ROOT in the settings object
			settings.settingsChanged = true;	// set the settings to changed
		};

		// Ask for the root directory that the user wants to use
		let askForRTT_ROOT = () => {
			lWarn(`Don't use ${"~".yellow} in your path! it doesn't work in Nodejs, since ${"~".yellow} is a bash thing`);
			lInquire(`Which directory would like to use? (leave empty for ${settings.RTT_ROOT.yellow}) :`)
			let directory = ask("$ Answer: ");
			// If the answer is not empty
			if(directory != ""){
				changeRTT_ROOT(directory);
			}
			lSuccess(`Alright, we'll use ${settings.RTT_ROOT.yellow} as RTT_ROOT`);
			return resolve();
		};
		
		// If RTT_ROOT has already been set before
		if(RTT_ROOT_ENV){
			// Ask if user wants to keep using RTT_ROOT as RTT_ROOT
			lInquire(`It seems that you have already chosen the directory ${RTT_ROOT_ENV.yellow}. Would you like to use this directory? (Y/n))`);;
			// User wants to keep using RTT_ROOT
			if(confirmYesDefault()){
				lSuccess(`Alright, we'll keep using ${RTT_ROOT_ENV.yellow} as RTT_ROOT`);
				changeRTT_ROOT(RTT_ROOT_ENV);
				return resolve();
			}
			// User wants to change RTT_ROOT
			return askForRTT_ROOT();
		}
		// RTT_ROOT has not been set before
		else{
			return askForRTT_ROOT();
		}
	})
}

// ==== Ensure that the user has internet access to install dependencies / pull repos / etc
function checkInternetAccess(){
	return new Promise((resolve, reject) => {
		l();
		
		lInfo(`I'm checking if we have internet access by looking up github.com ...`);
		
		require('dns').lookup('github.com',function(err) {
	        if (err && err.code == "ENOTFOUND") {
	        	lError(`It seems like we don't have internet access! We need that to install dependencies, pull from git, yadayada...`);
	            return reject(`[checkInternetAccess] It seems that you do not have internet access (or worse, github.com is down)! (${err.code.yellow})`)
	        } else 
	        if (err){
	        	lError(`It seems like we don't have internet access! We need that to install dependencies, pull from git, yadayada...`);
	            return reject(`[checkInternetAccess] It seems that you do not have internet access! (${err.code.yellow})`)
	        } else{
				lSuccess(`It seems like we do!`);
				return resolve();
	        }
	    })
		
	});
}

// ==== Ensure that ROS is installed
function ensureSoftware(){
	l();
	
	let url;

	// Check if ROS is installed
	lInfo(`I'm checking if you've installed ${"ROS".yellow}...`)
	url = "http://wiki.ros.org/ROS/Tutorials/InstallingandConfiguringROSEnvironment";
	if(!process.env.ROS_ROOT){
		lError(`Hold up! ${"ROS".yellow} doesn't seem to be installed, because the environmental variable ${"ROS_ROOT".yellow} is not set!`);
		lError(`I will try to open up the website for you, which will tell you how to install ${"ROS".yellow}`);
		lError(url.yellow);
		execSync(`xdg-open ${url} 1>/dev/null 2>/dev/null`);
		return Promise.reject(`[ensureSoftware] ${"ROS".yellow} does not seem to be installed! please visit ${url.yellow}`);
	}else{
		lSuccess(`ROS seems to be installed at ${process.env.ROS_ROOT.yellow}!`);
	}

	// Check if Git is installed
	lInfo(`I'm checking if you've installed ${"Git".yellow}...`)
	url = "https://git-scm.com/download/linux";
	if(!commandExistsSync('git')){
		lError(`Hold up! ${"Git".yellow} doesn't seem to be installed!`);
		lError(`I will try to open up the website for you, which will tell you how to install ${"Git".yellow}`);
		lError(url.yellow);
		execSync(`xdg-open ${url} 1>/dev/null 2>/dev/null`);
		return Promise.reject(`[ensureSoftware] ${"GIT".yellow} does not seem to be installed! please visit ${url.yellow}`);
	}else{
		lSuccess(`Git seems to be installed at ${execSync('which git', {encoding : 'UTF8'}).trim().yellow}!`);
	}

	return Promise.resolve();
}

// ==== Ensure that the RTT_ROOT directory exists
function ensureRootDir(){
	return new Promise((resolve, reject) => {
		l();

		const dir = settings.RTT_ROOT;
		lInfo(`I'm ensuring that the RTT_ROOT directory ${dir.yellow} exists...`);
	
		fs.ensureDir(dir, (err, dirCreated) => {
			if(err){
				let errMsg = `Unknown error while ensuring RTT_ROOT ${dir.yellow} (${err.code.yellow})`;

				if(err.code == "EACCES"){
					errMsg = `Could not create RTT_ROOT ${dir.yellow}! Permission denied (${err.code.yellow})`;
				}
				
				return reject(`[ensureRootDir()] ${errMsg}`);
			}

			if(dirCreated){
				lSuccess(`Directory ${dir.yellow} succesfully created!`);
			}else{
				lSuccess(`Directory ${dir.yellow} already exists.`)
			}
			return resolve();
		})
	})
}

function runCatkinMakeInWorkspace(){
	return new Promise((resolve, reject) => {
		l();

		lInfo(`I'm checking if directory ${settings.RTT_REPOS.yellow} exists...`);
		if(!fs.existsSync(settings.RTT_REPOS)){
			lError(`Required directory ${settings.RTT_REPOS.yellow} does not exist!`)
			return reject(`[runCatkinMakeInWorkspace] Required directory ${settings.RTT_REPOS.yellow} does not exist!`);
		}

		lInfo(`For information on why I'm running ${"catkin_make".yellow}, please visit ${"http://wiki.ros.org/ROS/Tutorials/InstallingandConfiguringROSEnvironment".yellow}`);
		lInfo(`I'm running ${"catkin_make".yellow} in ${settings.RTT_WORKSPACE.yellow}. This might take a while...`);
		// let cmd = `gnome-terminal -x bash -c "cd ${settings.RTT_WORKSPACE} && catkin_make"`;
		let cmd = `cd ${settings.RTT_WORKSPACE} && catkin_make`;
		exec(cmd, {encoding : 'utf8'}, (err, output) => {
			if(err){
				lWarn("The command failed, but that is expected (for now)");
			}
			lSuccess(`${"catkin_make".yellow} was ran in ${settings.RTT_WORKSPACE.yellow}`);
			return resolve();
		})
	});
}

// ==== Ensure that the file RTT_BASHRC exists
function ensureRttbashrc(){
	return new Promise((resolve, reject) => {
		l();

		let writeRttbashrc = () => {
			let rtt_bashrc = require('./createRttbashrc').create(settings);
			let rtt_bashrcPath = path.join(settings.RTT_ROOT, "rtt_bashrc");
			fs.writeFile(rtt_bashrcPath, rtt_bashrc, (err, file) => {
				if(err && err.code == "EACCES"){
					return reject(`[ensureRttbashrc] Could not create file ${settings.RTT_BASHRC.yellow}! Permission denied (${err.code.yellow})`);
				}
				if(err){
					return reject(`[ensureRttbashrc] Unknown error while create file ${settings.RTT_BASHRC.yellow}! (${err.code.yellow})`);
				}

				lSuccess(`The file ${rtt_bashrcPath.yellow} has been created!`);
				return resolve();
			})
		}

		lInfo(`I'm ensuring that the file ${settings.RTT_BASHRC.yellow} exists...`);
		fs.stat(settings.RTT_BASHRC, (err, stat) => {
			if(err && err.code != "ENOENT"){
				lError(`An unknow error occured while checking for ${settings.RTT_BASHRC.yellow}...`);
				return reject(`[ensureRttbashrc] An unknown error occured while checking for ${settings.RTT_BASHRC.yellow}...`);
			}
			
			// If the rtt_bashrc file already exists			
			if(stat){
				// If the file exist, but the settings have changed, overwrite it
				if(settings.settingsChanged){
					lInfo(`The settings have changed, so I'm overwriting ${settings.RTT_BASHRC.yellow}...`);
					return writeRttbashrc();
				}
				// If the settings have not changed, ask for overwrite
				else{
					lInquire(`The file ${settings.RTT_BASHRC.yellow} exists. Would you like to overwrite it? (y/N)`);	
					if(confirmNoDefault()){
						lSuccess(`Alright, I won't overwrite the file ${settings.RTT_BASHRC.yellow}`);
						return resolve();
					}else{
						lInfo(`Alright, I'll overwrite the file ${settings.RTT_BASHRC.yellow}`);
						return writeRttbashrc();
					}
				}
			// if the rtt_bashrc file doesn't yet exist
			}else{
				lInfo(`The file ${settings.RTT_BASHRC.yellow} doesn't exist yet. I'm creating it right now...`);
				return writeRttbashrc();
			}
		})
	})	
}

// ==== Ensure that the ~/.bashrc sources the RTT_BASHRC file
function ensureBashrc(){
	return new Promise((resolve, reject) => {
		l();

		const bashrcPath = path.join(settings.HOME, ".bashrc");
		const sourceLine = `source ${settings.RTT_BASHRC}`

		lInfo(`I'm ensuring that the file ${settings.RTT_BASHRC.yellow} is sourced by the file ${bashrcPath.yellow}...`);
		// Read ~/.bashrc
		fs.readFile(bashrcPath, {encoding : "utf8"}, (err, file) => {
			if(err)
				return reject(`[ensureBashrc()] Unknown error while reading ${bashrcPath.yellow}! (${err.code.yellow})`);
			
			if(!file.includes(sourceLine)){
				lInfo(`${bashrcPath.yellow} does not include the line ${sourceLine.yellow}. Adding...`);
				fs.appendFile(bashrcPath, '\n' + sourceLine + '\n', err => {
					if(err)
						return reject(`[ensureBashrc()] Unknown error while appending to ${bashrcPath.yellow}! (${err.code.yellow})`);
					lSuccess(`Line succesfully added to ${bashrcPath.yellow}`);
					return resolve();
				})
			}else{
				lSuccess(`${bashrcPath.yellow} contains the line ${sourceLine.yellow}`);
				return resolve();
			}
		})
	})
}

// ==== Ensure that all the relevant git repos exist in RTT_ROOT/workspace/src ==== //
function ensureGitRepos(){
	return new Promise((resolve, reject) => {
		l();

		const repos = [
			{ repo : "roboteam_msgs"	, dir : settings.RTT_REPOS },
			{ repo : "roboteam_utils"	, dir : settings.RTT_REPOS },
			{ repo : "roboteam_vision"	, dir : settings.RTT_REPOS },
			{ repo : "roboteam_world"	, dir : settings.RTT_REPOS },
			{ repo : "roboteam_robothub", dir : settings.RTT_REPOS },
			{ repo : "roboteam_input"	, dir : settings.RTT_REPOS }, 
			{ repo : "roboteam_tactics"	, dir : settings.RTT_REPOS },
			{ repo : "projects_node"	, dir : settings.RTT_ROOT }
		];

		lInfo(`I'm ensuring that the repository directory ${settings.RTT_REPOS.yellow} exists...`);
		fs.ensureDir(settings.RTT_REPOS, (err, dir) => {
			if(err)
				return reject(`[ensureGitRepos] An error occured while creating ${settings.RTT_REPOS.yellow} (${err.code})`);
			if(dir) lInfo(`Directory ${settings.RTT_REPOS.yellow} created`);
			else lInfo(`Directory ${settings.RTT_REPOS.yellow} already exists`);
			// ==== Directory exists. Start pulling in repos

			// Ask if user wants to use SSH
			lInquire("Would you like to use SSH to clone the git reposities? (Y/n)");
			let useSSH = confirmYesDefault();
			if(!useSSH)
				lWarn("It is recommended to use SSH! If you're not sure how, don't hesitate to ask!");

			lWarn("Using HTTPS by default for now, since this install script cannot answer the 'rsa-fingerprint' prompt");

			lInfo(`Cloning repositories. This might take a while...`);
			// ==== Create promises for cloning all the repositories
			let promises = _.map(repos, ({ repo, dir }) => {
				return new Promise((resolve, reject) => {
					let outputDir= dir;
					let cmdSsh   = `git clone git@github.com:RoboTeamTwente/${repo}.git ${outputDir}`;
					let cmdHttps = `git clone https://github.com/RoboTeamTwente/${repo}.git ${outputDir}`;
					let cmd = useSSH ? cmdSsh : cmdHttps;
					
					if(fs.existsSync(outputDir)){
						lWarn(`Directory ${outputDir.yellow} already exists. Cloning into a non-empty directory is not possible. Skipping ${repo.yellow}`);
						return resolve();
					}

					exec(cmd, {encoding : 'utf8'}, err => {
						if(err){
							lError(`An error occured while cloning ${repo.yellow}!`);
							lError(cmd.yellow)
							lError(err.message.red)
							return reject(err);
						}else{
							lSuccess(`Repository ${repo.yellow} cloned succesfully!`);
							return resolve();
						}
					})	
				})
			})
			
			// ==== Wait for all the repositories to be cloned
			Promise.all(promises).then(output => {
				lSuccess('All repos cloned!');
				return resolve();
			}).catch(err => {
				lError(`An error occured while cloning all the repos!`);
				return reject(`[ensureGitRepos] An error occured while cloning the git repos!\n${err.message ? err.message.red : err}`);
			})
		})
	});
}

function ensureFiles(){

	return new Promise((resolve, reject) => {
		l();

		lInfo(`I'm copying all the useful files to the directory ${settings.RTT_ROOT.yellow}...`);
		const mapping = [
			[path.join(__dirname,'files','gitstatus.sh'),      path.join(settings.RTT_ROOT, 'workspace', 'gitstatus.sh')],
			[path.join(__dirname,'files','gitpull.sh'),        path.join(settings.RTT_ROOT, 'workspace', 'gitpull.sh')],
			[path.join(__dirname,'files','startSerial.sh'),    path.join(settings.RTT_ROOT, 'startSerial.sh')],
			[path.join(__dirname,'files','startGrSim.sh'),     path.join(settings.RTT_ROOT, 'startGrSim.sh')],
			[path.join(__dirname,'files','thumbsup.jpg'),      path.join(settings.RTT_ROOT, 'thumbsup.jpg')],
			[path.join(__dirname,'files','thumbsdown.jpg'),    path.join(settings.RTT_ROOT, 'thumbsdown.jpg')],
			[path.join(__dirname,'files','rosconsole.config'), path.join(settings.RTT_ROOT, 'rosconsole.config')] 
		]

		// Create promises to copy all files to the correct directory
		let promises = _.map(mapping, ([from, to]) => {
			return new Promise((resolve, reject) => {
				lInfo(`copying ${len(from, 50).yellow} to ${to.yellow}`);
				fs.copy(from, to).then(() => {

					// If file ends with .sh, add executable flag to them
					if(to.endsWith('sh')){
						lInfo(`Adding execution flag to ${to.yellow}`);
						let cmd = `chmod +x ${to}`;
						exec(cmd, {encoding : 'utf8'}, err => {
							if(err){
								lError(`Error while adding execution flag to ${to.yellow}!`);
								lError(cmd.red);
								return reject(err);
							}else{
								return resolve();
							}
						});
					}else{
						return resolve();
					}

				}).catch(err => {
					lError(`Error while copying ${from.yellow} to ${to.yellow}! (${err.code.yellow})`);
					return reject(err);
				})
			})
		})

		Promise.all(promises).then(() => {
			lSuccess("All files have been copied");
			return resolve();
		}).catch(err => {
			lError(`There was an error while copying files`);
			return reject(`[ensureFiles] There was an error copying files!\n${err.message.red}`);
		})
	});
}

function ensureDependencies(){
	return new Promise((resolve, reject) => {
		l();

		lInfo(`I'm ensuring that you have installed all the required dependencies. This might take a while...`);
		const cmd = `sudo apt update && sudo apt install -y ${dependencies}`;
		lInfo(cmd.yellow);
		exec(cmd, err => {
			if(err){
				lError(`An error occured while installing all the dependencies!`);
				return reject(`[ensureDependencies] An error occured installing all the dependencies!\n${err.message.red}`);
			}else{
				lSuccess(`All the dependencies have been installed`);
				return resolve();
			}
		})
	})
}

function ensureSSLrepo(repo, shouldBuild = true){
	return new Promise((resolve, reject) => {
		l();

		lInfo(`I'm installing ${repo.yellow} for you...`);

		const outputDir = path.join(settings.RTT_ROOT, repo);

		let build = () => {
			if(!shouldBuild){
				lSuccess(`Not building ${repo.yellow}...`);
				return resolve();
			}

			let cmd = `cd ${outputDir} && make build && cd build && cmake .. && make`;
			lInfo(`I'm building ${repo.yellow} for you. Runing command ${cmd.yellow}`);
			lInfo(`This might take a while...`);
			exec(cmd, (err, stdout, stderr) => {
				if(err){
					lError(`[ensureSSLrepo] An error occured while building ${repo.yellow}`);
					lError(err.message.red);
					lError(stderr);
					return reject(stderr);
				}

				lSuccess(`${repo.yellow} has succesfully been build in ${outputDir.yellow}! Run it using the scripts in command ${"./bin".yellow}`);
				return resolve();
			})
		}

		let clone = () => {
			const cmd = `git clone https://github.com/RoboCup-SSL/${repo}.git ${outputDir}`;
			lInfo(`Running command ${cmd.yellow}`);
			lInfo('This may take a while...');
			exec(cmd, (err, stdout, stderr) => {
				if(err){
					lError(`[ensureSSLrepo] An error occured while cloning ${repo.yellow}`);
					lError(cmd.yellow)
					lError(stderr.red);
					return reject(stderr);
				}

				lSuccess(`grSim has succesfully been cloned to ${outputDir.yellow}`);
				return build();
			})
		}

		// grsim directory already exists!
		if(fs.existsSync(outputDir)){
			lInquire(`The ${repo.yellow} directory ${outputDir.yellow} already exists. Do you want me to remove it? (y/N)`);
			if(confirmNoDefault()){
				lSuccess(`Not cloning and building ${repo.yellow}`);
				return resolve();
			}

			// Remove the grSim directory
			lInfo(`Removing directory ${outputDir.yellow}...`);
			fs.remove(outputDir, err => {
				if(err){
					l(`[ensureSSLrepo] error while removing ${outputDir.yellow} (${err.code})`);
					return reject(err);
				}
				lSuccess(`Directory removed!`);
				return clone();
				l('werwer');
			})
		}else{
			return clone();
		}		
	})
}

function buildSSLRefbox(){
	return new Promise((resolve, reject) => {
		l();

		lInfo(`I'm building ssl-refbox...`);
		let cmd = `cd ${path.join(settings.RTT_ROOT, 'ssl-refbox')} && sudo ./installDeps.sh && make`;
		lInfo(`Running command ${cmd.yellow}`);

		exec(cmd, (err, stdout, stderr) => {
			if(err){
				lError(`[buildSSLRefbox] An error occured while building ssl-refbox`);
				lError(err.message.red);
				lError(stderr);
				return reject(stderr);
			}

			lSuccess(`ssl-refbox has succesfully been build in ${path.join(settings.RTT_ROOT, 'ssl-refbox').yellow}! Run it using ${"./ssl-refbox".yellow}`);
			return resolve();
		})
	})
}


// ============================================================================================== //
// ============================================================================================== //

function printEnvironmentalVariables(){
	_.each(process.env, (val, key) => {
		l(len(key, 40, "_"), val);
	})
}

function getDefaultSettings(){
	let HOME = execSync('echo $HOME', {encoding : 'UTF8'}).trim();
	// let HOME = "/home/emiel"
	let RTT_ROOT = path.join(HOME, "roboteamtwente")

	return {
		HOME,
		RTT_ROOT,
		RTT_BASHRC : path.join(RTT_ROOT, 'rtt_bashrc'),
		RTT_WORKSPACE : path.join(RTT_ROOT, 'workspace'),
		RTT_REPOS  : path.join(RTT_ROOT, 'workspace', 'src'),
		settingsChanged : false,

		setRTT_ROOT : function(rtt_root){
			this.RTT_ROOT = rtt_root;
			lInfo(`[settings] Changing RTT_ROOT to ${this.RTT_ROOT.yellow}`);
			
			this.RTT_BASHRC = path.join(this.RTT_ROOT, 'rtt_bashrc');
			lInfo(`[settings] Changing RTT_BASHRC to ${this.RTT_BASHRC.yellow}`);
			
			this.RTT_WORKSPACE = path.join(this.RTT_ROOT, 'workspace');
			lInfo(`[settings] Changing RTT_WORKSPACE to ${this.RTT_WORKSPACE.yellow}`);

			this.RTT_REPOS = path.join(this.RTT_ROOT, 'workspace', 'src'),
			lInfo(`[settings] Changing RTT_REPOS to ${this.RTT_REPOS.yellow}`);
		}
	}
}

function printLogo(){
l(`
                                                                    _______________          _______________
                                                                   /     _____     \\________/     _____     \\
                                                                  /     /     \\                  /     \\     \\
                                                                 /     |       |                |       |     \\
                                                                 |      \\_____/                  \\_____/      |
 _________________                         ____                  \\________________            ________________/
|                 \\                       |    |                                  |          |
|      ____       |                       |    |                                  |          |
|     |    |      |    _______________    |    |__________     _______________    |          |    ________________     ________________     _________________________
|     |____|      |   /               \\   |               \\   /               \\   |          |   /                \\   |                \\   |                         \\
|     |\\      ____/   |     _____     |   |     _____     |   |     _____     |   |          |   |      ____      |   |___________     |   |      ___       ___      |
|     | \\     \\       |    |     |    |   |    |     |    |   |    |     |    |   |          |   |     |____|     |    ___________|    |   |     |   |     |   |     |
|     |  \\     \\      |    |     |    |   |    |     |    |   |    |     |    |   |          |   |      __________/   /       ____     |   |     |   |     |   |     |
|     |   \\     \\     |    |_____|    |   |    |_____|    |   |    |_____|    |   |          |   |     |__________    |      |____|    |   |     |   |     |   |     |
|     |    \\     \\    |               |   |               |   |               |   |          |   |               /    |                |   |     |   |     |   |     |
|_____|     \\_____\\   \\_______________/   |_______________/   \\_______________/   |          |   \\______________/     \\________________|   |_____|   |_____|   |_____|
                                                                                  |          |                                                   ___
                                                                                  |          |                                                  |   |
                                                                                  |          |   ___    ___    ___   __________   ___________   |   |__    __________
                                                                                  |          |  |   |  |   |  |   | /   ___    \\ |    ___    \\ |_    __|  /   ___    \\
                                                                                  |          |  |   |  |   |  |   | |  |___|   | |   |   |   |  |   |     |  |___|   |
                                                                                  |          |  |   |  |   |  |   | |   _______/ |   |   |   |  |   |     |   _______/
                                                                                  |          |  |   |__|   |__|   | |  |________ |   |   |   |  |   |___  |  |________
                                                                                  |__________|  \\_________________/ \\__________/ |___|   |___|  \\_______\\ \\__________/
`)
}

function printLogoColoured(){
l(`
                                                                    ${"_______________          _______________".red}
                                                                   ${"/     _____     \\________/     _____     \\".red}
                                                                  ${"/     /     \\                  /     \\     \\".red}
                                                                 ${"/     |       |                |       |     \\".red}
                                                                 ${"|      \\_____/                  \\_____/      |".red}
 _________________                         ____                  ${"\\________________            ________________/".red}
|                 \\                       |    |                                  ${"|          |".red}
|      ____       |                       |    |                                  ${"|          |".red}
|     |    |      |    _______________    |    |__________     _______________    ${"|          |".red}    ________________     ________________     _________________________
|     |____|      |   /               \\   |               \\   /               \\   ${"|          |".red}   /                \\   |                \\   |                         \\
|     |\\      ____/   |     _____     |   |     _____     |   |     _____     |   ${"|          |".red}   |      ____      |   |___________     |   |      ___       ___      |
|     | \\     \\       |    |     |    |   |    |     |    |   |    |     |    |   ${"|          |".red}   |     |____|     |    ___________|    |   |     |   |     |   |     |
|     |  \\     \\      |    |     |    |   |    |     |    |   |    |     |    |   ${"|          |".red}   |      __________/   /       ____     |   |     |   |     |   |     |
|     |   \\     \\     |    |_____|    |   |    |_____|    |   |    |_____|    |   ${"|          |".red}   |     |__________    |      |____|    |   |     |   |     |   |     |
|     |    \\     \\    |               |   |               |   |               |   ${"|          |".red}   |               /    |                |   |     |   |     |   |     |
|_____|     \\_____\\   \\_______________/   |_______________/   \\_______________/   ${"|          |".red}   \\______________/     \\________________|   |_____|   |_____|   |_____|
                                                                                  ${"|          |".red}                                                   ___
                                                                                  ${"|          |".red}                                                  |   |
                                                                                  ${"|          |".red}   ___    ___    ___   __________   ___________   |   |__    __________
                                                                                  ${"|          |".red}  |   |  |   |  |   | /   ___    \\ |    ___    \\ |_    __|  /   ___    \\
                                                                                  ${"|          |".red}  |   |  |   |  |   | |  |___|   | |   |   |   |  |   |     |  |___|   |
                                                                                  ${"|          |".red}  |   |  |   |  |   | |   _______/ |   |   |   |  |   |     |   _______/
                                                                                  ${"|          |".red}  |   |__|   |__|   | |  |________ |   |   |   |  |   |___  |  |________
                                                                                  ${"|__________|".red}  \\_________________/ \\__________/ |___|   |___|  \\_______\\ \\__________/
`)
}