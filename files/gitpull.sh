for d in src/*; do (cd "$d" && echo -e "\n\n\n========== $d " && git rev-parse --abbrev-ref HEAD && git pull); done

