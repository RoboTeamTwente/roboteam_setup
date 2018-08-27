# Check curl
if which curl > /dev/null
then
	echo "curl is installed, skipping..."
else
	echo "Installing curl"
	sudo apt update
	sudo apt install -y curl
	echo "curl installed"
fi

# Check nodejs
if which node > /dev/null
then
	echo "nodejs is installed, skipping..."
else
	echo "Installing nodejs"
	curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
	sudo apt update
	sudo apt install -y nodejs
	echo "nodejs installed"
fi

# Check npm
if which npm > /dev/null
then
	echo "npm is installed, skipping..."
else
	echo "Installing npm"
	sudo apt update
	sudo apt install -y npm
	echo "npm installed"
fi

# check git
if which git > /dev/null
then
	echo "git is installed, skipping..."
else
	echo "Installing git"
	sudo apt update
	sudo apt install -y git
	echo "git installed"
fi

echo "Installing nodejs packages..."
npm install
echo "nodejs packages installed"

echo "Running install script..."
node rtt_setup.js
echo "Install script finished"