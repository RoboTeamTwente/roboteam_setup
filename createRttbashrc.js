const path = require('path');

function create(settings){
return `
source /opt/ros/kinetic/setup.bash

# Export RTT_ROOT, indicating the root of the RoboTeam Twente folder
export RTT_ROOT=${settings.RTT_ROOT}
# Set languages for which ROS messages do NOT have to be generated. Enabled: gencpp gennodejs genpy
export ROS_LANG_DISABLE=genlisp:geneus
# Set formatting for ROS logging
export ROSCONSOLE_FORMAT='[\${severity}][\${logger}]: \${message}'
# Set the path for rosconsole.config, which defines ROS logging levels
export ROSCONSOLE_CONFIG_FILE=${path.join(settings.RTT_ROOT, 'rosconsole.config')}
# source the setup for the workspace
source ${path.join(settings.RTT_ROOT, 'workspace', 'devel', 'setup.bash')}

function rtt_build() {
    (
        # cd directly to the workspace where the repos are located
        cd ${path.join(settings.RTT_ROOT, 'workspace')}

        # run the command
        eval $1

        # Check if command succeeded
        if [ $? -eq 0 ]; then
            notify-send -u critical -i ${path.join(settings.RTT_ROOT, 'thumbsup.jpg')} "Compilation message" "Compilation succeeded!"
        else
            notify-send -u critical -i ${path.join(settings.RTT_ROOT, 'thumbsdown.jpg')} "Compilation message" "Compilation failed!"
        fi
    )
}

alias rtt="cd ${settings.RTT_ROOT}"
alias rtt_make="rtt_build catkin_make"
alias rtt_nuke="rtt_build \\"catkin_make clean && catkin_make\\""
alias TestX="rosrun roboteam_tactics TestX"
alias rosrung="rosrun --prefix \\"gdb --args\\""
printf "\\n[rtt_bashrc] RTT_ROOT=${settings.RTT_ROOT} | setting aliases rtt, rtt_make, rtt_nuke, TestX, rosrung\\n"


_GetTestXOptions () {
    local cur prev words cword
    _init_completion || return
    COMPREPLY=()
    local words=$(TestX show all | grep -E ".?- .?$" | sed -E "s/.?- (.?)$/\\1/" )
    COMPREPLY=( $( compgen -W '\${words}' -- "$cur") )
    return 0
}

complete -F _GetTestXOptions TestX
    
switchSides () {
    side="$(rosparam get our_side)"

    if [ "$side" = "left" ]; then
        rosparam set our_side right
        printf "Switched to right side"
    elif [ "$side" = "right" ]; then
        rosparam set our_side left
        printf "Switched to left side"
    else
        printf "Could not switch sides"
    fi

    printf "\\n"
}
`}

module.exports = {
	create
}