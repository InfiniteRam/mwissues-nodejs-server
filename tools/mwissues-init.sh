#!/bin/sh
# kFreeBSD do not accept scripts as interpreters, using #!/bin/sh and sourcing.
if [ true != "$INIT_D_SCRIPT_SOURCED" ] ; then
    set "$0" "$@"; INIT_D_SCRIPT_SOURCED=true . /lib/init/init-d-script
fi
### BEGIN INIT INFO
# Provides:          mwissues
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: MwIssues server
### END INIT INFO

# Author: Bastien Brunnenstein

MWISSUES_USER=pi
MWISSUES_PATH=~pi/mwissues-nodejs-server

DESC="MwIssues server"

DAEMON="${MWISSUES_PATH}/index.js"

PIDFILE="${MWISSUES_PATH}/mwissues.pid"

START_ARGS="--background --user ${MWISSUES_USER} --chuid ${MWISSUES_USER} --chdir ${MWISSUES_PATH} --make-pidfile"
STOP_ARGS="--user ${MWISSUES_USER}"

do_stop_cmd() {
    kill `cat $PIDFILE`
    rm -f $PIDFILE
    return $?
}
