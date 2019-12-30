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
const semver = require('semver');


// ==== Logging functions
/* Buzy sleep function to somewhat reduce the rate at which messages come through. NOTE considered bad practice! */
function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration);
}
function log(...args){
	sleepFor(300)
	console.log(...args)
}
const lInfo    = (...args) => log("[Info   ]".blue,   ...args);
const lError   = (...args) => log("[Error  ]".red,    ...args);
const lWarn    = (...args) => log("[Warning]".yellow, ...args);
const lSuccess = (...args) => log("[Success]".green,  ...args);
const lInquire = (...args) => log("[Inquire]".cyan,   ...args);
const len = (str, len=20, filler=" ") => { while(str.length < len) str += filler; return str.slice(0, len)}


// ==== Inquiry functions
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


// ==== Some useful constants
const rtt = "RoboTeam Twente".red
let dependencies = "";

/* CMake 3.10   */ dependencies += " cmake"
/* SSL-Vision   */ dependencies += " cmake g++ libeigen3-dev freeglut3-dev qt5-default libopencv-dev"
/* SSL-Refbox 	*/ dependencies += " cmake g++ git libgtkmm-2.4-dev"
/* grSim 		*/ dependencies += " build-essential cmake qt5-default libqt5opengl5-dev libgl1-mesa-dev libglu1-mesa-dev libode-dev"
/* Protobuf 	*/ dependencies += " autoconf automake libtool curl make g++ unzip"
/* ZMQ 			*/ dependencies += " libzmq3-dev libzmqpp-dev"
/* Armadillo    */ dependencies += " libarmadillo-dev"
/* RTT 			*/ dependencies += " libboost-dev libgtest-dev"

const settings = getDefaultSettings();
const user = (() => {let _user = process.env.USER; _user[0] = _user[0].toUpperCase(); return _user;})();
const isRoot = require('is-root')();
const makeShellCommand = cmd => `gnome-terminal --disable-factory -e '/bin/bash -c -i "${cmd.replace(/'/g, "\\'").replace(/"/g, '\\"')}"'`;


// ============================================================================================== //
// ============================================================================================== //
if(process.stdout.columns < 170)
	printLogoSmall();
else
	printLogoColoured();
l();l();

if(isRoot){
	lError(`Don't run this script with sudo. It messes with the environmental variables, and ruins everything forever!`);
	process.exit(1);
}

lInfo(`Welcome ${user}, to this ${rtt} installation script. Before we continue, please make sure that you (and Emiel) have a cup of ${"coffee".yellow}.`);
lInfo(`(Other types of beverages are allowed but not recommended nor supported by this ${rtt} installation script)`);
sleepFor(2000)

lInfo(`During the next 37 seconds to 41 years, This script will : 
 * ask if you want to be spiritually guided by soothing music while running this installation script
 * check if you have internet access, which is needed for installing dependencies, cloning repositories etc
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
// while(confirmNoDefault()){
// 	lInquire("How about now? (y/N)");
// }

Promise.resolve()
.then(checkInternetAccess)	// Check if we have internet
.then(ensureDependencies)
.then(installProtobuf)
.then(ensureGit)			
.then(inquireRTT_ROOT)		// Check for RTT_ROOT
.then(ensureRootDir)		// Make sure the folder exists
// .then(ensureRttbashrc)		// Write the rtt_bashrc file
// .then(ensureBashrc)			// add rtt_bashrc to ~/.bashrc
// .then(ensureFiles)
.then(ensureRoboTeamSuite)

.then(installPylon)
.then(() => ensureRepo('RoboTeamTwente/grSim', 'grSim'))
// .then(() => ensureRepo('RoboCup-SSL/grSim', 'grSim'))
.then(() => ensureRepo('RoboCup-SSL/ssl-vision', 'ssl-vision'))
.then(() => ensureRepo('RoboCup-SSL/ssl-refbox', 'ssl-refbox'))

.then(buildSSLVision)
.then(buildGrSimVarTypes)
.then(buildGrSim)
.then(buildSSLRefbox)
.then(removeModemManager)
.then(addUserToDialoutGroup)

.then(() => {
	l();
	lSuccess(`Congratulations! You have officially reached the end of this ${rtt} installation script. Pour yourself another cup or two, you deserved it!`);
	lInfo(`When you've done that, close this terminal, open a new one, and type ${"rtt".yellow}. This will lead you to your new everything.`);
	l();l();
	if(process.stdout.columns < 170)
		printLogoSmall();
	else
		printLogoColoured();
})
.catch(err => {
	l();
	lError(`An error occured while running the ${rtt} installation script! sad.`);
	lError(err);
	process.exit(-1);
});


