#!/bin/sh

# This script must be run as root
# Parameter 1 is username
MWUSER=$1
if [ -z $MWUSER ]; then
  MWUSER=$USER
fi;
MWPATH=`pwd`

# Replace MWISSUES_USER and MWISSUES_PATH in the service
< tools/mwissues-init.sh \
sed -e "s%\(MWISSUES_USER=\).*$%\1${MWUSER}%" \
    -e "s%\(MWISSUES_PATH=\).*$%\1${MWPATH}%" \
> /etc/init.d/mwissues

# Register it
update-rc.d mwissues defaults
