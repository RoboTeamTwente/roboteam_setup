#!/bin/bash

ensure_trizen() {
	if [ -f /usr/bin/trizen ]; then 
		echo "Found trizen";
		return;
	fi;
	
	echo "Could not find trizen";
	echo "Installing trizen...";
	git clone https://aur.archlinux.org/trizen.git;
	cd trizen;
	makepkg -si;
	cd ..;
	echo "Installed trizen";
	echo "Updating local packages and package lists...";
	trizen -Syu;
	echo "Updated local packages and package lists!"
}

ensure_all() {
	ensure_trizen
	echo "Installing dependencies... (Skipping if already present)"
	echo "This might take a while, due to zmqpp and armadillo, do not cancel."
	trizen -S zmqpp armadillo cmake protobuf zeromq gtest boost --needed
	echo "Installed dependencies :)"

	echo "Keep in mind the repositories themselves are not cloned, you'll have to do that yourself";
}

ensure_all