gnome-terminal -- bash -c "sleep 1 && while true; do roscore; done;" &
gnome-terminal -- bash -c "sleep 4 && while true; do rosrun roboteam_robothub roboteam_robothub; done;" &
gnome-terminal -- bash -c "sleep 5 && while true; do rosrun roboteam_vision roboteam_vision; done;" &
gnome-terminal -- bash -c "sleep 6 && while true; do cd grsim; ./bin/grsim; done;"
gnome-terminal -- bash -c "sleep 6 && while true; do rosrun roboteam_world run_world.sh; done;"

