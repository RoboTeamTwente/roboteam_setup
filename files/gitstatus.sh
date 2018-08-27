for d in src/*; do (cd "$d" && echo -e "\n\n\n========== $d ==========" && git status); done

