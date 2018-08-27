if which node > /dev/null
then
	echo "Nodejs is installed, skipping..."
else
	echo "Installing nodejs"
	curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
	sudo apt update
	sudo apt install -y nodejs
	echo "Nodejs installed"
fi

if which git > /dev/null
then
	echo "git is installed, skipping..."
else
	echo "Installing git"
	sudo apt install -y git
	echo "Git installed"
fi

echo "Installing nodejs packages..."
npm install
echo "Nodejs packages installed"

echo "Running install script..."
node rtt_setup.js
echo "Install script finished"