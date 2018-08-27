gnome-terminal --geometry=90x6+0+0        -x bash -c "sleep 1 && roscore" &
gnome-terminal --geometry=115x29+870+0    -x bash -c "sleep 2 && roslaunch roboteam_tactics startSerial.launch" &
gnome-terminal --geometry=90x12+0+160     -x bash -c "sleep 4 && rosrun roboteam_robothub roboteam_robothub" &
gnome-terminal --geometry=90x18+0+420     -x bash -c "sleep 5 && rosrun roboteam_vision roboteam_vision" &
gnome-terminal --geometry=90x18+0+740     -x bash -c "sleep 6 && rosrun roboteam_world run_world.sh" &
gnome-terminal --geometry=115x29+870+550  -x bash -c "sleep 7 && roslaunch roboteam_tactics SafeStrategyNode.launch" &