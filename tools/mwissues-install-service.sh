#!/bin/sh
# Author: Bastien Brunnenstein

if [ $(id -u) -ne 0 ]; then
  echo 'You '
  return 1
fi

if [ ! -e tools/issues-mysql.sql ]; then
  echo 'Make sure you are in the right directory (mwissues-nodejs-server) and try again'
  return 1
fi

# Stop on error
set -e

# This script must be run as root
# Parameter 1 is username
MWUSER=$1
if [ -z $MWUSER ]; then
  MWUSER=$USER
fi;
MWPATH=`pwd`

echo 'Installing MwIssues service...'

# Replace MWISSUES_USER and MWISSUES_PATH in the service
< tools/mwissues-init.sh \
sed -e "s%\(MWISSUES_USER=\).*$%\1${MWUSER}%" \
    -e "s%\(MWISSUES_PATH=\).*$%\1${MWPATH}%" \
> /etc/init.d/mwissues

chmod +x /etc/init.d/mwissues

# Register it
update-rc.d mwissues defaults

echo 'Starting MwIssues service...'

service mwissues start