return 0
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

// ==== Ensure that Git is installed
function ensureGit(){
	l();
	
	// Check if Git is installed
	lInfo(`I'm checking if you've installed ${"Git".yellow}...`)
	let url = "https://git-scm.com/download/linux";
	if(!commandExistsSync('git')){
		lError(`Hold up! ${"Git".yellow} doesn't seem to be installed!`);
		lError(`I will try to open up the website for you, which will tell you how to install ${"Git".yellow}`);
		lError(url.yellow);
		execSync(`xdg-open ${url} 1>/dev/null 2>/dev/null`);
		return Promise.reject(`[ensureGit] ${"GIT".yellow} does not seem to be installed! please visit ${url.yellow}`);
	}else{
		lSuccess(`Git seems to be installed at ${execSync('which git', {encoding : 'UTF8'}).trim().yellow}!`);
		return Promise.resolve();
	}
}

// ==== Get the directory RTT_ROOT for all of the RoboTeam Twente stuff ==== //
function inquireRTT_ROOT(){
	return new Promise((resolve, reject) => {
		l(); 

		const RTT_ROOT_ENV = process.env.RTT_ROOT;
		lInfo(`Alright, time to choose an ${"RTT_ROOT".yellow} directory to put all of the ${rtt} stuff in. We're talking about code, simulators, scripts, etc. Everything software-team related.`);
		lInfo(`The default ${"RTT_ROOT".yellow} directory is ${settings.RTT_ROOT.yellow}`);
		
		let changeRTT_ROOT = newRoot => {
			settings.setRTT_ROOT(newRoot);    	// set the new RTT_ROOT in the settings object
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

// ==== Ensure that the file RTT_BASHRC exists
function ensureRttbashrc(){
	return new Promise((resolve, reject) => {
		l();

		// === Write the rtt_bashrc file to RTT_ROOT === //
		let writeRttbashrc = () => {
			let rtt_bashrc = require('./createRttbashrc').create(settings);		// Create the rtt_bashrc file
			let rtt_bashrcPath = path.join(settings.RTT_ROOT, "rtt_bashrc");	// Create the filepath, RTT_ROOT/rtt_bashrc
			fs.writeFile(rtt_bashrcPath, rtt_bashrc, (err, file) => {			// Write the file
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
		// === Check if the file rtt_bashrc already exists
		fs.stat(settings.RTT_BASHRC, (err, stat) => {
			// An error occured while trying to read the file
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
function ensureRoboTeamSuite(){
	return new Promise((resolve, reject) => {
		l();

		// Ask if user wants to use SSH
		lWarn("It is recommended to use SSH! If you're not sure how, don't hesitate to ask!");
		lInquire("Would you like to use SSH to clone the git reposities? (y/N)");
		let useSSH = confirmNoDefault();
		// === Using SSH. Making sure that github.com is in the ~/.ssh/known_hosts file, to prevent prompts from showing up
		{
			let known_hostsPath = path.join('/', 'home', user, '.ssh', 'known_hosts');
			lInfo(`I'm checking if the rsa-fingerprint for ${"github.com".yellow} is present in the file ${known_hostsPath.yellow}`);
			// Check if the known_hosts file exists
			let known_hostsExists = fs.existsSync(known_hostsPath);
			let known_hosts = !known_hostsExists ? "" : fs.readFileSync(known_hostsPath, { encoding : 'utf8' });
							
			// Check if the known_hosts file includes the rsa-fingerprint for github.com
			if(!known_hosts.includes("github.com")){
				lWarn(`${"github.com".yellow} is not present in the file. I will add it for you...`);
				let cmd = "ssh-keyscan github.com >> ~/.ssh/known_hosts";
				try{
					execSync(cmd, { encoding : 'utf8' });
				}catch(err){
					lError(`[ensureRoboTeamSuite] An error occured while adding ${"github.com".yellow} to the file ${known_hostsPath.yellow}!`);
					lError(cmd.yellow)
					lError(err.message.red)
					return reject(err.message);
				}
				lSuccess(`rsa-fingerprint for ${"github.com".yellow} has been added!`)
			}else{
				lSuccess(`rsa-fingerprint for ${"github.com".yellow} is present!`)
			}
		}

		lInfo(`Cloning roboteam_suite...`);
		// ==== Create promises for cloning all the repositories. Default to RTT_ROOT/workspace/src/. Default to master branch
		let repoPromise = new Promise((resolve, reject) => {
			let repo = "roboteam_suite"
			let outputDir= path.join(settings.RTT_REPOS, repo);
			let cmdSsh   = `git clone --recurse-submodule git@github.com:RoboTeamTwente/${repo}.git ${outputDir}`;
			let cmdHttps = `git clone --recurse-submodule https://github.com/RoboTeamTwente/${repo}.git ${outputDir}`;
			let cmd = useSSH ? cmdSsh : cmdHttps;
			
			if(fs.existsSync(outputDir)){
				lWarn(`Directory ${outputDir.yellow} already exists. Cloning into a non-empty directory is not possible. Skipping ${repo.yellow}`);
				return resolve();
			}

			exec(cmd, {encoding : 'utf8'}, err => {
				if(err){
					lError(`[ensureRoboTeamSuite] An error occured while cloning ${repo.yellow}!`);
					lError(cmd.yellow)
					lError(err.message.red)
					return reject(err);
				}else{
					lSuccess(`Repository ${repo.yellow} cloned succesfully!`);
					return resolve();
				}
			})	
		})
			
		// ==== Wait for all the repositories to be cloned
		repoPromise.then(output => {
			lSuccess('All repos cloned!');
			return resolve();
		}).catch(err => {
			lError(`An error occured while cloning all the repos!`);
			return reject(`[ensureRoboTeamSuite] An error occured while cloning the git repos!\n${err.message ? err.message.red : err}`);
		})
	});
}


function installProtobuf() {
	l()
	// Check if Protobuf is installed
	lInfo(`I'm checking if you've installed ${"Protobuf".yellow}...`)
	if(commandExistsSync('protoc')){
		// Check if the good version is installed. "protoc --version" returns something like "libprotoc 3.9.1"
		let version = execSync('protoc --version', {encoding : 'UTF8'}).split(' ')[1].trim()
		if(semver.gte(version, "3.9.1")){
			lSuccess(`Protobuf is installed at ${execSync('which protoc', {encoding : 'UTF8'}).trim().yellow}!`);
			return Promise.resolve()
		}else{
			lError(`Hold up! ${"Protobuf".yellow} its version is too low! ${version.yellow} < ${"3.9.1".yellow}`);
		}
	}else{
		lError(`Hold up! ${"Protobuf".yellow} doesn't seem to be installed!`);
	}

	return new Promise((resolve, reject) => {
		l();

		let commands = [
			`git clone https://github.com/protocolbuffers/protobuf.git`,
			`cd protobuf`,
			`git submodule update --init --recursive`,
			`./autogen.sh`,
			`./configure`,
			`make -j4`,
			`make check -j4`,
			`sudo make install`,
			`sudo ldconfig`
		];

		let hugeCommand = commands.join(" && ") + ";";
		let shellCmd = makeShellCommand(hugeCommand);

		lInfo(`I'm building Protobuf...`);
		lInfo(`Running command ${hugeCommand.yellow}`);

		exec(shellCmd, (err, stdout, stderr) => {
			if(err){
				lError(`[installProtobuf] An error occured while installing Protobuf`);
				lError(err.message.red);
				lError(stderr);
				return reject(stderr);
			}

			lSuccess(`Protobuf has succesfully been installed`);
			return resolve();
		})
	});
}

function installPylon() {

	return new Promise((resolve, reject) => {
		l();

		let pylonZippedLocation = path.join(__dirname,'files');

		let commands = [
			  `cd ${pylonZippedLocation}`,
			  'tar xf pylon-5.0.5.9000-x86_64.tar.gz',
			  'cd pylon-5.0.5.9000-x86_64',
			  'sudo tar -C /opt -xzf pylonSDK*.tar.gz',
			  './setup-usb.sh'
		];

		let hugeCommand = commands.join("; ") + ";";
		let shellCmd = makeShellCommand(hugeCommand);

		lInfo(`Pylon allows SSL-Vision to work with our Basler cameras. I'm building Pylon...`);
		lInfo(`Running command ${hugeCommand.yellow}`);

		exec(shellCmd, (err, stdout, stderr) => {
			if(err){
				lError(`[installPylon] An error occured while building Pylon`);
				lError(err.message.red);
				lError(stderr);
				return reject(stderr);
			}

			lSuccess(`Pylon has succesfully been build`);
			return resolve();
		})
	});
}

// ==== Ensure that all the files have been copied to the right locations ==== //
function ensureFiles(){

	return new Promise((resolve, reject) => {
		l();

		lInfo(`I'm copying all the useful files to the directory ${settings.RTT_ROOT.yellow}...`);
		const mapping = [
			[path.join(__dirname,'files','thumbsup.jpg'),      path.join(settings.RTT_ROOT, 'thumbsup.jpg')],
			[path.join(__dirname,'files','thumbsdown.jpg'),    path.join(settings.RTT_ROOT, 'thumbsdown.jpg')],
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

// ==== Ensure that all the required dependencies have been installed ==== //
function ensureDependencies(){
	return new Promise((resolve, reject) => {
		l();

		lInfo(`I'm ensuring that you have installed all the required dependencies. This might take a while...`);
		const cmd = `sudo apt update && sudo apt install -y ${dependencies}`;
		lInfo(cmd.yellow);
		exec(makeShellCommand(cmd), err => {
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

function ensureRepo(repo, dest, shouldBuild = true){
	return new Promise((resolve, reject) => {
		l();

		lInfo(`I'm installing ${repo.yellow} for you...`);

		const outputDir = path.join(settings.RTT_ROOT, dest);

		let clone = () => {
			const cmd = `git clone https://github.com/${repo}.git ${outputDir} --recurse-submodules`;
			lInfo(`Running command ${cmd.yellow}`);
			lInfo('This may take a while...');
			exec(cmd, (err, stdout, stderr) => {
				if(err){
					lError(`[ensureRepo] An error occured while cloning ${repo.yellow}`);
					lError(cmd.yellow)
					lError(stderr.red);
					return reject(stderr);
				}

				lSuccess(`${repo.yellow} has succesfully been cloned to ${outputDir.yellow}`);
				return resolve();
			})
		}

		// output directory already exists!
		if(fs.existsSync(outputDir)){
			lInquire(`The ${repo.yellow} directory ${outputDir.yellow} already exists. Do you want me to remove it? (y/N)`);
			if(confirmNoDefault()){
				lSuccess(`Not cloning and building ${repo.yellow}`);
				return resolve();
			}

			// Remove the output directory
			lInfo(`Removing directory ${outputDir.yellow}...`);
			fs.remove(outputDir, err => {
				if(err){
					l(`[ensureRepo] error while removing ${outputDir.yellow} (${err.code})`);
					return reject(err);
				}
				lSuccess(`Directory removed!`);
				return clone();
			})
		}else{
			return clone();
		}		
	})
}

function buildGrSimVarTypes(){
	return new Promise((resolve, reject) => {
		l();

		// === Installation instructions according to https://github.com/RoboCup-SSL/grSim/blob/master/INSTALL.md
		let commands = [
			'git clone https://github.com/jpfeltracco/vartypes.git',
			'cd vartypes',
			'mkdir build',
			'cd build',
			'cmake ..',
			'make -j4',
			'sudo make install'
		];
		let hugeCommand = commands.join("; ") + ";";
		let shellCmd = makeShellCommand(hugeCommand);

		lInfo(`VarTypes is needed to run grSim. I'm building VarTypes...`);
		lInfo(`Running command ${hugeCommand.yellow}`);

		exec(shellCmd, (err, stdout, stderr) => {
			if(err){
				lError(`[buildGrSimVarTypes] An error occured while building the VarTypes for grSim`);
				lError(err.message.red);
				lError(stderr);
				return reject(stderr);
			}

			lSuccess(`The VarTypes for grSim has succesfully been build`);
			return resolve();
		})
	});
}

function buildGrSim(){
	return new Promise((resolve, reject) => {
		l();

		let cmd = `cd ${path.join(settings.RTT_ROOT, 'grSim')} && rm -rf build && mkdir build && cd build && cmake .. && make -j4 && sleep 5`;
		let shellCmd = makeShellCommand(cmd);

		lInfo(`I'm building grSim...`);
		lInfo(`Running command ${cmd.yellow}`);

		exec(shellCmd, (err, stdout, stderr) => {
			if(err){
				lError(`[buildGrSim] An error occured while building grSim`);
				lError(err.message.red);
				lError(stderr);
				return reject(stderr);
			}

			lSuccess(`grSim has succesfully been build in ${path.join(settings.RTT_ROOT, 'grSim').yellow}! Run it using ${"./bin/grsim".yellow}`);
			return resolve();
		})
	});	
}

function buildSSLVision(){
	return new Promise((resolve, reject) => {
		l();

		let commands = [
			`cd ${path.join(settings.RTT_ROOT, 'ssl-vision')}`,
			'mkdir build', 'cd build',
			'cmake .. -DUSE_QT5=true -DUSE_PYLON=true -DUSE_DC1394=true -DUSE_V4L=true',
			'make -j4']
		
		let hugeCmd = commands.join(" && ") + ";";

		let shellCmd = makeShellCommand(hugeCmd);

		lInfo(`I'm building ssl-vision...`);
		lInfo(`Running command ${hugeCmd.yellow}`);

		exec(shellCmd, (err, stdout, stderr) => {
			if(err){
				lError(`[buildSSLVision] An error occured while building ssl-vision`);
				lError(err.message.red);
				lError(stderr);
				return reject(stderr);
			}

			lSuccess(`ssl-vision has succesfully been build in ${path.join(settings.RTT_ROOT, 'ssl-vision').yellow}! Run it using ${"./bin/vision".yellow}`);
			return resolve();
		})
	});
}

function buildSSLRefbox(){
	return new Promise((resolve, reject) => {
		l();

		let cmd = `cd ${path.join(settings.RTT_ROOT, 'ssl-refbox')} && make`;
		let shellCmd = makeShellCommand(cmd);

		lInfo(`I'm building ssl-refbox...`);
		lInfo(`Running command ${cmd.yellow}`);

		exec(shellCmd, (err, stdout, stderr) => {
			if(err){
				lError(`[buildSSLRefbox] An error occured while building ssl-refbox`);
				lError(err.message.red);
				lError(stderr);
				return reject(stderr);
			}

			lSuccess(`ssl-refbox has succesfully been build in ${path.join(settings.RTT_ROOT, 'ssl-refbox').yellow}! Run it using ${"./ssl-refbox".yellow}`);
			return resolve();
		})
	});
}

function removeModemManager(){
	return new Promise((resolve, reject) => {
		l();
		let cmd = `sudo apt purge modemmanager -y`;

		lInfo(`I'm removing ${"modemmanager".yellow} for you, because it interferes with the basestations`);
		lInfo(`I'm running the command ${cmd.yellow}`);

		exec(makeShellCommand(cmd), {encoding : 'utf8'}, (err, output) => {
			if(err){
				lError(`[removeModemManager] An error occured while removing ${"modemmanager".yellow}!`);
				lError(err.message.red);
				lError(stderr);
				return reject(stderr);
			}
			lSuccess(`${"modemmanager".yellow} has been removed`);
			return resolve();
		})
	})
}

function addUserToDialoutGroup(){
	return new Promise((resolve, reject) => {
		l();
		let cmd = `sudo adduser ${user} dialout`;

		lInfo(`I'm adding you to the ${"dialout".yellow} group, which is required to communicate with the basestations`);
		lInfo(`I'm running the command ${cmd.yellow}`);

		exec(makeShellCommand(cmd), {encoding : 'utf8'}, (err, output) => {
			if(err){
				lError(`[addUserToDialoutGroup] An error occured while adding you to the ${"dialout".yellow} group!`);
				lError(err.message.red);
				lError(stderr);
				return reject(stderr);
			}
			lSuccess(`You have been added to the ${"dialout".yellow} group`);
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
		RTT_REPOS  : RTT_ROOT,
		settingsChanged : false,

		setRTT_ROOT : function(rtt_root){
			this.RTT_ROOT = rtt_root;
			lInfo(`[settings] Changing RTT_ROOT to ${this.RTT_ROOT.yellow}`);
			
			this.RTT_BASHRC = path.join(this.RTT_ROOT, 'rtt_bashrc');
			lInfo(`[settings] Changing RTT_BASHRC to ${this.RTT_BASHRC.yellow}`);

			this.RTT_REPOS = rtt_root
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

function printLogoSmall(){
l(`
                                        
                                        ${"▟██▀▀██▙   ▟███▀▀██▙".red}
 _______                               ${"▟███▅▅██████████▅▅███▙".red}
┃   __  ╲                                      ${"█████".red}      
┃  ┃  ╲  ┃    ______     _______      ______   ${"█████".red}   ______    _______     ______________
┃  ┃__╱  ┃   ╱  __  ╲   ┃   __  ╲    ╱  __  ╲  ${"█████".red}  ╱  __  ╲   ╲____  ╲   ┃   __    __   ╲
┃      _╱   ┃  ┃  ┃  ┃  ┃  ┃__┃  )  ┃  ┃  ┃  ┃ ${"█████".red} ┃  ┃__┃  )   ____┃  ┃  ┃  ┃  ┃  ┃  ┃  ┃
┃  ┃╲  ╲    ┃  ┃  ┃  ┃  ┃   __  (   ┃  ┃  ┃  ┃ ${"█████".red} ┃   ____╱   ╱  __   ┃  ┃  ┃  ┃  ┃  ┃  ┃
┃  ┃ ╲  ╲   ┃  ┃__┃  ┃  ┃  ┃__┃  )  ┃  ┃__┃  ┃ ${"█████".red} ┃  ┃_____  (  ┃__┃  ┃  ┃  ┃  ┃  ┃  ┃  ┃
┃__┃  ╲__╲   ╲______╱   ┃_______╱    ╲______╱  ${"█████".red}  ╲______╱   ╲_______┃  ┃__┃  ┃__┃  ┃__┃
                                               ${"█████".red}  _   _    ____   __  _   _____    ____
                                               ${"█████".red} ┃ ┃_┃ ┃  ╱ __ ╲ ┃  ╲┃ ┃ ┃__ __┃  ╱ __ ╲
                                               ${"█████".red} ┃ ┃ ┃ ┃ ┃  ___╱ ┃ ┃ ┃ ┃   ┃ ┃   ┃  ___╱
                                               ${"█████".red} ┃_____┃  ╲____╱ ┃_┃╲__┃   ┃_┃    ╲____╱
`)
}
