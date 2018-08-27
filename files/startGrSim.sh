gnome-terminal --geometry=70x3+0+0        -x bash -c "sleep 1 && while true; do roscore; done;" &
gnome-terminal --geometry=135x29+700+0    -x bash -c "sleep 2 && while true; do roslaunch roboteam_tactics startGrSim.launch; done;" &
gnome-terminal --geometry=70x7+0+105      -x bash -c "sleep 4 && while true; do rosrun roboteam_robothub roboteam_robothub; done;" &
gnome-terminal --geometry=70x11+0+250     -x bash -c "sleep 5 && while true; do rosrun roboteam_vision roboteam_vision; done;" &
gnome-terminal --geometry=70x18+0+460     -x bash -c "sleep 6 && while true; do rosrun roboteam_world run_world.sh; done;" &
gnome-terminal --geometry=135x29+700+550  -x bash -c "sleep 7 && while true; do roslaunch roboteam_tactics SafeStrategyNode.launch; sleep 100; done;" &

# gnome-terminal --geometry=34x10+0+9999    -x bash -c "sleep 8 && rosbag record -O robotcommands_$(date +%s) /robotcommands" &
# gnome-terminal --geometry=34x10+370+9999  -x bash -c "sleep 8 && rosbag record -O roledirective_$(date +%s) /role_directive" &